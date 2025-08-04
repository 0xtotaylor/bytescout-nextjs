/**
 * @fileoverview ByteScout Auto API SDK for Next.js
 * 
 * This module provides a complete solution for automatically generating API endpoints
 * from your Next.js pages. It includes middleware for processing requests, caching
 * capabilities, and extensive configuration options.
 * 
 * @example Basic Usage
 * ```typescript
 * // next.config.js
 * const { withAutoApi } = require('@bytescout/nextjs');
 * 
 * module.exports = withAutoApi({
 *   // your Next.js config
 * }, {
 *   apiPrefix: '/api/pages',
 *   enableCache: true
 * });
 * ```
 * 
 * @example Advanced Configuration
 * ```typescript
 * // middleware.ts
 * import { withAutoApiMiddleware } from '@bytescout/nextjs';
 * 
 * export default withAutoApiMiddleware({
 *   enabled: process.env.NODE_ENV === 'production',
 *   apiPrefix: '/data-api',
 *   excludePaths: ['/admin/*', '/private'],
 *   enableCache: true,
 *   cacheDuration: 1800,
 *   additionalHeaders: {
 *     'Cache-Control': 'public, max-age=300',
 *     'X-API-Version': '1.0'
 *   }
 * });
 * ```
 * 
 * @author ByteScout
 * @version 1.0.5
 * @license MIT
 */

import { NextConfig } from "next";

import { 
  AutoApiConfig, 
  SDK_CONSTANTS, 
  AutoApiError, 
  AutoApiErrorType 
} from "./types";
import { withAutoApiMiddleware, clearExpiredCache, getCacheStats } from "./middleware";

/**
 * Higher-order function to add Auto API functionality to Next.js configuration
 * @param nextConfig - The original Next.js configuration object (default: {})
 * @param autoApiConfig - Configuration options for Auto API (default: {})
 * @returns Modified Next.js configuration object with Auto API support
 */
export function withAutoApi(
  nextConfig: NextConfig = {},
  autoApiConfig: AutoApiConfig = {}
): NextConfig {
  return {
    ...nextConfig,
    async rewrites() {
      // Retrieve the original rewrites configuration, defaulting to an empty array if undefined
      const originalRewrites = await (nextConfig.rewrites?.() ??
        Promise.resolve([]));

      // Define the API rewrite rule, using the provided apiPrefix or defaulting to "/api"
      const apiRewrite = {
        source: `${autoApiConfig.apiPrefix || "/api"}/:path*`,
        destination: "/:path*",
      };

      // Handle different rewrite configurations based on the structure of originalRewrites
      if (Array.isArray(originalRewrites)) {
        // For array configurations, prepend the apiRewrite to maintain priority
        return [apiRewrite, ...originalRewrites];
      }
      // For object configurations, add apiRewrite to the beforeFiles array
      return {
        beforeFiles: [apiRewrite, ...(originalRewrites.beforeFiles || [])],
        afterFiles: originalRewrites.afterFiles || [],
        fallback: originalRewrites.fallback || [],
      };
    },
  };
}

/**
 * Creates a middleware function with the provided configuration.
 * 
 * This is a convenience function that combines configuration and middleware creation
 * into a single step. It's equivalent to calling `withAutoApiMiddleware(config)`.
 * 
 * @param config - Auto API configuration options
 * @returns Configured middleware function
 * 
 * @example
 * ```typescript
 * // middleware.ts
 * import { createAutoApiMiddleware } from '@bytescout/nextjs';
 * 
 * export default createAutoApiMiddleware({
 *   apiPrefix: '/data',
 *   enableCache: true,
 *   cacheDuration: 600
 * });
 * ```
 * 
 * @public
 */
export function createAutoApiMiddleware(config: AutoApiConfig = {}) {
  return withAutoApiMiddleware(config);
}

/**
 * Utility function to clear expired cache entries.
 * 
 * This function can be used to manually clean up expired cache entries,
 * which is useful for long-running applications or when implementing
 * custom cache management strategies.
 * 
 * @param cacheDuration - Cache validity duration in seconds
 * @returns Number of entries that were removed from cache
 * 
 * @example
 * ```typescript
 * import { clearCache } from '@bytescout/nextjs';
 * 
 * // Clear entries older than 1 hour
 * const removed = clearCache(3600);
 * console.log(`Removed ${removed} expired cache entries`);
 * ```
 * 
 * @public
 */
export function clearCache(cacheDuration: number = SDK_CONSTANTS.DEFAULT_CACHE_DURATION): number {
  if (!Number.isInteger(cacheDuration) || cacheDuration < 1) {
    throw new AutoApiError(
      'cacheDuration must be a positive integer',
      AutoApiErrorType.INVALID_CONFIG
    );
  }
  
  return clearExpiredCache(cacheDuration);
}

/**
 * Gets current cache statistics.
 * 
 * This function provides insights into the current state of the Auto API cache,
 * including the number of entries, total size, and average entry size.
 * 
 * @returns Object containing cache statistics
 * 
 * @example
 * ```typescript
 * import { getCacheStatistics } from '@bytescout/nextjs';
 * 
 * const stats = getCacheStatistics();
 * console.log(`Cache contains ${stats.entries} entries using ${stats.totalSize} bytes`);
 * ```
 * 
 * @public
 */
export function getCacheStatistics() {
  return getCacheStats();
}

// Export all types and the main middleware function
export { 
  withAutoApiMiddleware, 
  AutoApiConfig, 
  PageData, 
  AutoApiError, 
  AutoApiErrorType,
  SDK_CONSTANTS 
};

// Export default configuration for easy imports
export const defaultConfig: Required<AutoApiConfig> = {
  enabled: true,
  apiPrefix: SDK_CONSTANTS.DEFAULT_API_PREFIX,
  excludePaths: [],
  additionalHeaders: {},
  enableCache: false,
  cacheDuration: SDK_CONSTANTS.DEFAULT_CACHE_DURATION,
  receiverUsername: undefined,
  maxCacheSize: SDK_CONSTANTS.DEFAULT_MAX_CACHE_SIZE,
  requestTimeout: SDK_CONSTANTS.DEFAULT_REQUEST_TIMEOUT,
};

/**
 * Version information for the ByteScout Next.js SDK.
 * 
 * @public
 */
export const version = '1.0.5';
