import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ParentPicker } from "~/components/work-items/parent-picker";
import type { ParentCandidate } from "~/domain/work-items/work-items.server";
import type { WorkItemType } from "~/db/schema";
import { controlErrorMessage } from "~/pwa/unreachable";

type ParentPickerData =
  | { ok: true; type: WorkItemType; query: string; candidates: ParentCandidate[] }
  | { ok: false; candidates: []; error: { field?: string; message: string } };
type ReparentData = { ok: true; changed: number } | { ok: false; error: { field?: string; message: string } };

export function ReparentDialog({
  currentParentId,
  itemId,
  itemSummary,
  itemType,
  open,
  onOpenChange,
}: {
  currentParentId: number | null;
  itemId: number;
  itemSummary: string;
  itemType: WorkItemType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const parentFetcher = useFetcher<ParentPickerData>();
  const reparentFetcher = useFetcher<ReparentData>();
  const [parentQuery, setParentQuery] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const parentData = parentFetcher.data;
  const parentDataIsFresh = parentData?.ok === true && parentData.type === itemType && parentData.query === parentQuery;
  const candidates = parentDataIsFresh ? parentData.candidates : [];
  const selectedParent = candidates.find((candidate) => candidate.id === selectedParentId) ?? null;
  const pending = reparentFetcher.state !== "idle";
  const error = submitted && reparentFetcher.state === "idle" && reparentFetcher.data?.ok === false ? reparentFetcher.data.error.message : null;
  const reopenNotice = selectedParent?.terminalAncestors ?? [];

  useEffect(() => {
    if (!open || itemType === "topic") {
      return;
    }
    parentFetcher.load(`/api/parents?type=${itemType}&q=${encodeURIComponent(parentQuery)}&excludeParentId=${currentParentId ?? ""}`);
  }, [currentParentId, itemType, open, parentQuery]);

  useEffect(() => {
    if (open && submitted && reparentFetcher.state === "idle" && reparentFetcher.data?.ok) {
      onOpenChange(false);
    }
  }, [open, onOpenChange, reparentFetcher.data, reparentFetcher.state, submitted]);

  useEffect(() => {
    if (open) {
      setParentQuery("");
      setSelectedParentId(null);
      setSubmitted(false);
    }
  }, [open, itemId]);

  if (itemType === "topic") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reparent Work Item</DialogTitle>
          <DialogDescription>Choose a different Parent for {itemSummary}. Its subtree follows it.</DialogDescription>
        </DialogHeader>
        <reparentFetcher.Form method="post" action={`/api/work-items/${itemId}/reparent`} className="grid gap-4" onSubmit={() => setSubmitted(true)}>
          <input type="hidden" name="parentId" value={selectedParentId ?? ""} />
          <input type="hidden" name="confirmed" value={reopenNotice.length > 0 ? "true" : "false"} />
          <ParentPicker
            candidates={candidates}
            loading={parentFetcher.state !== "idle" || !parentDataIsFresh}
            parentQuery={parentQuery}
            prefilledParentSummary={null}
            selectedParentId={selectedParentId}
            setParentQuery={setParentQuery}
            setSelectedParentId={setSelectedParentId}
          />
          {reopenNotice.length > 0 ? (
            <div className="rounded-lg border border-status-in-progress/40 bg-status-in-progress-subtle p-3 text-sm text-foreground">
              <p className="font-medium">Reopen Notice</p>
              <p className="mt-1 text-muted-foreground">Reparenting here will move {formatList(reopenNotice.map((item) => item.summary))} to In Progress.</p>
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{controlErrorMessage(error)}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || selectedParent === null}>
              {pending ? "Reparenting" : reopenNotice.length > 0 ? "Reopen and reparent" : "Reparent"}
            </Button>
          </DialogFooter>
        </reparentFetcher.Form>
      </DialogContent>
    </Dialog>
  );
}

function formatList(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}
