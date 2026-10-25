"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const label = dark ? "Usar tema claro" : "Usar tema escuro";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-control text-sidebar-muted outline-hidden transition-[transform,background-color,color] duration-150 ease-out-strong hover-fine:bg-sidebar-active hover-fine:text-sidebar-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-sidebar-accent coarse:size-11",
        className,
      )}
    >
      <Sun
        strokeWidth={1.5}
        className={cn(
          "absolute size-4 transition-[opacity,transform] duration-200 ease-out-strong motion-reduce:transition-opacity",
          dark ? "scale-90 opacity-0" : "opacity-100",
        )}
      />
      <Moon
        strokeWidth={1.5}
        className={cn(
          "absolute size-4 transition-[opacity,transform] duration-200 ease-out-strong motion-reduce:transition-opacity",
          dark ? "opacity-100" : "scale-90 opacity-0",
        )}
      />
    </button>
  );
}
