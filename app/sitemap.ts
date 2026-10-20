import type { MetadataRoute } from 'next';
import { products } from '@/data/products';
import { site } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ['', '/colecao', '/sobre', '/atacado', '/contato'].map((p) => ({ url: `${site.url}${p}`, lastModified: now, priority: p === '' ? 1 : 0.8 }));
  return [...pages, ...products.map((p) => ({ url: `${site.url}/produto/${p.slug}`, lastModified: now, priority: 0.7 }))];
}
