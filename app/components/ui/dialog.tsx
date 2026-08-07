import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-foreground/40", className)}
      {...props}
    />
  );
}

/* A dialog is floating, temporary UI, so it is one of the few things allowed to
   cast a shadow (ADR-0014). */
function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col",
          /* A tall form on a phone must stay inside the viewport and scroll inside
             itself — the page behind it is locked while the dialog is open, and the
             close affordance stays put because only the inner region scrolls. */
          "max-h-[calc(100dvh-2rem)] overflow-hidden",
          "rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
          className,
        )}
        /* Focus the panel itself rather than its first control: iOS Safari opens a
           native select's picker the moment it takes focus, so a dialog that opens
           onto a select appears to have been tapped twice. */
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
        {...props}
      >
        {/* Setting overflow-y alone computes overflow-x to auto, which iOS bounces
           horizontally even with nothing to scroll to; hiding x also means floating
           UI in here must portal out rather than overflow the panel. */}
        <div className="overflow-y-auto overflow-x-hidden overscroll-y-contain p-6">{children}</div>
        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md",
            "border border-transparent text-muted-foreground hover-elevate active-elevate-2",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "[@media(any-pointer:coarse)]:h-11 [@media(any-pointer:coarse)]:w-11",
          )}
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 pb-4", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
};
