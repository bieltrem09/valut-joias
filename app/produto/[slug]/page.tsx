import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categoryName } from '@/data/categories';
import { media } from '@/data/media.generated';
import { getPairs, getProduct, products } from '@/data/products';
import { site } from '@/data/site';
import { ProductView } from '@/components/pages/ProductView';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const img = media[p.images[0].key];
  return {
    title: p.name,
    description: `${p.name} — ${categoryName(p.category)} VALUT Semijoias. ${site.model}. ${site.shipping}.`,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: { images: [{ url: img.src, width: img.width, height: img.height, alt: p.images[0].alt }] },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map((i) => `${site.url}${media[i.key].src}`),
    category: categoryName(product.category),
    brand: { '@type': 'Brand', name: site.name },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: product.price.toFixed(2), // [CONFIRMAR PREÇO]
      availability: 'https://schema.org/InStock',
      url: `${site.url}/produto/${product.slug}`,
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView key={product.slug} product={product} pairs={getPairs(product)} />
    </>
  );
}
