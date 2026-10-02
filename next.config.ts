/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["10.22.24.55", "192.168.1.196"],
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-neon",
    "pg",
  ],
  // Keep the Netlify server function small: only the PostgreSQL query
  // compiler is used at runtime, and CLI/dev tooling is never needed.
  outputFileTracingExcludes: {
    "/*": [
      "./node_modules/@prisma/client/runtime/*cockroachdb*",
      "./node_modules/@prisma/client/runtime/*mysql*",
      "./node_modules/@prisma/client/runtime/*sqlite*",
      "./node_modules/@prisma/client/runtime/*sqlserver*",
      "./node_modules/@prisma/client/runtime/*.map",
      "./node_modules/prisma/**/*",
      "./node_modules/@prisma/engines/**/*",
      "./node_modules/@prisma/studio-core/**/*",
      "./node_modules/@prisma/dev/**/*",
      "./node_modules/@prisma/fetch-engine/**/*",
      "./node_modules/@prisma/streams-local/**/*",
      "./node_modules/@prisma/adapter-better-sqlite3/**/*",
      "./node_modules/better-sqlite3/**/*",
      "./node_modules/@img/**/*",
      "./node_modules/sharp/**/*",
      "./node_modules/typescript/**/*",
      "./node_modules/@esbuild/**/*",
      "./node_modules/esbuild/**/*",
      "./prisma/migrations-sqlite-*/**/*",
      "./scripts/**/*",
    ],
  },
};

module.exports = nextConfig;
