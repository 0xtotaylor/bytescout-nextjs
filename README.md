# Official ByteScout SDK for Next.js

This SDK provides an easy way to automatically generate API endpoints for your Next.js pages and optionally cache responses for improved performance.

## Installation

1. Install the SDK in your Next.js project:

```bash
npm install @bytescoutai/nextjs
# or
yarn add @bytescoutai/nextjs
```

## Usage

### 1. Configure Next.js

Modify your `next.config.js` or `next.config.ts` file to use the `withAutoApi` function:

```javascript
import { withAutoApi } from "@bytescoutai/nextjs";

const nextConfig = {
  // Your existing Next.js configuration
};

const autoApiConfig = {
  enabled: true,
  apiPrefix: "/api",
  excludePaths: ["/private"],
  enableCache: true,
  cacheDuration: 3600,
};

export default withAutoApi(nextConfig, autoApiConfig);
```

### 2. Set up Middleware

Create or modify `middleware.ts` in the root of your project:

```typescript
import { AutoApiConfig, withAutoApiMiddleware } from "@bytescoutai/nextjs";

const autoApiConfig: AutoApiConfig = {
  enabled: true,
  apiPrefix: "/api",
  excludePaths: ["/private"],
  enableCache: true,
  cacheDuration: 3600,
};

export default withAutoApiMiddleware(autoApiConfig);

export const config = {
  matcher: "/:path*",
};
```

## How It Works

- The SDK automatically generates API endpoints for your Next.js pages.
- Access page data by appending your `apiPrefix` to the page path (e.g., `/api/public` for `/public/page.ts`).
- Responses can be cached for improved performance.

## Configuration Options

| Option              | Type     | Default  | Description                                             |
| ------------------- | -------- | -------- | ------------------------------------------------------- |
| `enabled`           | boolean  | `true`   | Enable or disable the Auto API functionality            |
| `apiPrefix`         | string   | `"/api"` | Prefix for the API endpoints                            |
| `excludePaths`      | string[] | `[]`     | Paths to exclude from Auto API processing               |
| `enableCache`       | boolean  | `false`  | Enable or disable caching of API responses              |
| `cacheDuration`     | number   | `3600`   | Duration (in seconds) for which cache entries are valid |
| `additionalHeaders` | object   | `{}`     | Additional headers to include in the API response       |

## Support

For issues, feature requests, or questions, please [open an issue](https://github.com/0xtotaylor/bytescout-nextjs/issues) on our GitHub repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
