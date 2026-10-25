import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  // PGlite (banco temporário sem Supabase) carrega .wasm/.data em tempo de execução.
  outputFileTracingIncludes: { "/**": ["./node_modules/@electric-sql/pglite/dist/**"] },
};

export default nextConfig;
