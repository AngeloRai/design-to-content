#!/usr/bin/env node

/**
 * COLOR EXTRACTOR - Pixel-perfect color sampling using Playwright
 *
 * Solves the Vision LLM color hallucination problem by directly sampling
 * pixel colors from screenshots using browser canvas APIs.
 *
 * Why this works:
 * - Vision LLMs have training bias (see "blue" for black primary buttons)
 * - Direct pixel sampling is 100% accurate
 * - Uses Playwright (already installed) - no external dependencies
 */

import { chromium } from 'playwright';

/**
 * Extract exact colors from specific regions of an image
 *
 * @param {string} imageUrl - URL or data URL of the image
 * @param {Array<{name: string, x: number, y: number, width: number, height: number}>} regions - Regions to sample
 * @returns {Promise<Array<{name: string, backgroundColor: string, samples: Array}>>}
 *
 * @example
 * const regions = [
 *   { name: 'primary-button', x: 100, y: 200, width: 120, height: 40 },
 *   { name: 'secondary-button', x: 100, y: 250, width: 120, height: 40 }
 * ];
 * const colors = await extractColorsFromRegions('https://...', regions);
 * // Returns: [{ name: 'primary-button', backgroundColor: '#000000', ... }]
 */
export async function extractColorsFromRegions(imageUrl, regions) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Create an HTML page with canvas for pixel sampling
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 20px; }
            #canvas { border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <canvas id="canvas"></canvas>
          <img id="sourceImage" style="display:none;">
        </body>
      </html>
    `);

    // Load the image
    await page.evaluate((url) => {
      return new Promise((resolve, reject) => {
        const img = document.getElementById('sourceImage');
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });
    }, imageUrl);

    // Get image dimensions and set up canvas
    const { width: imgWidth, height: imgHeight } = await page.evaluate(() => {
      const img = document.getElementById('sourceImage');
      const canvas = document.getElementById('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      return {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    });

    console.log(`📐 Image dimensions: ${imgWidth}x${imgHeight}`);

    // Sample colors from each region
    const results = [];

    for (const region of regions) {
      console.log(`🎨 Sampling region: ${region.name} at (${region.x}, ${region.y})`);

      const colorData = await page.evaluate((reg) => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        // Sample multiple points within the region to get dominant color
        const samples = [];
        const samplePoints = 5; // Sample 5x5 grid

        for (let i = 0; i < samplePoints; i++) {
          for (let j = 0; j < samplePoints; j++) {
            const x = reg.x + Math.floor((i / samplePoints) * reg.width);
            const y = reg.y + Math.floor((j / samplePoints) * reg.height);

            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const hex = '#' + [pixel[0], pixel[1], pixel[2]]
              .map(c => c.toString(16).padStart(2, '0'))
              .join('');

            samples.push({
              x,
              y,
              rgb: { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] },
              hex
            });
          }
        }

        // Find most common color (dominant)
        const colorCounts = {};
        samples.forEach(s => {
          colorCounts[s.hex] = (colorCounts[s.hex] || 0) + 1;
        });

        const dominantColor = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])[0][0];

        // Get center pixel for text color (typically different from background)
        const centerX = reg.x + Math.floor(reg.width / 2);
        const centerY = reg.y + Math.floor(reg.height / 2);
        const centerPixel = ctx.getImageData(centerX, centerY, 1, 1).data;
        const centerHex = '#' + [centerPixel[0], centerPixel[1], centerPixel[2]]
          .map(c => c.toString(16).padStart(2, '0'))
          .join('');

        return {
          backgroundColor: dominantColor,
          centerColor: centerHex,
          samples: samples.map(s => s.hex),
          colorDistribution: colorCounts
        };
      }, region);

      results.push({
        name: region.name,
        ...colorData
      });

      console.log(`  → Background: ${colorData.backgroundColor}`);
      console.log(`  → Center: ${colorData.centerColor}`);
    }

    return results;

  } finally {
    await browser.close();
  }
}

/**
 * Extract dominant colors from entire image (useful for palette generation)
 *
 * @param {string} imageUrl - URL or data URL of the image
 * @param {number} maxColors - Maximum number of colors to extract
 * @returns {Promise<Array<{hex: string, percentage: number}>>}
 */
export async function extractDominantColors(imageUrl, maxColors = 5) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <canvas id="canvas"></canvas>
          <img id="sourceImage" style="display:none;">
        </body>
      </html>
    `);

    await page.evaluate((url) => {
      return new Promise((resolve, reject) => {
        const img = document.getElementById('sourceImage');
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });
    }, imageUrl);

    const palette = await page.evaluate((max) => {
      const img = document.getElementById('sourceImage');
      const canvas = document.getElementById('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Sample every 10th pixel for performance
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colorCounts = {};
      const totalPixels = Math.floor(data.length / 4 / 100); // Sample 1% of pixels

      for (let i = 0; i < data.length; i += 400) { // Every 100th pixel
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const hex = '#' + [r, g, b]
          .map(c => c.toString(16).padStart(2, '0'))
          .join('');

        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      // Get top N colors
      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, max);

      const total = sortedColors.reduce((sum, [, count]) => sum + count, 0);

      return sortedColors.map(([hex, count]) => ({
        hex,
        percentage: ((count / total) * 100).toFixed(2)
      }));
    }, maxColors);

    return palette;

  } finally {
    await browser.close();
  }
}

/**
 * Helper: Convert RGB to Hex
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Helper: Convert Hex to RGB
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export default {
  extractColorsFromRegions,
  extractDominantColors,
  rgbToHex,
  hexToRgb
};
