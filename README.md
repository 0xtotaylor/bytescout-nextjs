# ByteScout SDK for Next.js

This open source SDK provides an easy way to automatically generate API endpoints for your Next.js pages and optionally cache responses for improved performance. It also includes support for specifying a Skyfire receiver username for potential integration with Skyfire payments.

## [Demo](https://app.arcade.software/share/ariuGPfDPIHsulYO3slV)

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
  receiverUsername: "your-skyfire-username", // Add this line for Skyfire monetization
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
  receiverUsername: "your-skyfire-username", // Add this line for Skyfire monetization
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
- If specified, the Skyfire receiver username is included in the API responses.

## Configuration Options

| Option              | Type     | Default  | Description                                             |
| ------------------- | -------- | -------- | ------------------------------------------------------- |
| `enabled`           | boolean  | `true`   | Enable or disable the Auto API functionality            |
| `apiPrefix`         | string   | `"/api"` | Prefix for the API endpoints                            |
| `excludePaths`      | string[] | `[]`     | Paths to exclude from Auto API processing               |
| `enableCache`       | boolean  | `false`  | Enable or disable caching of API responses              |
| `cacheDuration`     | number   | `3600`   | Duration (in seconds) for which cache entries are valid |
| `additionalHeaders` | object   | `{}`     | Additional headers to include in the API response       |
| `receiverUsername`  | string   | ``       | Username of the Skyfire receiver agent                  |

## Skyfire Integration

The SDK includes support for specifying a Skyfire receiver username. This username is included in the API responses and can be used as an identifier for potential Skyfire payment integrations.

To use this feature:

1. Set the `receiverUsername` in your `autoApiConfig`.
2. The username will be included in the `PageData` object returned by API requests.
3. You can use this username in your custom payment processing logic to identify the Skyfire receiver.

Note: The SDK does not implement Skyfire payment processing directly. You will need to implement your own payment logic using the provided `receiverUsername`.

## Support

For issues, feature requests, or questions, please [open an issue](https://github.com/0xtotaylor/bytescout-nextjs/issues) on our GitHub repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
