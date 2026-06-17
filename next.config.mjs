/** @type {import('next').NextConfig} */
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
};

export default nextConfig;
