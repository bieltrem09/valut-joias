import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const chipVariants = cva("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-12 font-medium [&_svg]:size-3.5", {
  variants: {
    tone: {
      neutral: "bg-muted text-subtle-foreground",
      profit: "bg-profit-soft text-profit",
      cost: "bg-cost-soft text-cost",
      pending: "bg-pending-soft text-pending",
      brand: "bg-accent text-accent-foreground",
      hero: "bg-hero-chip text-hero-foreground",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Chip({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof chipVariants>) {
  return <span className={cn(chipVariants({ tone }), className)} {...props} />;
}

/** Ponto + texto para status (cor nunca é o único sinal). */
export function StatusDot({ tone, children }: { tone: "profit" | "cost" | "pending" | "neutral"; children: React.ReactNode }) {
  const dot = { profit: "bg-profit", cost: "bg-cost", pending: "bg-pending", neutral: "bg-muted-foreground/60" }[tone];
  return (
    <span className="inline-flex items-center gap-2 text-13 text-foreground">
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
      {children}
    </span>
  );
}
