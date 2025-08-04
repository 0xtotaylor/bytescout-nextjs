# ByteScout SDK for Next.js

![npm version](https://img.shields.io/npm/v/@0xtotaylor/bytescout-nextjs)
![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)

A robust, production-ready SDK that automatically generates API endpoints for your Next.js pages with intelligent caching, comprehensive error handling, and optional Skyfire integration. Perfect for creating headless CMS solutions, API-first architectures, and monetized content platforms.

## ✨ Features

- 🚀 **Zero Configuration**: Automatic API endpoint generation for all Next.js pages
- ⚡ **Intelligent Caching**: Built-in memory cache with size limits and TTL
- 🛡️ **Security First**: Input validation, path sanitization, and XSS protection
- 📊 **Rich Metadata**: Extracts titles, headings, meta descriptions, and full HTML
- 🎯 **TypeScript Native**: Full type safety with comprehensive interfaces
- 🔍 **Robust HTML Parsing**: Powered by Cheerio for reliable content extraction
- ⏱️ **Request Timeouts**: Configurable timeouts prevent hanging requests
- 💰 **Skyfire Ready**: Built-in support for monetization platforms
- 🧪 **Testing Friendly**: Cache utilities and statistics for monitoring

## 📦 Installation

```bash
npm install @0xtotaylor/bytescout-nextjs
# or
yarn add @0xtotaylor/bytescout-nextjs
# or
pnpm add @0xtotaylor/bytescout-nextjs
```

## 🚀 Quick Start

### 1. Configure Next.js

Add the ByteScout SDK to your `next.config.js` or `next.config.ts`:

```typescript
import { withAutoApi } from "@0xtotaylor/bytescout-nextjs";

const nextConfig = {
  // Your existing Next.js configuration
};

const autoApiConfig = {
  enabled: true,
  apiPrefix: "/api",
  enableCache: true,
  cacheDuration: 3600, // 1 hour
  maxCacheSize: 100,
  requestTimeout: 10000, // 10 seconds
};

export default withAutoApi(nextConfig, autoApiConfig);
```

### 2. Set up Middleware

Create `middleware.ts` in your project root:

```typescript
import { createAutoApiMiddleware } from "@0xtotaylor/bytescout-nextjs";

// Option 1: Using the convenience function (recommended)
export default createAutoApiMiddleware({
  enabled: true,
  apiPrefix: "/api",
  excludePaths: ["/admin", "/private/*"],
  enableCache: true,
  receiverUsername: "your-skyfire-username",
});

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
```

### 3. Start Using Your APIs

Once configured, access any page as an API:

```bash
# Page: /about → API: /api/about
curl http://localhost:3000/api/about

# Page: /blog/my-post → API: /api/blog/my-post  
curl http://localhost:3000/api/blog/my-post
```

**Example Response:**
```json
{
  "path": "/about",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "title": "About Us - My Company",
  "h1": "About Our Company",
  "metaDescription": "Learn more about our company history and mission",
  "headings": ["About Our Company", "Our Mission", "Our Team"],
  "contentLength": 1024,
  "receiverUsername": "your-skyfire-username",
  "html": "<!DOCTYPE html>..."
}
```

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable the Auto API functionality |
| `apiPrefix` | `string` | `"/api"` | URL prefix for generated API endpoints |
| `excludePaths` | `string[]` | `[]` | Paths to exclude (supports wildcards like `/admin/*`) |
| `enableCache` | `boolean` | `false` | Enable intelligent response caching |
| `cacheDuration` | `number` | `3600` | Cache TTL in seconds |
| `maxCacheSize` | `number` | `100` | Maximum number of cached entries |
| `requestTimeout` | `number` | `30000` | Request timeout in milliseconds |
| `additionalHeaders` | `Record<string, string>` | `{}` | Custom headers to include in responses |
| `receiverUsername` | `string` | `undefined` | Skyfire receiver username for monetization |

## 🎯 Advanced Usage

### Cache Management

```typescript
import { clearCache, getCacheStatistics } from "@0xtotaylor/bytescout-nextjs";

// Clear all cached data
clearCache();

// Get cache statistics
const stats = getCacheStatistics();
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
console.log(`Hit rate: ${stats.hitRate}%`);
```

### Error Handling

The SDK provides comprehensive error handling with custom error types:

```typescript
import { AutoApiError, AutoApiErrorType } from "@0xtotaylor/bytescout-nextjs";

try {
  // Your API logic
} catch (error) {
  if (error instanceof AutoApiError) {
    switch (error.type) {
      case AutoApiErrorType.INVALID_CONFIG:
        console.error("Configuration error:", error.message);
        break;
      case AutoApiErrorType.FETCH_ERROR:
        console.error("Failed to fetch page:", error.message);
        break;
      case AutoApiErrorType.PARSE_ERROR:
        console.error("Failed to parse HTML:", error.message);
        break;
    }
  }
}
```

### Custom Middleware Setup

For advanced use cases, you can create custom middleware:

```typescript
import { withAutoApiMiddleware } from "@0xtotaylor/bytescout-nextjs";

export default withAutoApiMiddleware({
  enabled: process.env.NODE_ENV !== "development",
  apiPrefix: "/v1/pages",
  excludePaths: ["/admin/*", "/api/*", "/_next/*"],
  enableCache: true,
  cacheDuration: 1800, // 30 minutes
  maxCacheSize: 500,
  requestTimeout: 15000,
  additionalHeaders: {
    "X-API-Version": "1.0",
    "Cache-Control": "public, max-age=300",
  },
  receiverUsername: process.env.SKYFIRE_USERNAME,
});
```

## 💰 Skyfire Integration

ByteScout SDK includes built-in support for Skyfire monetization:

```typescript
const config = {
  receiverUsername: "your-skyfire-username",
  // ... other options
};
```

The `receiverUsername` is included in all API responses and can be used for:
- Content monetization
- Pay-per-view APIs  
- Usage tracking
- Revenue attribution

## 🔧 Development

### Building the Project

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Publishing

```bash
npm run prepublishOnly
npm publish
```

## 📊 Use Cases

- **Headless CMS**: Convert your Next.js site into a headless content management system
- **API-First Architecture**: Automatically expose page content via REST APIs
- **Content Monetization**: Integrate with Skyfire for pay-per-access content
- **Mobile Apps**: Feed page content to mobile applications
- **SEO Tools**: Extract metadata and content for SEO analysis
- **Content Syndication**: Share page content across multiple platforms

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://github.com/0xtotaylor/bytescout-nextjs#readme)
- 🐛 [Issue Tracker](https://github.com/0xtotaylor/bytescout-nextjs/issues)
- 💬 [Discussions](https://github.com/0xtotaylor/bytescout-nextjs/discussions)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- HTML parsing powered by [Cheerio](https://cheerio.js.org/)
- Inspired by the need for simple, powerful API generation tools
