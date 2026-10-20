import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Inter_Tight } from 'next/font/google';
import { site } from '@/data/site';
import { preloadScript } from '@/lib/reveal';
import { Providers } from '@/components/layout/Providers';
import { Preloader } from '@/components/layout/Preloader';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Cursor } from '@/components/ui/Cursor';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { SearchOverlay } from '@/components/shop/SearchOverlay';
import { RingSizeGuide } from '@/components/shop/RingSizeGuide';
import './globals.css';

const bodoni = Bodoni_Moda({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-bodoni', display: 'swap' });
const inter = Inter_Tight({ subsets: ['latin', 'greek'], weight: ['300', '400', '500', '600', '700'], variable: '--font-inter-tight', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'VALUT Semijoias — Semijoia que encanta', template: '%s · VALUT Semijoias' },
  description: 'Semijoias VALUT: colares, brincos, anéis, pulseiras, conjuntos e bolsas de festa. Atacado & Varejo. Enviamos para todo o Brasil.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: site.name,
    images: [{ url: '/media/editorial-flores-cravejadas.jpg', width: 1360, height: 1824, alt: 'Modelo com brinco de flores cravejadas VALUT' }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/brand/valut-simbolo.svg' },
};

export const viewport: Viewport = { themeColor: '#F4F1EA', width: 'device-width', initialScale: 1 };

const storeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: site.name,
  slogan: site.slogan,
  url: site.url,
  image: `${site.url}/media/loja-interior.webp`,
  logo: `${site.url}/brand/valut-logo.svg`,
  sameAs: [site.instagram.url, site.salesLink],
  address: { '@type': 'PostalAddress', streetAddress: site.store.street, addressCountry: 'BR' }, // [CONFIRMAR] cidade/UF/CEP
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bodoni.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preloadScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
      </head>
      <body>
        <Providers>
          <Preloader />
          <Header />
          <main id="conteudo" className="relative z-10 bg-[var(--page-bg)] text-[var(--page-fg)]">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <SearchOverlay />
          <RingSizeGuide />
          <Cursor />
        </Providers>
      </body>
    </html>
  );
}
