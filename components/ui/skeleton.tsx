import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-inner bg-skeleton motion-reduce:animate-none", className)} {...props} />;
}
