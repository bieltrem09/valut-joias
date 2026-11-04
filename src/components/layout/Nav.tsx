"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { CircleLink } from "@/components/ui/Buttons";
import { navLinks, zeroum } from "@/content/zeroum";
import { WA_GERAL } from "@/lib/whatsapp";
import { OpenChip } from "./OpenChip";

/**
 * Nav: some ao rolar para baixo, volta ao rolar para cima com fundo preto 85% + blur.
 * Motion (emil/animate): feedback de direção · transform translateY · 250ms ease-out.
 * Mobile: <dialog> nativo em tela cheia (focus trap e Esc de graça).
 */
export function Nav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        if (Math.abs(delta) > 6) {
          setHidden(delta > 0 && y > 240);
          last = y;
        }
        setSolid(y > 40);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const openMenu = () => {
    dlg.current?.showModal();
    window.__lenis?.stop();
  };
  const closeMenu = () => {
    dlg.current?.close();
  };
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    const onClose = () => window.__lenis?.start();
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);
  useEffect(() => closeMenu(), [pathname]);

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] btn btn-white">
        Pular para o conteúdo
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color] duration-[250ms] ease-[var(--ease-out)] motion-reduce:transition-[background-color] ${
          hidden ? "-translate-y-full motion-reduce:translate-y-0" : "translate-y-0"
        } ${solid ? "bg-black/85 backdrop-blur-md" : "bg-transparent"}`}
      >
        <nav aria-label="Principal" className="container-site flex h-[var(--nav-h)] items-center justify-between gap-4">
          <Link href="/" aria-label={`${zeroum.nome} — início`} className="shrink-0 py-3">
            <Logo className="h-7 w-auto md:h-8" />
          </Link>

          <ul className="glass hidden items-center gap-1 rounded-full p-1 lg:flex">
            {navLinks.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                      active ? "bg-white text-black" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <OpenChip className="glass hidden h-12 rounded-full px-4 xl:inline-flex" />
            <Link href="/aula-experimental" className="btn btn-white hidden md:inline-flex">
              Aula experimental
            </Link>
            <CircleLink href={WA_GERAL} label="Falar no WhatsApp" className="hidden md:inline-grid" />
            <button
              type="button"
              onClick={openMenu}
              className="btn-circle !bg-white !text-black lg:hidden"
              aria-label="Abrir menu"
              aria-haspopup="dialog"
            >
              <Menu size={20} aria-hidden="true" style={{ transform: "none" }} />
            </button>
          </div>
        </nav>
      </header>

      <dialog ref={dlg} className="menu" aria-label="Menu" onClick={(e) => e.target === dlg.current && closeMenu()}>
        <div className="container-site flex h-full flex-col">
          <div className="flex h-[var(--nav-h)] items-center justify-between">
            <Logo className="h-7 w-auto" />
            <button type="button" onClick={closeMenu} className="btn-circle !bg-white !text-black" aria-label="Fechar menu">
              <X size={20} aria-hidden="true" style={{ transform: "none" }} />
            </button>
          </div>
          <ul className="mt-6 flex flex-col">
            <li className="hairline border-b">
              <Link href="/" className="display block py-3 text-[clamp(2.75rem,13vw,4.5rem)]" onClick={closeMenu}>
                Início
              </Link>
            </li>
            {navLinks.map((l, i) => (
              <li key={l.href} className="hairline border-b">
                <Link
                  href={l.href}
                  onClick={closeMenu}
                  aria-current={pathname.startsWith(l.href) ? "page" : undefined}
                  className="display flex items-baseline justify-between py-3 text-[clamp(2.75rem,13vw,4.5rem)] aria-[current=page]:text-red"
                >
                  {l.label}
                  <span className="label text-gray-300">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
            <OpenChip withTime className="inline-flex text-gray-300" />
            <Link href="/aula-experimental" className="btn btn-red justify-center" onClick={closeMenu}>
              Agendar aula experimental
            </Link>
            <a href={WA_GERAL} className="btn btn-outline justify-center" target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
