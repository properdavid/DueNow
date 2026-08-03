import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

const menuContentVariants = cva(
  "z-50 min-w-40 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg",
);

const menuItemVariants = cva(
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [@media(any-pointer:coarse)]:min-h-11 [&_svg]:size-4 [&_svg]:shrink-0",
);

const menuTriggerVariants = cva(
  "inline-flex items-center justify-center rounded-md border border-transparent text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export function Menu(props: React.ComponentProps<typeof DropdownMenu.Root>) {
  return <DropdownMenu.Root {...props} />;
}

export function MenuTrigger({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Trigger>) {
  return <DropdownMenu.Trigger className={cn(menuTriggerVariants(), className)} {...props} />;
}

export function MenuContent({ className, align = "end", ...props }: React.ComponentProps<typeof DropdownMenu.Content>) {
  return <DropdownMenu.Portal><DropdownMenu.Content align={align} className={cn(menuContentVariants(), className)} sideOffset={4} {...props} /></DropdownMenu.Portal>;
}

export function MenuItem({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Item>) {
  return <DropdownMenu.Item className={cn(menuItemVariants(), className)} {...props} />;
}
