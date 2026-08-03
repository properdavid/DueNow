import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useFetcher, useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { TypeMark } from "~/components/ui/work-item-marks";
import { ParentPicker } from "~/components/work-items/parent-picker";
import { workItemStatuses, workItemTypes, type WorkItemStatus, type WorkItemType } from "~/db/schema";
import type { ParentCandidate } from "~/domain/work-items/work-items.server";

interface ShellMember {
  id: number;
  email: string;
  name: string;
}

interface ShellLabel {
  id: number;
  name: string;
}

interface CreationDialogPrefill {
  type?: WorkItemType;
  parentId?: number | null;
  parentSummary?: string;
}

interface CreationDialogContextValue {
  openCreationDialog: (prefill?: CreationDialogPrefill) => void;
}

interface CreationDialogProviderProps {
  members: ShellMember[];
  labels: ShellLabel[];
  children: ReactNode;
}

type ParentPickerData =
  | { ok: true; type: WorkItemType; query: string; candidates: ParentCandidate[] }
  | { ok: false; candidates: []; error: { field?: string; message: string } };
type CreateData = { ok: true; id: number } | { ok: false; error: { field?: string; message: string } };

const creationDialogContext = createContext<CreationDialogContextValue | null>(null);

export function CreationDialogProvider({ members, labels, children }: CreationDialogProviderProps) {
  const navigate = useNavigate();
  const createFetcher = useFetcher<CreateData>();
  const parentFetcher = useFetcher<ParentPickerData>();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<WorkItemType>("topic");
  const [status, setStatus] = useState<WorkItemStatus>("open");
  const [parentQuery, setParentQuery] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [prefilledParentSummary, setPrefilledParentSummary] = useState<string | null>(null);

  const parentData = parentFetcher.data;
  const parentDataIsFresh = parentData?.ok === true && parentData.type === type && parentData.query === parentQuery;
  const candidates = parentDataIsFresh ? parentData.candidates : [];
  const selectedParent = candidates.find((candidate) => candidate.id === selectedParentId) ?? null;
  const isTopic = type === "topic";
  const isSubmitting = createFetcher.state !== "idle";
  const createError = createFetcher.data?.ok === false ? createFetcher.data.error.message : null;
  const startNotice = status === "in_progress" ? selectedParent?.startCascade ?? [] : [];
  const reopenNotice = status === "open" || status === "in_progress" ? selectedParent?.terminalAncestors ?? [] : [];

  useEffect(() => {
    if (!open || isTopic) {
      return;
    }
    parentFetcher.load(`/api/parents?type=${type}&q=${encodeURIComponent(parentQuery)}`);
  }, [open, type, parentQuery]);

  useEffect(() => {
    if (createFetcher.data?.ok) {
      setOpen(false);
      navigate(`/items/${createFetcher.data.id}`);
    }
  }, [createFetcher.data, navigate]);

  const contextValue = useMemo<CreationDialogContextValue>(
    () => ({
      openCreationDialog(prefill = {}) {
        setType(prefill.type ?? "topic");
        setStatus("open");
        setParentQuery("");
        setSelectedParentId(prefill.parentId ?? null);
        setPrefilledParentSummary(prefill.parentSummary ?? null);
        setOpen(true);
      },
    }),
    [],
  );

  function onTypeChange(nextType: WorkItemType) {
    setType(nextType);
    setSelectedParentId(null);
    setPrefilledParentSummary(null);
    setParentQuery("");
  }

  return (
    <creationDialogContext.Provider value={contextValue}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Work Item</DialogTitle>
            <DialogDescription>Create any rung of the Type Ladder from one Creation Dialog.</DialogDescription>
          </DialogHeader>
          <createFetcher.Form method="post" action="/api/work-items/create" className="grid gap-4">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="parentId" value={isTopic ? "" : selectedParentId ?? ""} />
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Type</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Type">
                {workItemTypes.map((candidateType) => (
                  <Button
                    key={candidateType}
                    type="button"
                    variant="outline"
                    className={type === candidateType ? "border-ring bg-accent text-accent-foreground" : undefined}
                    onClick={() => onTypeChange(candidateType)}
                    aria-pressed={type === candidateType}
                  >
                    <TypeMark type={candidateType} />
                    {typeLabel(candidateType)}
                  </Button>
                ))}
              </div>
            </fieldset>

            <label className="grid gap-2 text-sm font-medium">
              Summary
              <Input name="summary" required maxLength={200} aria-describedby="summary-help" />
              <span id="summary-help" className="text-sm font-normal text-muted-foreground">Trimmed on save, 200 characters maximum.</span>
            </label>

            {isTopic ? (
              <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">Topics sit at the top of the Type Ladder, so they have no Parent.</div>
            ) : (
              <ParentPicker
                candidates={candidates}
                loading={parentFetcher.state !== "idle" || (!isTopic && !parentDataIsFresh)}
                parentQuery={parentQuery}
                prefilledParentSummary={prefilledParentSummary}
                selectedParentId={selectedParentId}
                setParentQuery={setParentQuery}
                setSelectedParentId={setSelectedParentId}
              />
            )}

            {reopenNotice.length > 0 ? (
              <Notice title="Reopen Notice" text={`Create will move ${formatList(reopenNotice.map((item) => item.summary))} to In Progress.`} />
            ) : null}
            {startNotice.length > 0 ? (
              <Notice title="Start Cascade" text={`Create will move ${formatList(startNotice.map((item) => item.summary))} to In Progress.`} />
            ) : null}

            <label className="grid gap-2 text-sm font-medium">
              Description
              <Textarea name="description" maxLength={20_000} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Due Date
                <Input name="dueDate" type="date" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Status
                <Select name="status" value={status} onChange={(event) => setStatus(event.currentTarget.value as WorkItemStatus)}>
                  {workItemStatuses.map((candidateStatus) => (
                    <option key={candidateStatus} value={candidateStatus}>{statusLabel(candidateStatus)}</option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Assignee
                <Select name="assigneeId" defaultValue="">
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </Select>
              </label>
            </div>

            {labels.length > 0 ? (
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium">Labels</legend>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <label key={label.id} className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                      <input className="accent-primary" type="checkbox" name="labelIds" value={label.id} />
                      {label.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {createError ? <p className="text-sm text-destructive">{createError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || (!isTopic && selectedParent === null)}>
                {isSubmitting ? "Creating" : "Create"}
              </Button>
            </DialogFooter>
          </createFetcher.Form>
        </DialogContent>
      </Dialog>
    </creationDialogContext.Provider>
  );
}

export function CreationDialogTrigger({ compact = false }: { compact?: boolean }) {
  const { openCreationDialog } = useCreationDialog();
  return compact ? (
    <Button aria-label="New Work Item" className="fixed bottom-24 right-4 z-50 rounded-full lg:hidden" size="icon" type="button" onClick={() => openCreationDialog()}>
      <Plus aria-hidden="true" />
    </Button>
  ) : (
    <Button className="mb-4 w-full" type="button" onClick={() => openCreationDialog()}>
      <Plus aria-hidden="true" />
      New Work Item
    </Button>
  );
}

export function useCreationDialog() {
  const context = useContext(creationDialogContext);
  if (!context) {
    throw new Error("useCreationDialog must be used inside CreationDialogProvider");
  }
  return context;
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-status-in-progress/40 bg-status-in-progress-subtle p-3 text-sm text-foreground">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-muted-foreground">{text}</p>
    </div>
  );
}

function typeLabel(type: WorkItemType) {
  return { topic: "Topic", project: "Project", task: "Task", subtask: "Subtask" }[type];
}

function statusLabel(status: WorkItemStatus) {
  return { open: "Open", in_progress: "In Progress", completed: "Completed", closed: "Closed" }[status];
}

function formatList(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}
