"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGroup, motion } from "motion/react";
import { Popover } from "radix-ui";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_PERIOD, PERIOD_KEYS, type PeriodKey } from "@/lib/period";
import { addDays, shortDate, todaySP } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const PILLS: { key: Exclude<PeriodKey, "custom">; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
];

/** O período mora na URL (?p=30d). O pill se move na hora; os dados chegam em seguida. */
export function PeriodPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const raw = sp.get("p");
  const current: PeriodKey = (PERIOD_KEYS as readonly string[]).includes(raw ?? "") ? (raw as PeriodKey) : DEFAULT_PERIOD;
  const [optimistic, setOptimistic] = React.useOptimistic(current);
  const [pending, start] = React.useTransition();
  const [open, setOpen] = React.useState(false);

  const today = todaySP();
  const [de, setDe] = React.useState(sp.get("de") ?? addDays(today, -13));
  const [ate, setAte] = React.useState(sp.get("ate") ?? today);

  const go = (key: PeriodKey, extra?: Record<string, string>) => {
    const q = new URLSearchParams({ p: key, ...extra });
    start(() => {
      setOptimistic(key);
      router.push(`${pathname}?${q.toString()}`, { scroll: false });
    });
  };

  const customLabel = current === "custom" && sp.get("de") && sp.get("ate") ? `${shortDate(sp.get("de")!)} – ${shortDate(sp.get("ate")!)}` : "Datas";

  return (
    <LayoutGroup id="period">
      <div
        role="radiogroup"
        aria-label="Período"
        aria-busy={pending}
        className="no-scrollbar flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-card p-1 shadow-hairline ring-1 ring-border"
      >
        {PILLS.map((p) => (
          <Pill key={p.key} active={optimistic === p.key} onClick={() => go(p.key)}>
            {p.label}
          </Pill>
        ))}
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <Pill
              active={optimistic === "custom"}
              radio={false}
              aria-label={customLabel === "Datas" ? "Escolher datas" : `Período personalizado: ${customLabel}`}
            >
              <CalendarDays className="size-3.5" strokeWidth={1.5} />
              <span className="font-mono text-12 tabular-nums">{customLabel === "Datas" ? <span className="font-sans text-13">Datas</span> : customLabel}</span>
            </Pill>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={8}
              className="z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-card bg-popover p-4 shadow-pop ring-1 ring-border outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-[0.97] data-[state=closed]:zoom-out-[0.97] data-[state=open]:duration-150 data-[state=closed]:duration-100"
            >
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!de || !ate) return;
                  setOpen(false);
                  go("custom", { de, ate });
                }}
              >
                <p className="text-14 font-medium">Escolha o intervalo</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="De" htmlFor="pp-de">
                    <Input id="pp-de" type="date" value={de} max={ate || today} onChange={(e) => setDe(e.target.value)} className="px-2 font-mono text-12" />
                  </Field>
                  <Field label="Até" htmlFor="pp-ate">
                    <Input
                      id="pp-ate"
                      type="date"
                      value={ate}
                      min={de}
                      max={today}
                      onChange={(e) => setAte(e.target.value)}
                      className="px-2 font-mono text-12"
                    />
                  </Field>
                </div>
                <Button type="submit" variant="primary" size="sm" className="justify-self-end">
                  Aplicar
                </Button>
              </form>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </LayoutGroup>
  );
}

const Pill = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { active: boolean; radio?: boolean }>(function Pill(
  { active, radio = true, children, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...(radio ? { role: "radio", "aria-checked": active } : { "aria-current": active ? ("true" as const) : undefined })}
      className={cn(
        "relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-13 font-medium outline-hidden transition-[color,transform] duration-150 ease-out-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring coarse:h-10",
        active ? "text-accent-foreground" : "text-muted-foreground hover-fine:text-foreground",
        className,
      )}
      {...props}
    >
      {active && (
        <motion.span layoutId="period-pill" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
      )}
      <span className="relative flex items-center gap-1.5">{children}</span>
    </button>
  );
});
