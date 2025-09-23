#!/usr/bin/env node

/**
 * OpenAI Batch Processor - Handles large-scale API calls intelligently
 * Processes nodes in chunks to avoid overwhelming the API
 */

import { checkOpenAIStatus } from "../test/test-openai.js";

// Configuration
const BATCH_CONFIG = {
  maxBatchSize: 10, // Process 10 nodes at a time
  delayBetweenBatches: 1000, // 1 second delay between batches
  maxRetries: 3, // Retry failed requests up to 3 times
  retryDelay: 2000, // Start with 2 second retry delay
  backoffMultiplier: 2, // Double delay on each retry
};

/**
 * Process nodes in batches with OpenAI
 * @param {Array} nodes - Array of Figma nodes to process
 * @param {Function} aiProcessor - Function that calls OpenAI for a single node
 * @param {Object} options - Processing options including API key
 */
export async function processBatchWithAI(nodes, aiProcessor, options = {}) {
  const config = { ...BATCH_CONFIG, ...options.batchConfig };
  const results = new Map();
  const errors = [];

  // Check if OpenAI is available first
  const apiStatus = await checkOpenAIStatus();
  if (!apiStatus.working) {
    console.log(
      "⚠️ OpenAI API not available, falling back to basic processing"
    );
    return { results, errors, fallbackUsed: true };
  }

  // Split nodes into batches
  const batches = [];
  for (let i = 0; i < nodes.length; i += config.maxBatchSize) {
    batches.push(nodes.slice(i, i + config.maxBatchSize));
  }

  console.log(
    `   📦 Processing ${nodes.length} nodes in ${batches.length} batches...`
  );

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(
      `   🔄 Batch ${batchIndex + 1}/${batches.length}: Processing ${batch.length} nodes...`
    );

    // Process nodes in current batch in parallel
    const batchPromises = batch.map(async (node) => {
      try {
        const result = await retryWithBackoff(
          () => aiProcessor(node, options),
          config.maxRetries,
          config.retryDelay,
          config.backoffMultiplier
        );
        return { node, result, success: true };
      } catch (error) {
        console.log(
          `      ⚠️ Failed to process ${node.name}: ${error.message}`
        );
        return { node, error: error.message, success: false };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Store results
    batchResults.forEach(({ node, result, error, success }) => {
      if (success) {
        results.set(node.id, result);
      } else {
        errors.push({ nodeId: node.id, name: node.name, error });
      }
    });

    // Progress update
    const processedCount = (batchIndex + 1) * config.maxBatchSize;
    const percentage = Math.min(
      100,
      Math.round((processedCount / nodes.length) * 100)
    );
    console.log(
      `   ✅ Progress: ${percentage}% (${Math.min(processedCount, nodes.length)}/${nodes.length})`
    );

    // Delay between batches to avoid rate limiting
    if (batchIndex < batches.length - 1) {
      await delay(config.delayBetweenBatches);
    }
  }

  console.log(
    `   📊 Batch processing complete: ${results.size} successful, ${errors.length} errors`
  );

  return { results, errors, fallbackUsed: false };
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries, initialDelay, multiplier) {
  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.log(
          `      🔄 Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`
        );
        await delayMs(delay);
        delay *= multiplier;
      }
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
  // Retry on rate limits, timeouts, and service errors
  const retryableStatuses = [429, 500, 502, 503, 504];

  if (error.status && retryableStatuses.includes(error.status)) {
    return true;
  }

  // Retry on network errors
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
    return true;
  }

  return false;
}

/**
 * Simple delay function
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function delayMs(ms) {
  return delay(ms);
}

/**
 * Create a batch-aware AI processor wrapper
 */
export function createBatchedAIProcessor(singleNodeProcessor) {
  return async function (nodes, options) {
    // If it's a single node, process directly
    if (!Array.isArray(nodes)) {
      return singleNodeProcessor(nodes, options);
    }

    // For multiple nodes, use batch processing
    const { results, errors, fallbackUsed } = await processBatchWithAI(
      nodes,
      singleNodeProcessor,
      options
    );

    // Return results in a format compatible with existing code
    return {
      processed: Array.from(results.values()),
      errors,
      fallbackUsed,
    };
  };
}

export default processBatchWithAI;
