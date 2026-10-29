"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { activeNav, NAV } from "./nav";

/**
 * Menu que responde no toque: a aba marca na hora (antes da página chegar do
 * servidor) e a página começa a carregar quando o dedo encosta ou o mouse passa por cima.
 */
export function useNavOtimista() {
  const pathname = usePathname();
  const router = useRouter();
  const [alvo, setAlvo] = React.useState<string | null>(null);
  const jaPedido = React.useRef(new Map<string, number>());

  // A página nova chegou: a marcação passa a vir do endereço de verdade.
  React.useEffect(() => setAlvo(null), [pathname]);

  const real = activeNav(pathname);
  const ativo = alvo ? (NAV.find((n) => n.href === alvo) ?? real) : real;
  const carregando = !!alvo && alvo !== real?.href;

  const adiantar = React.useCallback(
    (href: string) => {
      const agora = Date.now();
      // Uma vez a cada 30 s por aba (o mesmo tempo que o painel guarda a página).
      if (agora - (jaPedido.current.get(href) ?? 0) < 30_000) return;
      jaPedido.current.set(href, agora);
      router.prefetch(href, { kind: "full" } as unknown as Parameters<typeof router.prefetch>[1]);
    },
    [router],
  );

  const marcar = React.useCallback(
    (href: string, e?: React.MouseEvent) => {
      // Ctrl/Cmd+clique abre em outra aba do navegador: nada muda aqui.
      if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
      if (href !== activeNav(pathname)?.href) setAlvo(href);
    },
    [pathname],
  );

  return { ativo, carregando, marcar, adiantar };
}

/** Barrinha no topo enquanto a página nova carrega. */
export function BarraCarregando({ ativa }: { ativa: boolean }) {
  if (!ativa) return null;
  return (
    <div data-carregando-rota aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] overflow-hidden">
      <div className="barra-rota h-full bg-primary shadow-[0_0_8px_var(--primary)]" />
    </div>
  );
}
