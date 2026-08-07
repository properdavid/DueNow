import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

/* Touch comfort is expressed here and nowhere else (ADR-0014): a coarse pointer
   raises the interactive minimum to 44px while type and spacing hold. Call sites
   never restate it. `inline` is the one size that opts out — it dresses a click
   target on content, which the effect scheme deliberately does not colour. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md " +
    "transition-colors hover-elevate active-elevate-2 " +
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      /* A button's colour states its effect on stored data (ADR-0034). Hue is
         valence, fill versus border is persistence. */
      variant: {
        write: "bg-primary text-primary-foreground",
        open: "border border-primary bg-card text-primary",
        destroy: "bg-destructive text-destructive-foreground",
        discard: "border border-destructive bg-card text-destructive",
        neutral: "border border-input bg-card text-muted-foreground",
        // Carries a transparent border so it does not jump on hover.
        bare: "border border-transparent text-muted-foreground",
        inline: "border border-transparent text-foreground",
      },
      size: {
        default: "min-h-9 whitespace-nowrap px-4 py-2 text-xs font-medium [@media(any-pointer:coarse)]:min-h-11",
        sm: "min-h-8 whitespace-nowrap px-3 text-xs font-medium [@media(any-pointer:coarse)]:min-h-11",
        lg: "min-h-10 whitespace-nowrap px-8 text-xs font-medium [@media(any-pointer:coarse)]:min-h-11",
        icon: "h-9 w-9 [@media(any-pointer:coarse)]:min-h-11 [@media(any-pointer:coarse)]:min-w-11",
        inline: "block w-full justify-start whitespace-normal text-left",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
