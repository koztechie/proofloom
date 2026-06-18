/** @type {import('next').NextConfig} */

// ---------------------------------------------------------------------------
// Content-Security-Policy
//
// Directives are intentionally explicit — no "unsafe-inline" or "unsafe-eval".
// Adjustments:
//   - script-src: 'self' + Vercel Live (Vercel toolbar in dev)
//   - style-src:  'self' + 'unsafe-inline' (required by Tailwind CSS inline styles) + Google Fonts
//   - font-src:   'self' + Google Fonts CDN
//   - connect-src: 'self' + AWS presigned-URL hostname patterns
//   - img-src:    'self' + data URIs (avatars) + GitHub CDN (user avatars)
// ---------------------------------------------------------------------------
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://avatars.githubusercontent.com https://*.amazonaws.com",
  "connect-src 'self' https://*.amazonaws.com https://vercel.live",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .trim();

/** Security headers applied to every response via next.config.mjs headers(). */
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: CSP,
  },
  {
    // max-age 1 year; preload eligible
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Disable browser features not needed by the app
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
  // Prevent Turbopack/webpack from bundling these Node-native packages.
  // drizzle-orm imports `pg` with a CJS default-import pattern that Turbopack
  // mis-handles; keeping them external lets Node resolve them at runtime.
  serverExternalPackages: [
    "drizzle-orm",
    "pg",
    "@aws-sdk/rds-signer",
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/lib-dynamodb",
    "@aws-sdk/client-bedrock-runtime",
    "bcryptjs",
  ],

  async headers() {
    return [
      {
        // Apply security headers to every route — the '/:path*' wildcard
        // covers both pages and API routes including the root '/'.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
