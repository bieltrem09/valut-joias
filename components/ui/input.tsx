import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "h-10 w-full min-w-0 rounded-control bg-card px-3 text-14 text-foreground ring-1 ring-border shadow-hairline placeholder:text-muted-foreground outline-hidden transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-ring coarse:h-11 disabled:opacity-50";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn(fieldClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        fieldClass,
        "appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-13 font-medium text-subtle-foreground", className)} {...props} />;
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-12 text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-12 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
