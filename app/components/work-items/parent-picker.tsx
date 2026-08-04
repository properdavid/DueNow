import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { StatusMark } from "~/components/ui/work-item-marks";
import type { ParentCandidate } from "~/domain/work-items/work-items.server";

export function ParentPicker({
  candidates,
  loading,
  parentQuery,
  prefilledParentSummary,
  selectedParentId,
  setParentQuery,
  setSelectedParentId,
}: {
  candidates: ParentCandidate[];
  loading: boolean;
  parentQuery: string;
  prefilledParentSummary: string | null;
  selectedParentId: number | null;
  setParentQuery: (value: string) => void;
  setSelectedParentId: (value: number) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-xs font-medium">Parent</legend>
      <Input value={parentQuery} onChange={(event) => setParentQuery(event.currentTarget.value)} placeholder="Filter parents by Summary" aria-label="Filter parents by Summary" />
      {selectedParentId !== null && prefilledParentSummary ? (
        <p className="text-xs text-muted-foreground">Pre-filled Parent: {prefilledParentSummary}</p>
      ) : null}
      <div className="max-h-48 space-y-2 overflow-auto rounded-lg border border-border bg-card p-2">
        {loading ? <p className="px-2 py-1 text-xs text-muted-foreground">Loading Parents…</p> : null}
        {!loading && candidates.length === 0 ? <p className="px-2 py-1 text-xs text-muted-foreground">No Parents found.</p> : null}
        {candidates.map((candidate) => (
          <Button
            key={candidate.id}
            type="button"
            variant="ghost"
            className={`w-full justify-start whitespace-normal text-left ${selectedParentId === candidate.id ? "border-ring bg-accent text-accent-foreground" : ""}`}
            onClick={() => setSelectedParentId(candidate.id)}
          >
            <StatusMark status={candidate.status} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{candidate.summary}</span>
              <span className="block truncate text-xs text-muted-foreground">{candidate.lineage}</span>
            </span>
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
