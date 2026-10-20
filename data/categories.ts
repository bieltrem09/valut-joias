import type { MediaKey } from './media.generated';

export type CategorySlug = 'colares' | 'brincos' | 'aneis' | 'pulseiras' | 'conjuntos' | 'bolsas';

export const categories: { slug: CategorySlug; name: string; image: MediaKey; alt: string }[] = [
  { slug: 'colares', name: 'Colares', image: 'loja-rivieras', alt: 'Colares riviera amarelos e brancos em busto de veludo, com anel coquetel ao topo' },
  { slug: 'brincos', name: 'Brincos', image: 'loja-argolas', alt: 'Brincos argola dourados em expositores da loja VALUT' },
  { slug: 'aneis', name: 'Anéis', image: 'aneis-coquetel', alt: 'Bandeja de anéis coquetel com pedras coloridas e cravejados' },
  { slug: 'pulseiras', name: 'Pulseiras', image: 'editorial-pulseiras-rosa', alt: 'Pulseiras e bracelete dourados sobre blazer rosa' },
  { slug: 'conjuntos', name: 'Conjuntos', image: 'loja-conjunto-coral', alt: 'Conjunto de colar e brincos coral em busto rosa, logo VALUT ao fundo' },
  { slug: 'bolsas', name: 'Bolsas de festa', image: 'loja-bolsas', alt: 'Prateleira de clutches de festa douradas, azuis e verdes' },
];

export const categoryName = (slug: CategorySlug) => categories.find((c) => c.slug === slug)?.name ?? slug;
