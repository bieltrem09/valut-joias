import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * A escala tipográfica do projeto (text-11 … text-56) é custom; sem isso o
 * tailwind-merge confunde `text-14` com cor e descarta `text-primary-foreground`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["11", "12", "13", "14", "16", "20", "28", "56"] }],
      rounded: [{ rounded: ["card", "control", "inner"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
