import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium",
    "transition-[transform,background-color,color,box-shadow] duration-150 ease-out-strong active:scale-[0.96] motion-reduce:active:scale-100",
    "disabled:pointer-events-none disabled:opacity-50 outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover-fine:bg-primary/90 shadow-hairline",
        secondary: "bg-card text-foreground ring-1 ring-border shadow-hairline hover-fine:bg-muted",
        ghost: "text-subtle-foreground hover-fine:bg-muted hover-fine:text-foreground",
        destructive: "bg-destructive text-white hover-fine:bg-destructive/90",
        link: "h-auto px-0 text-primary underline-offset-4 hover-fine:underline",
      },
      size: {
        sm: "h-8 px-3 text-13 coarse:h-11",
        md: "h-10 px-4 text-14 coarse:h-11",
        icon: "size-9 coarse:size-11",
        "icon-sm": "size-8 coarse:size-11",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
