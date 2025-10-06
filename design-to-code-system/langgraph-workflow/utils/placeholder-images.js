#!/usr/bin/env node

/**
 * PLACEHOLDER IMAGE UTILITY
 * Generate placeholder image URLs for Storybook stories
 *
 * Uses external services to provide working image URLs:
 * - UI Avatars API for avatar images (generates from initials)
 * - Placeholder.com for simple placeholder images
 * - Picsum Photos for realistic photo placeholders (backgrounds, hero images)
 */

/**
 * Generate placeholder avatar URL from name/initials
 * Uses UI Avatars API which generates colorful avatar images
 *
 * @param {string} name - Name to generate avatar from (e.g., "John Doe" → "JD")
 * @param {number} size - Size in pixels (default: 128)
 * @returns {string} Avatar image URL
 */
export function getPlaceholderAvatarUrl(name = "User", size = 128) {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&size=${size}&background=random`;
}

/**
 * Generate simple placeholder image URL with dimensions and text
 * Uses Placeholder.com for generic placeholder images with text
 *
 * @param {number} width - Image width in pixels (default: 400)
 * @param {number} height - Image height in pixels (default: 300)
 * @param {string} text - Text to display on image (default: "Image")
 * @returns {string} Placeholder image URL
 */
export function getPlaceholderImageUrl(width = 400, height = 300, text = "Image") {
  const encoded = encodeURIComponent(text);
  return `https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encoded}`;
}

/**
 * Generate realistic photo placeholder from Picsum Photos
 * Perfect for backgrounds, hero images, cards with photos
 *
 * @param {number} width - Image width in pixels (default: 1200)
 * @param {number} height - Image height in pixels (default: 800)
 * @param {boolean} grayscale - Whether to return grayscale image (default: false)
 * @param {boolean} blur - Whether to blur the image (default: false)
 * @returns {string} Photo placeholder URL
 */
export function getPlaceholderPhotoUrl(width = 1200, height = 800, grayscale = false, blur = false) {
  let url = `https://picsum.photos/${width}/${height}`;

  const params = [];
  if (grayscale) params.push('grayscale');
  if (blur) params.push('blur');

  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  return url;
}

/**
 * Intelligently generate placeholder image based on component and prop context
 * Determines type of placeholder (avatar, photo, simple) based on naming and size
 *
 * @param {string} componentName - Name of the component (e.g., "Avatar", "Card", "Hero")
 * @param {string} propName - Name of the prop (e.g., "src", "imageUrl", "backgroundImage")
 * @param {Object} options - Optional dimensions {width, height}
 * @returns {string} Appropriate placeholder image URL
 */
export function getComponentPlaceholderImage(componentName, propName, options = {}) {
  const lowerProp = propName.toLowerCase();
  const lowerComp = componentName.toLowerCase();
  const width = options.width || 400;
  const height = options.height || 300;

  // Check if this is an avatar-related prop
  if (lowerProp.includes('avatar') || lowerComp.includes('avatar')) {
    const size = Math.max(width, height, 128);
    return getPlaceholderAvatarUrl(componentName, size);
  }

  // Check for profile/user images
  if (lowerProp.includes('profile') || lowerProp.includes('user')) {
    return getPlaceholderAvatarUrl("User", 128);
  }

  // Check for background/hero/banner images (use real photos)
  if (lowerProp.includes('background') || lowerProp.includes('hero') ||
      lowerProp.includes('banner') || lowerComp.includes('hero') ||
      lowerComp.includes('banner') || width > 800 || height > 600) {
    return getPlaceholderPhotoUrl(width, height);
  }

  // Check for card/thumbnail images with photos
  if (lowerComp.includes('card') || lowerProp.includes('thumbnail') ||
      lowerProp.includes('cover') || lowerProp.includes('photo')) {
    return getPlaceholderPhotoUrl(width, height);
  }

  // Default to simple placeholder
  return getPlaceholderImageUrl(width, height, componentName);
}

/**
 * Get placeholder for specific image dimensions with type hint
 * Useful when component spec includes size requirements
 *
 * @param {Object} options - Image options
 * @param {number} options.width - Desired width
 * @param {number} options.height - Desired height
 * @param {string} options.label - Text to display (for simple placeholders)
 * @param {string} options.type - Type hint: 'avatar', 'photo', 'simple', 'hero'
 * @returns {string} Placeholder image URL
 */
export function getPlaceholderByDimensions({ width = 400, height = 300, label = "Image", type = "simple" }) {
  if (type === 'avatar') {
    const size = Math.max(width, height);
    return getPlaceholderAvatarUrl(label, size);
  }

  if (type === 'photo' || type === 'hero' || type === 'background') {
    return getPlaceholderPhotoUrl(width, height);
  }

  return getPlaceholderImageUrl(width, height, label);
}

export default {
  getPlaceholderAvatarUrl,
  getPlaceholderImageUrl,
  getPlaceholderPhotoUrl,
  getComponentPlaceholderImage,
  getPlaceholderByDimensions
};
