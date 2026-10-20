import type { CategorySlug } from './categories';
import type { MediaKey } from './media.generated';

/**
 * Catálogo de produtos — fonte única de dados do site.
 *
 * ⚠️ PLACEHOLDERS: os NOMES são descrições do que aparece nas fotos e os
 * PREÇOS são ilustrativos. Todos estão marcados com `placeholder: true` e
 * precisam ser confirmados pela VALUT ([CONFIRMAR]).
 *
 * Para trocar por um CMS/Shopify/Nuvemshop depois, basta manter o formato
 * `Product` e substituir as funções de consulta no fim do arquivo.
 */

export type Variant = 'dourado' | 'rodio';
export type StoneColor = 'cristal' | 'rubi' | 'coral' | 'amarelo' | 'perola' | 'colorida' | 'sem-pedra';
export type Tag = 'novidade' | 'mais-vendido' | 'oferta';

export type Product = {
  slug: string;
  name: string;
  category: CategorySlug;
  collection?: 'rubi-mood';
  price: number;
  compareAt?: number;
  images: { key: MediaKey; alt: string }[];
  variants: Variant[];
  stone: StoneColor;
  tags: Tag[];
  description: string;
  /** Peças que combinam ("Complete o look"). */
  pairsWith?: string[];
  placeholder: true;
};

const DESC = '[CONFIRMAR] Descrição da peça: material, banho, medidas, fecho e garantia.';

export const products: Product[] = [
  {
    slug: 'brinco-coracao-rubi',
    name: 'Brinco Coração Rubi',
    category: 'brincos',
    collection: 'rubi-mood',
    price: 189.9, // [CONFIRMAR PREÇO]
    images: [
      { key: 'joia-rubi-recorte', alt: 'Par de brincos coração com pedra rubi e halo cravejado' },
      { key: 'video-rubi-mood-poster', alt: 'Brincos coração rubi e bracelete cravejado sobre tecido dourado' },
    ],
    variants: ['dourado'],
    stone: 'rubi',
    tags: ['novidade', 'mais-vendido'],
    description: DESC,
    pairsWith: ['bracelete-cravejado', 'conjunto-rubi-retangular'],
    placeholder: true,
  },
  {
    slug: 'bracelete-cravejado',
    name: 'Bracelete Cravejado',
    category: 'pulseiras',
    collection: 'rubi-mood',
    price: 249.9, // [CONFIRMAR PREÇO]
    compareAt: 289.9,
    images: [
      { key: 'video-rubi-mood-poster', alt: 'Bracelete totalmente cravejado com brincos coração rubi' },
      { key: 'joia-rubi-recorte', alt: 'Brincos coração rubi que combinam com o bracelete' },
    ],
    variants: ['dourado', 'rodio'],
    stone: 'cristal',
    tags: ['oferta'],
    description: DESC,
    pairsWith: ['brinco-coracao-rubi'],
    placeholder: true,
  },
  {
    slug: 'conjunto-rubi-retangular',
    name: 'Conjunto Rubi Retangular',
    category: 'conjuntos',
    collection: 'rubi-mood',
    price: 219.9, // [CONFIRMAR PREÇO]
    images: [{ key: 'conjunto-rubi-expositor', alt: 'Conjunto de colar e brincos com pedras rubi retangulares em expositor verde' }],
    variants: ['dourado'],
    stone: 'rubi',
    tags: ['novidade'],
    description: DESC,
    pairsWith: ['brinco-coracao-rubi', 'anel-coquetel'],
    placeholder: true,
  },
  {
    slug: 'colar-articulado-dourado',
    name: 'Colar Articulado Dourado',
    category: 'colares',
    price: 229.9, // [CONFIRMAR PREÇO]
    images: [
      { key: 'editorial-colar-dourado', alt: 'Modelo ruiva de blazer branco usando colar dourado articulado e brinco franja' },
      { key: 'editorial-perfil-brinco', alt: 'Modelo de perfil com brinco franja e pulseira dourada' },
    ],
    variants: ['dourado'],
    stone: 'sem-pedra',
    tags: ['mais-vendido'],
    description: DESC,
    pairsWith: ['brinco-franja-dourado'],
    placeholder: true,
  },
  {
    slug: 'brinco-franja-dourado',
    name: 'Brinco Franja Dourado',
    category: 'brincos',
    price: 149.9, // [CONFIRMAR PREÇO]
    compareAt: 179.9,
    images: [
      { key: 'editorial-perfil-brinco', alt: 'Brinco franja dourado com topo cravejado, modelo de perfil' },
      { key: 'editorial-colar-dourado', alt: 'Brinco franja usado com colar dourado articulado' },
    ],
    variants: ['dourado', 'rodio'],
    stone: 'cristal',
    tags: ['oferta', 'mais-vendido'],
    description: DESC,
    pairsWith: ['colar-articulado-dourado', 'bracelete-liso-dourado'],
    placeholder: true,
  },
  {
    slug: 'colar-gota-dourado',
    name: 'Colar Gota Dourado',
    category: 'colares',
    price: 199.9, // [CONFIRMAR PREÇO]
    images: [{ key: 'editorial-colar-gota', alt: 'Modelo sorrindo com colar gota dourado e brinco, blazer rosa' }],
    variants: ['dourado'],
    stone: 'cristal',
    tags: ['novidade'],
    description: DESC,
    pairsWith: ['bracelete-liso-dourado'],
    placeholder: true,
  },
  {
    slug: 'bracelete-liso-dourado',
    name: 'Bracelete Liso Dourado',
    category: 'pulseiras',
    price: 159.9, // [CONFIRMAR PREÇO]
    images: [{ key: 'editorial-pulseiras-rosa', alt: 'Bracelete liso dourado e pulseiras riviera sobre blazer rosa' }],
    variants: ['dourado'],
    stone: 'sem-pedra',
    tags: ['mais-vendido'],
    description: DESC,
    pairsWith: ['pulseira-riviera', 'colar-gota-dourado'],
    placeholder: true,
  },
  {
    slug: 'pulseira-riviera',
    name: 'Pulseira Riviera',
    category: 'pulseiras',
    price: 119.9, // [CONFIRMAR PREÇO]
    compareAt: 139.9,
    images: [{ key: 'editorial-pulseiras-rosa', alt: 'Pulseiras riviera cravejadas em punho com blazer rosa' }],
    variants: ['dourado', 'rodio'],
    stone: 'cristal',
    tags: ['oferta'],
    description: DESC,
    pairsWith: ['bracelete-liso-dourado'],
    placeholder: true,
  },
  {
    slug: 'brinco-flores-cravejadas',
    name: 'Brinco Flores Cravejadas',
    category: 'brincos',
    price: 179.9, // [CONFIRMAR PREÇO]
    images: [
      { key: 'editorial-flores-cravejadas', alt: 'Close de modelo com brinco de flores cravejadas, colar e anel cravejados' },
      { key: 'video-flores-cravejadas-poster', alt: 'Brincos de flores cravejadas e colar riviera sobre fundo preto' },
    ],
    variants: ['rodio', 'dourado'],
    stone: 'cristal',
    tags: ['novidade', 'mais-vendido'],
    description: DESC,
    pairsWith: ['anel-flores-cravejado', 'colar-riviera-cristal'],
    placeholder: true,
  },
  {
    slug: 'anel-flores-cravejado',
    name: 'Anel Flores Cravejado',
    category: 'aneis',
    price: 139.9, // [CONFIRMAR PREÇO]
    images: [{ key: 'editorial-flores-cravejadas', alt: 'Anel de flores cravejado usado com brinco e colar cravejados' }],
    variants: ['rodio'],
    stone: 'cristal',
    tags: ['novidade'],
    description: DESC,
    pairsWith: ['brinco-flores-cravejadas'],
    placeholder: true,
  },
  {
    slug: 'colar-riviera-cristal',
    name: 'Colar Riviera Cristal',
    category: 'colares',
    price: 209.9, // [CONFIRMAR PREÇO]
    images: [
      { key: 'video-flores-cravejadas-poster', alt: 'Colar riviera cravejado sobre fundo preto' },
      { key: 'editorial-flores-cravejadas', alt: 'Colar riviera usado com brinco de flores' },
    ],
    variants: ['rodio', 'dourado'],
    stone: 'cristal',
    tags: ['mais-vendido'],
    description: DESC,
    pairsWith: ['brinco-flores-cravejadas'],
    placeholder: true,
  },
  {
    slug: 'brinco-gota-cravejado',
    name: 'Brinco Gota Cravejado',
    category: 'brincos',
    price: 169.9, // [CONFIRMAR PREÇO]
    compareAt: 199.9,
    images: [{ key: 'detalhe-brinco-gota', alt: 'Close de orelha com brinco gota cravejado e anel' }],
    variants: ['rodio'],
    stone: 'cristal',
    tags: ['oferta'],
    description: DESC,
    pairsWith: ['anel-gota-cravejado'],
    placeholder: true,
  },
  {
    slug: 'anel-gota-cravejado',
    name: 'Anel Gota Cravejado',
    category: 'aneis',
    price: 129.9, // [CONFIRMAR PREÇO]
    images: [{ key: 'detalhe-brinco-gota', alt: 'Anel cravejado com pedra gota, usado com brinco combinando' }],
    variants: ['rodio'],
    stone: 'cristal',
    tags: ['novidade'],
    description: DESC,
    pairsWith: ['brinco-gota-cravejado'],
    placeholder: true,
  },
  {
    slug: 'colar-perolas',
    name: 'Colar de Pérolas',
    category: 'colares',
    price: 189.9, // [CONFIRMAR PREÇO]
    images: [{ key: 'loja-perolas-busto', alt: 'Colares de pérolas em camadas em busto de veludo azul-petróleo' }],
    variants: ['dourado'],
    stone: 'perola',
    tags: ['mais-vendido'],
    description: DESC,
    placeholder: true,
  },
  {
    slug: 'conjunto-coral',
    name: 'Conjunto Coral',
    category: 'conjuntos',
    price: 259.9, // [CONFIRMAR PREÇO]
    compareAt: 299.9,
    images: [{ key: 'loja-conjunto-coral', alt: 'Conjunto de colar e brincos com pedras coral em busto rosa' }],
    variants: ['dourado'],
    stone: 'coral',
    tags: ['oferta'],
    description: DESC,
    placeholder: true,
  },
  {
    slug: 'colar-riviera-amarela',
    name: 'Colar Riviera Amarela',
    category: 'colares',
    price: 199.9, // [CONFIRMAR PREÇO]
    images: [
      { key: 'loja-rivieras', alt: 'Colares riviera amarelos e brancos em busto' },
      { key: 'loja-rivieras-letreiro', alt: 'Rivieras amarelas com o letreiro VALUT ao fundo' },
    ],
    variants: ['dourado', 'rodio'],
    stone: 'amarelo',
    tags: ['novidade'],
    description: DESC,
    pairsWith: ['anel-coquetel'],
    placeholder: true,
  },
  {
    slug: 'anel-coquetel',
    name: 'Anel Coquetel',
    category: 'aneis',
    price: 99.9, // [CONFIRMAR PREÇO]
    images: [{ key: 'aneis-coquetel', alt: 'Anéis coquetel com pedras coloridas cercadas de zircônias' }],
    variants: ['dourado'],
    stone: 'colorida',
    tags: ['mais-vendido'],
    description: DESC,
    pairsWith: ['colar-riviera-amarela'],
    placeholder: true,
  },
  {
    slug: 'brinco-argola-dourada',
    name: 'Brinco Argola Dourada',
    category: 'brincos',
    price: 89.9, // [CONFIRMAR PREÇO]
    images: [{ key: 'loja-argolas', alt: 'Brincos argola dourados em expositores' }],
    variants: ['dourado'],
    stone: 'sem-pedra',
    tags: ['mais-vendido'],
    description: DESC,
    placeholder: true,
  },
  {
    slug: 'clutch-plissada-rosa',
    name: 'Clutch Plissada Rosa',
    category: 'bolsas',
    price: 279.9, // [CONFIRMAR PREÇO]
    images: [{ key: 'bolsa-clutch-rosa', alt: 'Clutch rosa plissada com fecho dourado, fundo verde-oliva' }],
    variants: ['dourado'],
    stone: 'sem-pedra',
    tags: ['novidade'],
    description: DESC,
    placeholder: true,
  },
  {
    slug: 'clutch-festa-dourada',
    name: 'Clutch de Festa Dourada',
    category: 'bolsas',
    price: 299.9, // [CONFIRMAR PREÇO]
    compareAt: 349.9,
    images: [{ key: 'loja-bolsas', alt: 'Clutches de festa dourada, azul e verde na prateleira' }],
    variants: ['dourado'],
    stone: 'cristal',
    tags: ['oferta'],
    description: DESC,
    placeholder: true,
  },
];

// ——— Consultas (troque aqui ao migrar para CMS/e-commerce) ———
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getByCategory = (c: CategorySlug) => products.filter((p) => p.category === c);
export const getCollection = (c: NonNullable<Product['collection']>) => products.filter((p) => p.collection === c);
export const getByTag = (t: Tag) => products.filter((p) => p.tags.includes(t));
export const getPairs = (p: Product) =>
  (p.pairsWith ?? []).map(getProduct).filter((x): x is Product => Boolean(x)).concat(
    products.filter((x) => x.category !== p.category && x.slug !== p.slug && !p.pairsWith?.includes(x.slug)).slice(0, 4),
  ).slice(0, 4);

export const stoneLabels: Record<StoneColor, string> = {
  cristal: 'Cristal',
  rubi: 'Rubi',
  coral: 'Coral',
  amarelo: 'Amarelo',
  perola: 'Pérola',
  colorida: 'Colorida',
  'sem-pedra': 'Sem pedra',
};
export const variantLabels: Record<Variant, string> = { dourado: 'Dourado', rodio: 'Ródio' };
export const tagLabels: Record<Tag, string> = { novidade: 'Novidades', 'mais-vendido': 'Mais vendidos', oferta: 'Em oferta' };
