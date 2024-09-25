export interface AutoApiConfig {
  /**
   * Enable or disable the Auto API functionality
   * @default true
   */
  enabled?: boolean;
  /**
   * Prefix for the API endpoints
   * @default "/api"
   */
  apiPrefix?: string;
  /**
   * Paths to exclude from Auto API processing
   * @default []
   */
  excludePaths?: string[];
  /**
   * Additional headers to include in the API response
   * @default {}
   */
  additionalHeaders?: Record<string, string>;
  /**
   * Enable or disable caching of API responses
   * @default false
   */
  enableCache?: boolean;
  /**
   * Duration (in seconds) for which cache entries are valid
   * @default 3600
   */
  cacheDuration?: number;
  /**
   * Username of the Skyfire receiver agent
   * @default undefined
   */
  receiverUsername?: string;
}

export interface PageData {
  /**
   * Path of the page
   */
  path: string;
  /**
   * Timestamp of when the data was fetched
   */
  timestamp: string;
  /**
   * Title of the page
   */
  title: string;
  /**
   * First H1 heading on the page
   */
  h1: string;
  /**
   * Full HTML content of the page
   */
  html?: string;
  /**
   * Username of the Skyfire receiver agent
   */
  receiverUsername?: string;
}
