import { PanelRight } from "lucide-react";

export function EmptySelectionCard() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center text-card-foreground">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <PanelRight aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold">Nothing selected</h2>
      <p className="mt-2 text-sm text-muted-foreground">Pick a work item on the left and it opens here, beside the list.</p>
    </div>
  );
}
