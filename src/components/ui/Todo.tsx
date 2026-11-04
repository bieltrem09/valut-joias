import { isTodo, type Todo as TodoT } from "@/content/zeroum";

/** Aviso visível de conteúdo pendente. Some sozinho quando o dado real é preenchido. */
export function Todo({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`todo ${className}`} role="note">
      <span aria-hidden="true">●</span>
      <span>
        A CONFIRMAR · <span className="normal-case">{children}</span>
      </span>
    </span>
  );
}

/** Mostra o texto real ou o aviso de pendência. */
export function Value({ v, className }: { v: string | TodoT; className?: string }) {
  if (isTodo(v)) return <Todo className={className}>{v.todo}</Todo>;
  return <span className={className}>{v}</span>;
}
