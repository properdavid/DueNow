import { PanelRight } from "lucide-react";
import { EmptyCard } from "~/components/shell/empty-card";

export function EmptySelectionCard() {
  return (
    <EmptyCard
      headingLevel="h2"
      headline="Nothing selected"
      line="Pick a work item on the left and it opens here, beside the list."
      Mark={PanelRight}
    />
  );
}
