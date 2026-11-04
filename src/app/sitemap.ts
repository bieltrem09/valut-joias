import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const rotas = ["", "/estrutura", "/planos", "/horarios", "/professores", "/resultados", "/contato", "/aula-experimental", "/politica-de-privacidade"];

export default function sitemap(): MetadataRoute.Sitemap {
  return rotas.map((r) => ({
    url: `${SITE_URL}${r}`,
    lastModified: new Date(),
    changeFrequency: r === "" ? "weekly" : "monthly",
    priority: r === "" ? 1 : r === "/planos" || r === "/aula-experimental" ? 0.9 : 0.7,
  }));
}
