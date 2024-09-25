import { NextResponse, NextRequest } from "next/server";

import { PageData, AutoApiConfig } from "./types";

// In-memory cache to store page data
const cache = new Map<string, { data: PageData; timestamp: number }>();

/**
 * Higher-order function that creates a middleware for handling Auto API requests
 * @param config - Configuration options for the Auto API
 * @returns Middleware function
 */
export function withAutoApiMiddleware(config: AutoApiConfig = {}) {
  // Destructure and set default values for configuration options
  const {
    enabled = true,
    apiPrefix = "/api",
    excludePaths = [],
    enableCache = false,
    cacheDuration = 3600,
    additionalHeaders = {},
    receiverUsername,
  } = config;

  /**
   * Middleware function to handle Auto API requests
   * @param request - The incoming Next.js request
   * @returns Next.js response or passes to the next middleware
   */
  return async function middleware(request: NextRequest) {
    if (!enabled) return NextResponse.next();

    const { pathname } = request.nextUrl;

    // Check if the request is for an Auto API endpoint
    if (pathname.startsWith(apiPrefix)) {
      const pagePath = pathname.replace(apiPrefix, "");

      // Skip processing if the path is in the exclude list
      if (excludePaths.includes(pagePath)) {
        return NextResponse.next();
      }

      try {
        // Fetch page data, potentially from cache
        const pageData = await getPageData(
          request,
          pagePath,
          enableCache,
          cacheDuration,
          receiverUsername
        );
        if (pageData) {
          // Return page data as JSON response with additional headers
          const response = NextResponse.json(pageData);
          Object.entries(additionalHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        } else {
          // Return 404 if page data is not found
          return NextResponse.json(
            { message: "Page not found or error fetching data" },
            { status: 404 }
          );
        }
      } catch (error) {
        // Return 500 if there's an error fetching page data
        return NextResponse.json(
          {
            message: "Error fetching page data",
            error: (error as Error).message,
          },
          { status: 500 }
        );
      }
    }

    // Pass the request to the next middleware if it's not an Auto API request
    return NextResponse.next();
  };
}

/**
 * Fetches page data, either from cache or by making a request
 * @param request - The incoming Next.js request
 * @param pagePath - The path of the page to fetch
 * @param enableCache - Whether caching is enabled
 * @param cacheDuration - Duration for which cache entries are valid
 * @param receiverUsername - Optional username of the receiver
 * @returns Page data or null if not found
 */
async function getPageData(
  request: NextRequest,
  pagePath: string,
  enableCache: boolean,
  cacheDuration: number,
  receiverUsername?: string
): Promise<PageData | null> {
  // Check cache if enabled
  if (enableCache) {
    const cachedData = cache.get(pagePath);
    if (
      cachedData &&
      Date.now() - cachedData.timestamp < cacheDuration * 1000
    ) {
      return { ...cachedData.data, receiverUsername };
    }
  }

  try {
    // Construct URL for the page
    const url = new URL(
      pagePath,
      `${request.nextUrl.protocol}//${request.headers.get("host")}`
    );
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const htmlText = await response.text();

    // Extract page data
    let pageData: PageData = {
      path: pagePath,
      timestamp: new Date().toISOString(),
      title: extractTitle(htmlText),
      h1: extractH1(htmlText),
      html: htmlText,
      receiverUsername,
    };

    // Cache the page data if caching is enabled
    if (enableCache) {
      cache.set(pagePath, { data: pageData, timestamp: Date.now() });
    }

    return pageData;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts the title from HTML content
 * @param html - The HTML content
 * @returns The extracted title or an empty string
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1] : "";
}

/**
 * Extracts the first H1 heading from HTML content
 * @param html - The HTML content
 * @returns The extracted H1 content or an empty string
 */
function extractH1(html: string): string {
  const h1Match = html.match(/<h1>(.*?)<\/h1>/i);
  return h1Match ? h1Match[1] : "";
}

// Configuration for the middleware matcher
export const config = {
  matcher: "/:path*",
};
