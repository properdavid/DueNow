import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

/* Statuses are uppercase micro-badges; a Label chip is a neutral pill. The two
   are told apart by treatment rather than hue (ADR-0014, ADR-0018). */
const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-md border",
  {
    variants: {
      variant: {
        status:
          "px-1.5 py-0 text-[10px] font-bold uppercase tracking-wide border-border bg-muted text-muted-foreground",
        chip: "rounded-full px-2 py-0.5 text-sm border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "status",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
