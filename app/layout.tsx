import type { Metadata, Viewport } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Providers } from "@/components/shell/providers";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Aurora } from "@/components/shell/aurora";
import { InstalarApp } from "@/components/shell/instalar-app";
import { VigiaErros } from "@/components/shell/vigia-erros";
import { persistente } from "@/lib/db";
import Link from "next/link";
import "./globals.css";
import { dono } from "@/lib/dono";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/** Tudo depende do banco e do cookie da barra lateral: nada é gerado no build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Basik7 — Painel", template: "%s · Basik7" },
  description: "Vendas, placas NFC e clientes da Basik7.",
  robots: { index: false, follow: false },
  applicationName: "Basik7",
  // iPhone: "Adicionar à Tela de Início" abre em tela cheia, como app.
  appleWebApp: { capable: true, title: "Basik7", statusBarStyle: "black" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0814" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const collapsed = (await cookies()).get("sidebar")?.value === "collapsed";
  const { nome, email } = dono();

  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${instrument.variable} ${jetbrains.variable}`}>
      <body>
        <Providers initialCollapsed={collapsed}>
          <Aurora />
          <InstalarApp />
          <VigiaErros />
          <a
            href="#conteudo"
            className="sr-only z-50 rounded-control bg-card px-3 py-2 text-13 shadow-pop focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Pular para o conteúdo
          </a>
          <div className="flex min-h-dvh">
            <Sidebar nome={nome} email={email} />
            <div className="flex min-w-0 flex-1 flex-col">
              {!persistente && (
                <p role="status" className="bg-pending-soft px-4 py-2 text-center text-12 text-foreground md:px-8">
                  Banco temporário: o que você cadastrar pode sumir.{" "}
                  <Link href="/configuracoes" className="font-medium underline underline-offset-4">
                    Ver como guardar de verdade
                  </Link>
                </p>
              )}
              <Suspense fallback={<div className="h-16" />}>
                <Topbar />
              </Suspense>
              <main id="conteudo" className="mx-auto w-full max-w-[1280px] shell-largura flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-16 md:pt-8">
                {children}
              </main>
            </div>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
