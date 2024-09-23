import { NextConfig } from "next";

import { AutoApiConfig } from "./types";
import { withAutoApiMiddleware } from "./middleware";

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

// Export the middleware function and configuration type for external use
export { withAutoApiMiddleware, AutoApiConfig };
