import type { MetadataRoute } from "next";

/** O que faz o painel virar aplicativo no celular: nome, ícone, cor e tela cheia. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Basik7 — Painel",
    short_name: "Basik7",
    description: "Vendas, placas NFC, clientes e prospecção da Basik7.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0814",
    theme_color: "#0a0814",
    categories: ["business", "productivity"],
    icons: [
      { src: "/app/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Registrar venda", short_name: "Vendas", url: "/", icons: [{ src: "/app/icone-192.png", sizes: "192x192" }] },
      { name: "Prospecção", short_name: "Leads", url: "/prospeccao", icons: [{ src: "/app/icone-192.png", sizes: "192x192" }] },
      { name: "Fornecedores", short_name: "Compras", url: "/fornecedores", icons: [{ src: "/app/icone-192.png", sizes: "192x192" }] },
    ],
  };
}
