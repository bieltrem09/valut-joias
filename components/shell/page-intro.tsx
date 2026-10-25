export function PageIntro({ eyebrow, children, actions }: { eyebrow: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="eyebrow text-primary">{eyebrow}</p>
        <p className="mt-2 text-20 font-medium tracking-[-0.015em] text-subtle-foreground text-balance md:text-28 md:tracking-[-0.02em]">{children}</p>
      </div>
      {actions}
    </div>
  );
}
