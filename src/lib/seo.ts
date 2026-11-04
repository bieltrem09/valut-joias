import type { Metadata } from "next";
import { avaliacaoGoogle, zeroum } from "@/content/zeroum";

export const SITE_URL = zeroum.site;

export function pageMeta(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · Zero Um CT Americana`, description, url: path },
    twitter: { title: `${title} · Zero Um CT Americana`, description },
  };
}

/** JSON-LD ExerciseGym — endereço completo e aggregateRating só com dado real. */
export function gymJsonLd() {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ExerciseGym",
    name: zeroum.nome,
    description: zeroum.descricao,
    url: SITE_URL,
    telephone: zeroum.telefone,
    image: `${SITE_URL}/og.png`,
    logo: `${SITE_URL}/brand/zeroum-avatar-2048.png`,
    openingHours: "Mo-Su 00:00-23:59",
    sameAs: [zeroum.instagramLink],
    hasMap: zeroum.mapa,
    address: {
      "@type": "PostalAddress",
      addressLocality: zeroum.endereco.cidade,
      addressRegion: zeroum.endereco.uf,
      postalCode: zeroum.endereco.cep,
      addressCountry: "BR",
      ...(zeroum.endereco.confirmado ? { streetAddress: zeroum.endereco.rua } : {}),
    },
    ...(avaliacaoGoogle
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avaliacaoGoogle.nota, reviewCount: avaliacaoGoogle.total, bestRating: 5 } }
      : {}),
    amenityFeature: zeroum.diferenciais.map((d) => ({ "@type": "LocationFeatureSpecification", name: d, value: true })),
  };
  return data;
}
