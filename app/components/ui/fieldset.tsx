import * as React from "react";

import { cn } from "~/lib/utils";

export function Fieldset({
  className,
  ...props
}: React.FieldsetHTMLAttributes<HTMLFieldSetElement>) {
  return <fieldset className={cn("grid gap-2", className)} {...props} />;
}

export function FieldsetLegend({
  className,
  ...props
}: React.HTMLAttributes<HTMLLegendElement>) {
  // A rendered legend sits outside its fieldset's formatting context, so the
  // Fieldset's `gap` never reaches it — the Field Label's 8px is a margin here.
  return <legend className={cn("mb-2 text-xs font-medium", className)} {...props} />;
}
