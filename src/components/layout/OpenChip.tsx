"use client";
import { useNow } from "@/lib/useNow";

/** ● ABERTO 24H — com a hora de Americana quando o JS carrega. */
export function OpenChip({ className = "inline-flex", withTime = false }: { className?: string; withTime?: boolean }) {
  const now = useNow();
  return (
    <span className={`label items-center gap-2 whitespace-nowrap ${className}`}>
      <span className="pulse-dot" aria-hidden="true" />
      <span>
        Aberto 24h
        {withTime && now && (
          <span className="text-gray-300" aria-hidden="true">
            {" "}· {now.hhmm}
          </span>
        )}
      </span>
    </span>
  );
}
