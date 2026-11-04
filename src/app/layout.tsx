import type { Metadata, Viewport } from "next";
import { Anton, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { ScrollFx } from "@/components/motion/ScrollFx";
import { SITE_URL, gymJsonLd } from "@/lib/seo";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-anton", adjustFontFallback: true });
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-geist-mono", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Zero Um CT · Academia 24 horas em Americana/SP · 2.500 m² de musculação",
    template: "%s · Zero Um CT Americana",
  },
  description:
    "Academia de musculação 24 horas em Americana/SP: 2.500 m², 230 máquinas de 10 marcas, Sala Recovery e máquina de gelo. Nota 4,9 no Google. Aceita Wellhub Silver e TotalPass TP2.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Zero Um CT Americana",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Zero Um CT — academia 24 horas em Americana/SP" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${manrope.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gymJsonLd()) }} />
      </head>
      <body>
        <SmoothScroll />
        <ScrollFx />
        <Nav />
        <main id="conteudo">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
