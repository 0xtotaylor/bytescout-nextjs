/**
 * Configuration options for the ByteScout Auto API functionality.
 * 
 * This interface defines all available configuration options for customizing
 * the behavior of the Auto API middleware and data extraction.
 * 
 * @example
 * ```typescript
 * const config: AutoApiConfig = {
 *   enabled: true,
 *   apiPrefix: '/api/v1',
 *   excludePaths: ['/admin', '/private'],
 *   enableCache: true,
 *   cacheDuration: 1800, // 30 minutes
 *   additionalHeaders: {
 *     'X-API-Version': '1.0',
 *     'Access-Control-Allow-Origin': '*'
 *   },
 *   receiverUsername: 'my-agent'
 * };
 * ```
 * 
 * @public
 */
export interface AutoApiConfig {
  /**
   * Enable or disable the Auto API functionality.
   * When disabled, all Auto API requests will be passed through without processing.
   * 
   * @defaultValue true
   * @example
   * ```typescript
   * // Disable Auto API in development
   * const config = { enabled: process.env.NODE_ENV === 'production' };
   * ```
   */
  enabled?: boolean;

  /**
   * Prefix for the API endpoints that will trigger Auto API processing.
   * Must start with a forward slash and should follow URL path conventions.
   * 
   * @defaultValue "/api"
   * @example
   * ```typescript
   * // Use a versioned API prefix
   * const config = { apiPrefix: '/api/v2' };
   * ```
   */
  apiPrefix?: string;

  /**
   * Array of page paths to exclude from Auto API processing.
   * Paths should be relative to the site root and can include wildcards.
   * 
   * @defaultValue []
   * @example
   * ```typescript
   * const config = {
   *   excludePaths: ['/admin', '/private/*', '/api/health']
   * };
   * ```
   */
  excludePaths?: string[];

  /**
   * Additional HTTP headers to include in all Auto API responses.
   * Useful for CORS, caching directives, or custom API versioning.
   * 
   * @defaultValue {}
   * @example
   * ```typescript
   * const config = {
   *   additionalHeaders: {
   *     'Cache-Control': 'public, max-age=3600',
   *     'X-API-Version': '1.0',
   *     'Access-Control-Allow-Origin': '*'
   *   }
   * };
   * ```
   */
  additionalHeaders?: Record<string, string>;

  /**
   * Enable or disable in-memory caching of API responses.
   * When enabled, identical requests will be served from cache until expiration.
   * 
   * @defaultValue false
   * @example
   * ```typescript
   * // Enable caching for better performance
   * const config = { enableCache: true, cacheDuration: 300 };
   * ```
   */
  enableCache?: boolean;

  /**
   * Duration in seconds for which cache entries remain valid.
   * Only effective when `enableCache` is true. Must be a positive integer.
   * 
   * @defaultValue 3600
   * @example
   * ```typescript
   * // Cache for 5 minutes
   * const config = { enableCache: true, cacheDuration: 300 };
   * ```
   */
  cacheDuration?: number;

  /**
   * Username identifier for the Skyfire receiver agent.
   * This value will be included in the response data for tracking purposes.
   * 
   * @defaultValue undefined
   * @example
   * ```typescript
   * const config = { receiverUsername: 'production-agent-01' };
   * ```
   */
  receiverUsername?: string;

  /**
   * Maximum size in bytes for cached HTML content.
   * Prevents memory issues with very large pages.
   * 
   * @defaultValue 1048576 (1MB)
   * @example
   * ```typescript
   * // Limit cache entries to 500KB
   * const config = { maxCacheSize: 512000 };
   * ```
   */
  maxCacheSize?: number;

  /**
   * Timeout in milliseconds for fetching page content.
   * Requests exceeding this timeout will be aborted.
   * 
   * @defaultValue 5000
   * @example
   * ```typescript
   * // Set 10 second timeout
   * const config = { requestTimeout: 10000 };
   * ```
   */
  requestTimeout?: number;
}

/**
 * Represents the extracted data from a web page.
 * 
 * This interface defines the structure of data returned by the Auto API
 * when processing page requests. It includes both metadata and content.
 * 
 * @example
 * ```typescript
 * const pageData: PageData = {
 *   path: '/about',
 *   timestamp: '2023-12-01T10:30:00.000Z',
 *   title: 'About Us - Company Name',
 *   h1: 'About Our Company',
 *   html: '<html>...</html>',
 *   receiverUsername: 'agent-01',
 *   contentLength: 15420,
 *   extractedAt: 1701423000000
 * };
 * ```
 * 
 * @public
 */
export interface PageData {
  /**
   * The requested page path, relative to the site root.
   * This is the original path that was requested via the API.
   * 
   * @example '/about' or '/products/widget-123'
   */
  path: string;

  /**
   * ISO 8601 timestamp indicating when the page data was extracted.
   * This can be used to determine data freshness and cache validity.
   * 
   * @example '2023-12-01T10:30:00.000Z'
   */
  timestamp: string;

  /**
   * The page title extracted from the HTML `<title>` element.
   * Returns an empty string if no title element is found.
   * 
   * @example 'About Us - Company Name'
   */
  title: string;

  /**
   * Content of the first `<h1>` element found on the page.
   * Returns an empty string if no H1 element is found.
   * 
   * @example 'Welcome to Our Website'
   */
  h1: string;

  /**
   * Complete HTML content of the page.
   * This field is optional and may be omitted for large pages
   * or when content inclusion is disabled.
   * 
   * @example '<html><head>...</head><body>...</body></html>'
   */
  html?: string;

  /**
   * Username identifier of the Skyfire receiver agent that processed this request.
   * Used for tracking and analytics purposes.
   * 
   * @example 'production-agent-01'
   */
  receiverUsername?: string;

  /**
   * Size of the HTML content in bytes.
   * Useful for monitoring and cache management.
   * 
   * @example 15420
   */
  contentLength?: number;

  /**
   * Unix timestamp (milliseconds) when the data was extracted.
   * Provides a more precise timestamp than the ISO string.
   * 
   * @example 1701423000000
   */
  extractedAt?: number;

  /**
   * HTTP status code of the original page request.
   * Indicates whether the page was successfully fetched.
   * 
   * @example 200, 404, 500
   */
  statusCode?: number;

  /**
   * Array of all heading elements (h1-h6) found on the page.
   * Useful for content analysis and SEO purposes.
   * 
   * @example [{ level: 1, text: 'Main Title' }, { level: 2, text: 'Subtitle' }]
   */
  headings?: Array<{ level: number; text: string }>;

  /**
   * Meta description extracted from the page's meta tags.
   * Returns undefined if no meta description is found.
   * 
   * @example 'Learn more about our company history and mission.'
   */
  metaDescription?: string;
}

/**
 * Represents a cached page entry with expiration metadata.
 * 
 * @internal
 */
export interface CachedPageData {
  /** The page data */
  data: PageData;
  /** Unix timestamp when the entry was cached */
  timestamp: number;
  /** Size of the cached data in bytes */
  size: number;
}

/**
 * Configuration constants used throughout the SDK.
 * 
 * @internal
 */
export const SDK_CONSTANTS = {
  /** Default API prefix */
  DEFAULT_API_PREFIX: '/api',
  /** Default cache duration in seconds */
  DEFAULT_CACHE_DURATION: 3600,
  /** Default request timeout in milliseconds */
  DEFAULT_REQUEST_TIMEOUT: 5000,
  /** Default maximum cache size in bytes */
  DEFAULT_MAX_CACHE_SIZE: 1048576, // 1MB
  /** Maximum allowed cache duration in seconds */
  MAX_CACHE_DURATION: 86400, // 24 hours
  /** Minimum allowed cache duration in seconds */
  MIN_CACHE_DURATION: 60, // 1 minute
} as const;

/**
 * Error types that can be thrown by the SDK.
 * 
 * @public
 */
export enum AutoApiErrorType {
  /** Configuration validation error */
  INVALID_CONFIG = 'INVALID_CONFIG',
  /** Network or fetch error */
  FETCH_ERROR = 'FETCH_ERROR',
  /** HTML parsing error */
  PARSE_ERROR = 'PARSE_ERROR',
  /** Cache operation error */
  CACHE_ERROR = 'CACHE_ERROR',
  /** Request timeout error */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

/**
 * Custom error class for Auto API operations.
 * 
 * @public
 */
export class AutoApiError extends Error {
  public readonly type: AutoApiErrorType;
  public readonly statusCode?: number;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: AutoApiErrorType,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AutoApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AutoApiError);
    }
  }
}
