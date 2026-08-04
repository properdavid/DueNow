import * as React from "react";

import { cn } from "~/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex min-h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-xs text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        // iOS Safari zooms the page when a control under 16px takes focus, and the
        // viewport meta deliberately keeps pinch-to-zoom available (ADR-0032).
        "[@media(any-pointer:coarse)]:min-h-11 [@media(any-pointer:coarse)]:text-base",
        className,
      )}
      {...props}
    />
  );
}
