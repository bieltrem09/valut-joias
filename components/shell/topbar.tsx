"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { activeNav, EXTRA_TITLES } from "./nav";
import { PeriodPicker } from "./period-picker";
import { useSidebar } from "./providers";
import { LogoMark } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const pathname = usePathname();
  const nav = activeNav(pathname);
  const title = nav?.label ?? EXTRA_TITLES[pathname] ?? "Basik7";
  const { collapsed, toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-[1280px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:flex-nowrap md:px-8">
        <Link
          href="/"
          aria-label="Basik7: ir para o início"
          className="shrink-0 rounded-control outline-hidden focus-visible:ring-2 focus-visible:ring-ring active:scale-95 md:hidden"
        >
          <LogoMark className="size-8" />
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-pressed={!collapsed}
          className="-ml-2 hidden size-9 place-items-center rounded-control text-muted-foreground outline-hidden transition-[transform,background-color,color] duration-150 ease-out-strong hover-fine:bg-muted hover-fine:text-foreground active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring xl:grid"
        >
          <PanelLeft className="size-[18px]" strokeWidth={1.5} />
        </button>
        <span className="hidden h-5 w-px bg-border xl:block" aria-hidden />
        <h1 className="text-16 font-semibold tracking-[-0.01em]">{title}</h1>
        {/* No mobile não há sidebar: o tema mora aqui. */}
        <ThemeToggle className="ml-auto text-muted-foreground hover-fine:bg-muted hover-fine:text-foreground focus-visible:ring-ring md:hidden" />
        {nav?.period && (
          <div className="order-last w-full md:order-none md:ml-auto md:w-auto">
            <PeriodPicker />
          </div>
        )}
      </div>
    </header>
  );
}
