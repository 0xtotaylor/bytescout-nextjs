import { NextResponse, NextRequest } from "next/server";
import * as cheerio from "cheerio";

import { 
  PageData, 
  AutoApiConfig, 
  CachedPageData, 
  SDK_CONSTANTS, 
  AutoApiError, 
  AutoApiErrorType 
} from "./types";

/**
 * In-memory cache storage for page data.
 * 
 * This cache stores processed page data to improve performance and reduce
 * server load. Each entry includes the data, timestamp, and size information.
 * 
 * @internal
 */
const cache = new Map<string, CachedPageData>();

/**
 * Current total size of all cached data in bytes.
 * Used for cache size management and memory monitoring.
 * 
 * @internal
 */
let totalCacheSize = 0;

/**
 * Creates a Next.js middleware function for handling Auto API requests.
 * 
 * This higher-order function validates the configuration and returns a middleware
 * that processes API requests, extracts page data, and handles caching.
 * 
 * @param config - Configuration options for the Auto API middleware
 * @returns A Next.js middleware function ready to be used in middleware.ts
 * 
 * @throws {AutoApiError} When configuration validation fails
 * 
 * @example
 * ```typescript
 * // middleware.ts
 * import { withAutoApiMiddleware } from '@bytescout/nextjs';
 * 
 * const config = {
 *   enabled: true,
 *   apiPrefix: '/api/v1',
 *   enableCache: true,
 *   cacheDuration: 1800
 * };
 * 
 * export default withAutoApiMiddleware(config);
 * ```
 * 
 * @public
 */
export function withAutoApiMiddleware(config: AutoApiConfig = {}) {
  // Validate and normalize configuration
  const validatedConfig = validateAndNormalizeConfig(config);
  
  // Destructure validated configuration with defaults
  const {
    enabled = true,
    apiPrefix = SDK_CONSTANTS.DEFAULT_API_PREFIX,
    excludePaths = [],
    enableCache = false,
    cacheDuration = SDK_CONSTANTS.DEFAULT_CACHE_DURATION,
    additionalHeaders = {},
    receiverUsername,
    maxCacheSize = SDK_CONSTANTS.DEFAULT_MAX_CACHE_SIZE,
    requestTimeout = SDK_CONSTANTS.DEFAULT_REQUEST_TIMEOUT,
  } = validatedConfig;

  /**
   * The main middleware function that processes incoming requests.
   * 
   * This function checks if the request matches the API prefix pattern,
   * validates the request, fetches or retrieves cached page data, and
   * returns the appropriate response.
   * 
   * @param request - The incoming Next.js request object
   * @returns Promise resolving to a Next.js response or next() call
   * 
   * @internal
   */
  return async function middleware(request: NextRequest): Promise<NextResponse> {
    // Skip processing if Auto API is disabled
    if (!enabled) {
      return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    // Check if the request matches the API prefix pattern
    if (!pathname.startsWith(apiPrefix)) {
      return NextResponse.next();
    }

    try {
      // Extract the page path from the API request
      const pagePath = extractPagePath(pathname, apiPrefix);
      
      // Validate the extracted path
      if (!isValidPath(pagePath)) {
        return createErrorResponse(
          'Invalid path format',
          400,
          AutoApiErrorType.INVALID_CONFIG
        );
      }

      // Check if the path should be excluded from processing
      if (isPathExcluded(pagePath, excludePaths)) {
        return NextResponse.next();
      }

      // Fetch page data (from cache or by making a request)
      const pageData = await getPageData(
        request,
        pagePath,
        {
          enableCache,
          cacheDuration,
          receiverUsername,
          maxCacheSize,
          requestTimeout,
        }
      );

      // Create and return the response with page data
      const response = NextResponse.json(pageData, { status: 200 });
      
      // Apply additional headers if configured
      applyAdditionalHeaders(response, additionalHeaders);
      
      return response;
      
    } catch (error) {
      // Handle different types of errors appropriately
      return handleMiddlewareError(error);
    }
  };
}

/**
 * Fetches page data either from cache or by making an HTTP request.
 * 
 * This function handles the complete page data retrieval process, including
 * cache checking, HTTP requests, HTML parsing, and cache storage.
 * 
 * @param request - The incoming Next.js request object
 * @param pagePath - The path of the page to fetch (relative to site root)
 * @param options - Configuration options for data fetching
 * @returns Promise resolving to extracted page data
 * 
 * @throws {AutoApiError} When page fetching or parsing fails
 * 
 * @internal
 */
async function getPageData(
  request: NextRequest,
  pagePath: string,
  options: {
    enableCache: boolean;
    cacheDuration: number;
    receiverUsername?: string;
    maxCacheSize: number;
    requestTimeout: number;
  }
): Promise<PageData> {
  const { enableCache, cacheDuration, receiverUsername, maxCacheSize, requestTimeout } = options;
  
  // Check cache first if enabled
  if (enableCache) {
    const cachedData = getCachedData(pagePath, cacheDuration);
    if (cachedData) {
      return { ...cachedData, receiverUsername };
    }
  }

  try {
    // Construct the full URL for the page
    const pageUrl = constructPageUrl(request, pagePath);
    
    // Fetch the page content with timeout
    const htmlContent = await fetchPageContent(pageUrl, requestTimeout);
    
    // Parse and extract data from HTML
    const extractedData = extractPageData(htmlContent, pagePath, receiverUsername);
    
    // Cache the data if caching is enabled and data is not too large
    if (enableCache && shouldCacheData(extractedData, maxCacheSize)) {
      cachePageData(pagePath, extractedData, maxCacheSize);
    }
    
    return extractedData;
    
  } catch (error) {
    if (error instanceof AutoApiError) {
      throw error;
    }
    
    // Convert generic errors to AutoApiError
    throw new AutoApiError(
      `Failed to fetch page data for path: ${pagePath}`,
      AutoApiErrorType.FETCH_ERROR,
      undefined,
      error as Error
    );
  }
}

/**
 * Validates and normalizes the Auto API configuration.
 * 
 * @param config - Raw configuration object
 * @returns Validated and normalized configuration
 * @throws {AutoApiError} When validation fails
 * 
 * @internal
 */
function validateAndNormalizeConfig(config: AutoApiConfig): Required<AutoApiConfig> {
  const errors: string[] = [];
  
  // Validate apiPrefix
  if (config.apiPrefix !== undefined) {
    if (typeof config.apiPrefix !== 'string' || !config.apiPrefix.startsWith('/')) {
      errors.push('apiPrefix must be a string starting with "/"');
    }
  }
  
  // Validate cacheDuration
  if (config.cacheDuration !== undefined) {
    if (!Number.isInteger(config.cacheDuration) || 
        config.cacheDuration < SDK_CONSTANTS.MIN_CACHE_DURATION || 
        config.cacheDuration > SDK_CONSTANTS.MAX_CACHE_DURATION) {
      errors.push(`cacheDuration must be an integer between ${SDK_CONSTANTS.MIN_CACHE_DURATION} and ${SDK_CONSTANTS.MAX_CACHE_DURATION}`);
    }
  }
  
  // Validate excludePaths
  if (config.excludePaths !== undefined) {
    if (!Array.isArray(config.excludePaths) || 
        !config.excludePaths.every(path => typeof path === 'string')) {
      errors.push('excludePaths must be an array of strings');
    }
  }
  
  // Validate additionalHeaders
  if (config.additionalHeaders !== undefined) {
    if (typeof config.additionalHeaders !== 'object' || config.additionalHeaders === null) {
      errors.push('additionalHeaders must be an object');
    }
  }
  
  if (errors.length > 0) {
    throw new AutoApiError(
      `Configuration validation failed: ${errors.join(', ')}`,
      AutoApiErrorType.INVALID_CONFIG
    );
  }
  
  // Return normalized configuration with defaults
  return {
    enabled: config.enabled ?? true,
    apiPrefix: config.apiPrefix ?? SDK_CONSTANTS.DEFAULT_API_PREFIX,
    excludePaths: config.excludePaths ?? [],
    additionalHeaders: config.additionalHeaders ?? {},
    enableCache: config.enableCache ?? false,
    cacheDuration: config.cacheDuration ?? SDK_CONSTANTS.DEFAULT_CACHE_DURATION,
    receiverUsername: config.receiverUsername,
    maxCacheSize: config.maxCacheSize ?? SDK_CONSTANTS.DEFAULT_MAX_CACHE_SIZE,
    requestTimeout: config.requestTimeout ?? SDK_CONSTANTS.DEFAULT_REQUEST_TIMEOUT,
  };
}

/**
 * Extracts the page path from the API request pathname.
 * 
 * @param pathname - The full request pathname
 * @param apiPrefix - The configured API prefix
 * @returns The extracted page path
 * 
 * @internal
 */
function extractPagePath(pathname: string, apiPrefix: string): string {
  let pagePath = pathname.replace(apiPrefix, '');
  
  // Ensure path starts with '/'
  if (!pagePath.startsWith('/')) {
    pagePath = '/' + pagePath;
  }
  
  // Handle root path
  if (pagePath === '/') {
    return '/';
  }
  
  return pagePath;
}

/**
 * Validates if a path is in the correct format.
 * 
 * @param path - The path to validate
 * @returns True if the path is valid
 * 
 * @internal
 */
function isValidPath(path: string): boolean {
  // Basic path validation - must start with / and contain valid characters
  return typeof path === 'string' && 
         path.startsWith('/') && 
         !/[<>:"|?*]/.test(path) && // Prevent potentially dangerous characters
         path.length <= 2000; // Reasonable length limit
}

/**
 * Checks if a path should be excluded from processing.
 * 
 * @param path - The path to check
 * @param excludePaths - Array of paths/patterns to exclude
 * @returns True if the path should be excluded
 * 
 * @internal
 */
function isPathExcluded(path: string, excludePaths: string[]): boolean {
  return excludePaths.some(excludePath => {
    // Support simple wildcard matching
    if (excludePath.endsWith('/*')) {
      const prefix = excludePath.slice(0, -2);
      return path.startsWith(prefix);
    }
    return path === excludePath;
  });
}

/**
 * Retrieves cached data if it exists and is still valid.
 * 
 * @param pagePath - The path to look up in cache
 * @param cacheDuration - Cache validity duration in seconds
 * @returns Cached page data or null if not found/expired
 * 
 * @internal
 */
function getCachedData(pagePath: string, cacheDuration: number): PageData | null {
  const cachedEntry = cache.get(pagePath);
  
  if (!cachedEntry) {
    return null;
  }
  
  const isExpired = Date.now() - cachedEntry.timestamp > cacheDuration * 1000;
  
  if (isExpired) {
    // Remove expired entry
    cache.delete(pagePath);
    totalCacheSize -= cachedEntry.size;
    return null;
  }
  
  return cachedEntry.data;
}

/**
 * Constructs the full URL for a page request.
 * 
 * @param request - The incoming request
 * @param pagePath - The page path to construct URL for
 * @returns The complete URL
 * 
 * @internal
 */
function constructPageUrl(request: NextRequest, pagePath: string): string {
  const protocol = request.nextUrl.protocol;
  const host = request.headers.get('host');
  
  if (!host) {
    throw new AutoApiError(
      'Missing host header in request',
      AutoApiErrorType.FETCH_ERROR,
      400
    );
  }
  
  return new URL(pagePath, `${protocol}//${host}`).toString();
}

/**
 * Fetches page content with timeout support.
 * 
 * @param url - The URL to fetch
 * @param timeout - Timeout in milliseconds
 * @returns Promise resolving to HTML content
 * 
 * @internal
 */
async function fetchPageContent(url: string, timeout: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ByteScout-NextJS-SDK/1.0',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new AutoApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        AutoApiErrorType.FETCH_ERROR,
        response.status
      );
    }
    
    return await response.text();
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new AutoApiError(
        `Request timeout after ${timeout}ms`,
        AutoApiErrorType.TIMEOUT_ERROR,
        408
      );
    }
    
    throw error;
  }
}

/**
 * Extracts structured data from HTML content using cheerio.
 * 
 * @param html - The HTML content to parse
 * @param pagePath - The original page path
 * @param receiverUsername - Optional receiver username
 * @returns Extracted page data
 * 
 * @internal
 */
function extractPageData(html: string, pagePath: string, receiverUsername?: string): PageData {
  try {
    const $ = cheerio.load(html);
    const now = Date.now();
    
    // Extract basic information
    const title = $('title').text().trim() || '';
    const h1 = $('h1').first().text().trim() || '';
    const metaDescription = $('meta[name="description"]').attr('content')?.trim();
    
    // Extract all headings for analysis
    const headings: Array<{ level: number; text: string }> = [];
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const $element = $(element);
      const level = parseInt($element.prop('tagName')?.substring(1) || '1');
      const text = $element.text().trim();
      if (text) {
        headings.push({ level, text });
      }
    });
    
    return {
      path: pagePath,
      timestamp: new Date(now).toISOString(),
      title,
      h1,
      html,
      receiverUsername,
      contentLength: html.length,
      extractedAt: now,
      statusCode: 200,
      headings,
      metaDescription,
    };
    
  } catch (error) {
    throw new AutoApiError(
      'Failed to parse HTML content',
      AutoApiErrorType.PARSE_ERROR,
      undefined,
      error as Error
    );
  }
}

/**
 * Determines if data should be cached based on size constraints.
 * 
 * @param data - The page data to check
 * @param maxCacheSize - Maximum allowed cache size
 * @returns True if data should be cached
 * 
 * @internal
 */
function shouldCacheData(data: PageData, maxCacheSize: number): boolean {
  const dataSize = (data.html?.length || 0) + JSON.stringify(data).length;
  return dataSize <= maxCacheSize;
}

/**
 * Caches page data with size management.
 * 
 * @param pagePath - The path to cache data for
 * @param data - The page data to cache
 * @param maxCacheSize - Maximum cache size limit
 * 
 * @internal
 */
function cachePageData(pagePath: string, data: PageData, maxCacheSize: number): void {
  const dataSize = (data.html?.length || 0) + JSON.stringify(data).length;
  
  // Evict old entries if cache would exceed size limit
  while (totalCacheSize + dataSize > maxCacheSize && cache.size > 0) {
    const oldestKey = cache.keys().next().value;
    const oldEntry = cache.get(oldestKey);
    if (oldEntry) {
      totalCacheSize -= oldEntry.size;
      cache.delete(oldestKey);
    }
  }
  
  // Cache the new data
  const cachedEntry: CachedPageData = {
    data,
    timestamp: Date.now(),
    size: dataSize,
  };
  
  cache.set(pagePath, cachedEntry);
  totalCacheSize += dataSize;
}

/**
 * Applies additional headers to a response.
 * 
 * @param response - The response to modify
 * @param headers - Headers to add
 * 
 * @internal
 */
function applyAdditionalHeaders(response: NextResponse, headers: Record<string, string>): void {
  Object.entries(headers).forEach(([key, value]) => {
    if (typeof key === 'string' && typeof value === 'string') {
      response.headers.set(key, value);
    }
  });
}

/**
 * Creates a standardized error response.
 * 
 * @param message - Error message
 * @param status - HTTP status code
 * @param type - Error type
 * @returns Next.js error response
 * 
 * @internal
 */
function createErrorResponse(
  message: string, 
  status: number, 
  type: AutoApiErrorType
): NextResponse {
  return NextResponse.json(
    {
      error: {
        message,
        type,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Handles middleware errors and converts them to appropriate responses.
 * 
 * @param error - The error to handle
 * @returns Next.js error response
 * 
 * @internal
 */
function handleMiddlewareError(error: unknown): NextResponse {
  if (error instanceof AutoApiError) {
    return createErrorResponse(
      error.message,
      error.statusCode || 500,
      error.type
    );
  }
  
  // Handle generic errors
  return createErrorResponse(
    'An unexpected error occurred',
    500,
    AutoApiErrorType.FETCH_ERROR
  );
}

/**
 * Clears expired entries from the cache.
 * This can be called periodically to maintain cache health.
 * 
 * @param cacheDuration - Cache validity duration in seconds
 * @returns Number of entries removed
 * 
 * @public
 */
export function clearExpiredCache(cacheDuration: number): number {
  const now = Date.now();
  let removedCount = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > cacheDuration * 1000) {
      cache.delete(key);
      totalCacheSize -= entry.size;
      removedCount++;
    }
  }
  
  return removedCount;
}

/**
 * Gets current cache statistics.
 * 
 * @returns Cache statistics object
 * 
 * @public
 */
export function getCacheStats(): {
  entries: number;
  totalSize: number;
  averageSize: number;
} {
  const entries = cache.size;
  const averageSize = entries > 0 ? Math.round(totalCacheSize / entries) : 0;
  
  return {
    entries,
    totalSize: totalCacheSize,
    averageSize,
  };
}

/**
 * Next.js middleware configuration.
 * 
 * This configuration tells Next.js which routes should be processed by the middleware.
 * The matcher pattern "/:path*" ensures all routes are evaluated, allowing the middleware
 * to determine which requests should be processed based on the API prefix.
 * 
 * @see https://nextjs.org/docs/advanced-features/middleware#matcher
 * 
 * @public
 */
export const config = {
  matcher: "/:path*",
};

/**
 * Export the main middleware function for direct use.
 * 
 * @example
 * ```typescript
 * // middleware.ts
 * export { default } from '@bytescout/nextjs/middleware';
 * ```
 * 
 * @public
 */
export default withAutoApiMiddleware();
