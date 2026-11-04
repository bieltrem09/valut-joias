/** Rótulo numerado de seção: "03 / ESTRUTURA" */
export function SectionLabel({ n, children, className = "" }: { n: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`label flex items-center gap-3 ${className}`}>
      <span className="text-red-bright [.surface-paper_&]:text-red-ink">{n}</span>
      <span className="h-px w-8 bg-current opacity-30" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
