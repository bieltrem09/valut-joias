"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "motion/react";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeNav, NAV } from "./nav";
import { LogoMark } from "./logo";
import { NeonIcon, useBurst } from "./neon-icon";
import { ThemeToggle } from "./theme-toggle";
import { useSidebar } from "./providers";

/**
 * ≥1280: expandida (ou recolhida, se o dono escolheu). 768–1279: sempre ícones.
 * <768: some, e o BottomNav assume.
 */
export function Sidebar({ email }: { email: string }) {
  const { collapsed } = useSidebar();
  // "wide" = rótulos visíveis. Abaixo de xl, CSS força ícones.
  const wide = !collapsed;

  return (
    <aside
      data-wide={wide}
      className={cn(
        "group/sb sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
        "w-[72px] transition-[width] duration-200 ease-out-strong motion-reduce:transition-none",
        wide && "xl:w-[248px]",
      )}
      aria-label="Navegação principal"
    >
      {/* Logo e nome levam à página inicial. */}
      <Link
        href="/"
        aria-label="Basik7: ir para o início"
        className="group/logo mx-2 mt-1 flex h-14 items-center gap-3 rounded-card px-2.5 outline-hidden transition-colors duration-150 hover-fine:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-sidebar-accent"
      >
        <LogoMark className="size-9 shrink-0 transition-transform duration-300 ease-out-strong group-hover/logo:scale-105 group-active/logo:scale-95 motion-reduce:transition-none" />
        <span className="hidden min-w-0 leading-tight group-data-[wide=true]/sb:xl:block">
          <span className="block truncate text-14 font-semibold tracking-[-0.01em] text-sidebar-strong">Basik7</span>
          <span className="block truncate text-12 text-sidebar-muted">Painel do dono</span>
        </span>
      </Link>

      <nav className="mt-4 flex flex-col gap-1 px-3">
        <Suspense fallback={null}>
          <NavLinks />
        </Suspense>
      </nav>

      <div className="mt-auto border-t border-sidebar-border px-3 py-3">
        <p className="hidden truncate px-2 pb-2 text-12 text-sidebar-muted group-data-[wide=true]/sb:xl:block" title={email}>
          {email}
        </p>
        <div className="flex flex-col items-center gap-1 group-data-[wide=true]/sb:xl:flex-row">
          <ThemeToggle />
          <Link
            href="/configuracoes"
            aria-label="Configurações"
            title="Configurações"
            className="grid size-9 place-items-center rounded-control text-sidebar-muted outline-hidden transition-[transform,background-color,color] duration-150 ease-out-strong hover-fine:bg-sidebar-active hover-fine:text-sidebar-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-sidebar-accent coarse:size-11"
          >
            <Settings2 className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function NavLinks() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = activeNav(pathname);
  const { bursts, fire } = useBurst();
  const p = sp.get("p");
  const periodQs = p ? `?${new URLSearchParams(Object.fromEntries(["p", "de", "ate"].filter((k) => sp.get(k)).map((k) => [k, sp.get(k)!]))).toString()}` : "";

  return NAV.map((item) => {
    const isActive = active?.href === item.href;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.period ? `${item.href}${periodQs}` : item.href}
        aria-current={isActive ? "page" : undefined}
        title={item.label}
        onClick={() => fire(item.href)}
        className={cn(
          "relative flex h-10 items-center gap-3 rounded-control px-3 text-14 outline-hidden transition-[color,transform] duration-150 ease-out-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-sidebar-accent coarse:h-11",
          isActive ? "text-sidebar-strong" : "text-sidebar-foreground hover-fine:text-sidebar-strong",
        )}
      >
        {isActive && (
          <motion.span layoutId="nav-active" className="nav-glow absolute inset-0 rounded-control" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <span className="nav-glow-bar absolute inset-y-2.5 left-0 w-[2px] rounded-full" />
          </motion.span>
        )}
        <NeonIcon icon={Icon} active={isActive} burst={bursts[item.href] ?? 0} size={18} />
        <span className="relative hidden truncate group-data-[wide=true]/sb:xl:inline">{item.label}</span>
      </Link>
    );
  });
}
