import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  // PGlite (banco temporário sem Supabase) carrega .wasm/.data em tempo de execução.
  outputFileTracingIncludes: { "/**": ["./node_modules/@electric-sql/pglite/dist/**"] },
  // Fotos do estoque vão pela server action (já comprimidas no navegador); a Vercel aceita até 4,5 MB.
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
    // Voltar para uma aba vista há menos de 30 s é instantâneo (sem ir ao servidor de novo).
    // Salvar qualquer coisa limpa esse cache na hora, então nada fica desatualizado.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
