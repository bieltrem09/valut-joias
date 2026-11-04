import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Tone = "red" | "white" | "black" | "outline";

export function PillLink({
  href,
  children,
  tone = "red",
  external,
  className = "",
  arrow = true,
}: {
  href: string;
  children: React.ReactNode;
  tone?: Tone;
  external?: boolean;
  className?: string;
  arrow?: boolean;
}) {
  const cls = `btn btn-${tone} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      {arrow && <ArrowRight className="btn-arrow" size={18} strokeWidth={2} aria-hidden="true" />}
    </>
  );
  if (external)
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export function CircleLink({ href, label, external = true, className = "" }: { href: string; label: string; external?: boolean; className?: string }) {
  const props = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a href={href} aria-label={label} className={`btn-circle ${className}`} {...props}>
      <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
    </a>
  );
}
