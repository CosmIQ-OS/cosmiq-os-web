/** @type {import('next').NextConfig} */
const nextConfig = {
  // PGlite (local/CI Postgres) ships WASM + data files; load it from node_modules instead of bundling.
  serverExternalPackages: ["@electric-sql/pglite"],
};
module.exports = nextConfig;
