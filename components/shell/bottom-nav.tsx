"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { activeNav, NAV } from "./nav";
import { NeonIcon, useBurst } from "./neon-icon";

export function BottomNav() {
  const pathname = usePathname();
  const active = activeNav(pathname);
  const { bursts, fire } = useBurst();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV.map((item) => {
          const isActive = active?.href === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => fire(item.href)}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-0.5 text-11 font-medium outline-hidden transition-[color,transform] duration-150 ease-out-strong active:scale-[0.96] focus-visible:bg-sidebar-active",
                  isActive ? "text-sidebar-strong" : "text-sidebar-muted",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-active"
                    className="nav-glow-bar absolute top-0 h-[2px] w-8 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <NeonIcon icon={Icon} active={isActive} burst={bursts[item.href] ?? 0} size={20} />
                {item.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
