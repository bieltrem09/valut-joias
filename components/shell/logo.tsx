/** Marca: duas ondas de aproximação (NFC) saindo de um ponto. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <circle cx="11" cy="16" r="2.25" fill="var(--primary-foreground)" />
      <path d="M16 10.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" />
      <path d="M20.5 7a12.6 12.6 0 0 1 0 18" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}
