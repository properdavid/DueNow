import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

const popoverContentVariants = cva(
  "z-50 min-w-40 rounded-lg border border-border bg-popover p-1 text-xs text-popover-foreground shadow-lg",
);

export function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />;
}

export function PopoverTrigger({ className, asChild, ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger asChild={asChild} className={className} {...props} />;
}

export function PopoverContent({ className, align = "start", ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content align={align} className={cn(popoverContentVariants(), className)} sideOffset={4} {...props} />
    </PopoverPrimitive.Portal>
  );
}
