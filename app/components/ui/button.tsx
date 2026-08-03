import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

/* Touch comfort is expressed here and nowhere else (ADR-0014): a coarse pointer
   raises the interactive minimum to 44px while type and spacing hold. Call sites
   never restate it. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium " +
    "transition-colors hover-elevate active-elevate-2 " +
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 " +
    "[@media(any-pointer:coarse)]:min-h-11",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-card text-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        // A ghost button carries a transparent border so it does not jump on hover.
        ghost: "border border-transparent text-foreground",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-sm",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9 [@media(any-pointer:coarse)]:min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
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
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { buttonVariants };
