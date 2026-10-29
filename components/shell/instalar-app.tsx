"use client";

import * as React from "react";
import { Download, Share, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Evento do Chrome/Edge que permite abrir o "Instalar app" pelo nosso botão. */
type PedidoInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const CHAVE_DISPENSA = "app-instalar-dispensado";
const DIAS_DISPENSA = 14;

const instalado = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
const ehIphone = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Estado da instalação, compartilhado entre o aviso e a página de Configurações. */
function useInstalacao() {
  const [pedido, setPedido] = React.useState<PedidoInstalacao | null>(null);
  const [jaInstalado, setJaInstalado] = React.useState(false);
  const [iphone, setIphone] = React.useState(false);

  React.useEffect(() => {
    setJaInstalado(instalado());
    setIphone(ehIphone());
    const aoPedir = (e: Event) => {
      e.preventDefault();
      setPedido(e as PedidoInstalacao);
    };
    const aoInstalar = () => {
      setJaInstalado(true);
      setPedido(null);
    };
    window.addEventListener("beforeinstallprompt", aoPedir);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPedir);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const instalar = async () => {
    if (!pedido) return false;
    await pedido.prompt();
    const { outcome } = await pedido.userChoice;
    setPedido(null);
    return outcome === "accepted";
  };

  return { pedido, jaInstalado, iphone, instalar };
}

/**
 * Registra o modo aplicativo (service worker) e, no celular, mostra um aviso
 * discreto para instalar o Basik7 na tela inicial. Some se você fechar (por 14 dias)
 * ou depois de instalado.
 */
export function InstalarApp() {
  const { pedido, jaInstalado, iphone, instalar } = useInstalacao();
  const [dispensado, setDispensado] = React.useState(true);

  React.useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    try {
      const ate = Number(localStorage.getItem(CHAVE_DISPENSA) || 0);
      setDispensado(Date.now() < ate);
    } catch {
      setDispensado(false);
    }
  }, []);

  const fechar = () => {
    setDispensado(true);
    try {
      localStorage.setItem(CHAVE_DISPENSA, String(Date.now() + DIAS_DISPENSA * 86_400_000));
    } catch {}
  };

  const mostrar = !jaInstalado && !dispensado && (!!pedido || iphone);
  if (!mostrar) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar o aplicativo Basik7"
      className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-card bg-card p-3 shadow-pop ring-1 ring-border md:inset-x-auto md:right-6 md:bottom-6 md:w-[360px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/app/icone-preto-192.png" alt="" className="size-11 shrink-0 rounded-[12px]" />
      <div className="min-w-0 flex-1">
        <p className="text-14 font-semibold">Basik7 no seu celular</p>
        <p className="text-12 leading-snug text-muted-foreground">
          {pedido ? "Instale o app e abra direto da tela inicial." : "Toque em Compartilhar e depois em “Adicionar à Tela de Início”."}
        </p>
      </div>
      {pedido ? (
        <button
          type="button"
          onClick={async () => {
            if (await instalar()) fechar();
          }}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-13 font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.96] coarse:h-10"
        >
          <Download className="size-4" strokeWidth={1.75} /> Instalar
        </button>
      ) : (
        <Share className="size-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
      )}
      <button
        type="button"
        onClick={fechar}
        aria-label="Agora não"
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover-fine:bg-muted coarse:size-10"
      >
        <X className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/** Seção de Configurações: botão de instalar e o passo a passo para cada celular. */
export function AppNoCelular() {
  const { pedido, jaInstalado, instalar } = useInstalacao();
  return (
    <section aria-labelledby="app" className="surface grid gap-4 p-5">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/app/icone-preto-192.png" alt="" className="size-12 shrink-0 rounded-[14px]" />
        <div className="min-w-0 flex-1">
          <h2 id="app" className="text-16 font-semibold tracking-[-0.01em]">
            Aplicativo no celular
          </h2>
          <p className="text-13 text-muted-foreground">
            {jaInstalado
              ? "Você está usando o aplicativo. Ele abre direto da tela inicial, em tela cheia."
              : "Instale o Basik7 como aplicativo: ícone na tela inicial, abre em tela cheia, sem precisar abrir o navegador."}
          </p>
        </div>
      </div>
      {!jaInstalado && (
        <>
          {pedido && (
            <button
              type="button"
              onClick={instalar}
              className="flex h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-14 font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.98]"
            >
              <Download className="size-4" strokeWidth={1.75} /> Instalar aplicativo
            </button>
          )}
          <div className="grid gap-3 text-13 sm:grid-cols-2">
            <Passos
              titulo="Android (Chrome)"
              passos={[
                "Abra o painel no Chrome",
                "Toque nos três pontinhos ⋮",
                "Toque em “Instalar app” ou “Adicionar à tela inicial” e escolha “Instalar” (não “Criar atalho”)",
              ]}
            />
            <Passos
              titulo="iPhone (Safari)"
              passos={["Abra o painel no Safari", "Toque em Compartilhar (quadrado com seta)", "Toque em “Adicionar à Tela de Início”"]}
            />
          </div>
        </>
      )}
    </section>
  );
}

function Passos({ titulo, passos, className }: { titulo: string; passos: string[]; className?: string }) {
  return (
    <div className={cn("rounded-control bg-muted/50 p-3", className)}>
      <p className="font-medium">{titulo}</p>
      <ol className="mt-1.5 grid gap-1 text-muted-foreground">
        {passos.map((p, i) => (
          <li key={p} className="flex gap-2">
            <span className="font-mono text-11 text-primary tabular">{i + 1}</span> {p}
          </li>
        ))}
      </ol>
    </div>
  );
}
