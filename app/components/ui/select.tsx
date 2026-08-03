import * as React from "react";

import { cn } from "~/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm text-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "[@media(any-pointer:coarse)]:min-h-11",
        className,
      )}
      {...props}
    />
  );
}
