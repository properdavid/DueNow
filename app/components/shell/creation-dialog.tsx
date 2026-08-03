import { Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

interface CreationDialogProps {
  compact?: boolean;
}

export function CreationDialog({ compact = false }: CreationDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {compact ? (
          <Button aria-label="New work item" className="fixed bottom-24 right-4 z-50 rounded-full lg:hidden" size="icon">
            <Plus aria-hidden="true" />
          </Button>
        ) : (
          <Button className="mb-4 w-full" type="button">
            <Plus aria-hidden="true" />
            New work item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New work item</DialogTitle>
          <DialogDescription>
            Create any rung of the Type Ladder from one place.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Type
            <Select required>
              <option>Topic</option>
              <option>Project</option>
              <option>Task</option>
              <option>Subtask</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Summary
            <Input required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Parent
            <Select required>
              <option>Parent Picker options load here</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Description
            <Textarea />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Assignee
              <Select>
                <option>Unassigned</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Status
              <Select>
                <option>Open</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Closed</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Due Date
              <Input type="date" />
            </label>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
