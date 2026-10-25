"use client";

import * as React from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Painel lateral. Spring 260/28 para entrar (interrompível), overlay em fade de 150ms.
 * Controlado: o AnimatePresence precisa saber quando fecha para animar a saída.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount {...(description ? {} : { "aria-describedby": undefined })}>
              <motion.div
                className={cn(
                  "fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] flex-col bg-background shadow-pop outline-hidden sm:inset-y-2 sm:right-2 sm:rounded-card sm:ring-1 sm:ring-border",
                  className,
                )}
                initial={reduce ? { opacity: 0 } : { transform: "translateX(104%)" }}
                animate={reduce ? { opacity: 1 } : { transform: "translateX(0%)" }}
                exit={reduce ? { opacity: 0 } : { transform: "translateX(104%)" }}
                transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 260, damping: 28 }}
              >
                <header className="flex items-start gap-4 border-b border-border px-6 pb-4 pt-5">
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-20 font-semibold tracking-[-0.01em] text-foreground">{title}</Dialog.Title>
                    {description ? <Dialog.Description className="mt-1 text-13 text-muted-foreground">{description}</Dialog.Description> : null}
                  </div>
                  <Dialog.Close
                    className="-mr-2 grid size-9 shrink-0 place-items-center rounded-control text-muted-foreground transition-[transform,background-color] duration-150 hover-fine:bg-muted hover-fine:text-foreground active:scale-[0.96] coarse:size-11"
                    aria-label="Fechar"
                  >
                    <X className="size-4" strokeWidth={1.5} />
                  </Dialog.Close>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
                {footer ? <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</footer> : null}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
