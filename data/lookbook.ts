import type { MediaKey } from './media.generated';

export type Look = {
  id: string;
  title: string;
  image: MediaKey;
  alt: string;
  tone: 'blush' | 'olive' | 'ivory' | 'marble';
  /** Hotspots em % da foto, ligados a slugs de products.ts */
  spots: { x: number; y: number; slug: string }[];
};

export const looks: Look[] = [
  {
    id: '01',
    title: 'Dourado que conversa',
    image: 'editorial-colar-dourado',
    alt: 'Modelo ruiva de blazer branco com colar dourado articulado e brinco franja',
    tone: 'marble',
    spots: [
      { x: 16, y: 18, slug: 'brinco-franja-dourado' },
      { x: 52, y: 64, slug: 'colar-articulado-dourado' },
    ],
  },
  {
    id: '02',
    title: 'Um sorriso, uma gota',
    image: 'editorial-colar-gota',
    alt: 'Modelo sorrindo com colar gota dourado, brinco e blazer rosa',
    tone: 'blush',
    spots: [
      { x: 27, y: 12, slug: 'brinco-franja-dourado' },
      { x: 52, y: 58, slug: 'colar-gota-dourado' },
    ],
  },
  {
    id: '03',
    title: 'Flores que brilham',
    image: 'editorial-flores-cravejadas',
    alt: 'Close de modelo com brinco de flores cravejadas, colar e anel cravejados',
    tone: 'blush',
    spots: [
      { x: 20, y: 30, slug: 'brinco-flores-cravejadas' },
      { x: 60, y: 69, slug: 'colar-riviera-cristal' },
      { x: 40, y: 75, slug: 'anel-flores-cravejado' },
    ],
  },
  {
    id: '04',
    title: 'Coisas que nós achamos chique',
    image: 'bolsa-clutch-rosa',
    alt: 'Clutch rosa plissada segurada à mão sobre fundo verde-oliva',
    tone: 'olive',
    spots: [{ x: 48, y: 45, slug: 'clutch-plissada-rosa' }],
  },
];
