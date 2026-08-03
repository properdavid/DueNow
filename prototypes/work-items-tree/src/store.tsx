// PROTOTYPE — throwaway. In-memory work item store so creation, reparenting and the
// two cascades (ADR-0003) are real enough to feel. No persistence, no server.
import { createContext, useContext, useMemo, useState } from "react";
import { SEED, type Status, type Type, type WorkItem } from "./data";

const CHILD_TYPE: Record<Type, Type | null> = {
  Topic: "Project",
  Project: "Task",
  Task: "Subtask",
  Subtask: null,
};

export const unfinished = (i: WorkItem) => i.status === "Open" || i.status === "In Progress";
export const terminal = (i: WorkItem) => !unfinished(i);

export type Tree = {
  items: WorkItem[];
  byId: (id: number) => WorkItem;
  children: (id: number | null) => WorkItem[];
  descendants: (id: number) => WorkItem[];
  ancestors: (id: number) => WorkItem[];
  lineage: (id: number) => string;
  progress: (id: number) => { done: number; total: number };
  childTypeOf: (parentId: number | null) => Type | null;
  validParentsFor: (type: Type, moving?: number) => WorkItem[];
  create: (parentId: number | null, summary: string, fields?: Partial<WorkItem>) => number;
  reparent: (id: number, parentId: number) => void;
  setStatus: (id: number, status: Status) => void;
  lastCreated: number | null;
};

const Ctx = createContext<Tree | null>(null);

export function TreeProvider({ children: kids }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WorkItem[]>(() => SEED.map((i) => ({ ...i })));
  const [lastCreated, setLastCreated] = useState<number | null>(null);

  const api = useMemo<Tree>(() => {
    const byId = (id: number) => items.find((i) => i.id === id)!;
    const children = (id: number | null) => items.filter((i) => i.parentId === id);
    const descendants = (id: number) => {
      const out: WorkItem[] = [];
      const walk = (n: number) => children(n).forEach((c) => { out.push(c); walk(c.id); });
      walk(id);
      return out;
    };
    const ancestors = (id: number) => {
      const out: WorkItem[] = [];
      let cur = byId(id);
      while (cur?.parentId != null) {
        cur = byId(cur.parentId);
        if (cur) out.unshift(cur);
      }
      return out;
    };
    const childTypeOf = (parentId: number | null) =>
      parentId == null ? ("Topic" as Type) : CHILD_TYPE[byId(parentId).type];

    return {
      items,
      byId,
      children,
      descendants,
      ancestors,
      lineage: (id) => ancestors(id).map((a) => a.summary).join(" › "),
      progress: (id) => {
        const d = descendants(id);
        return { done: d.filter(terminal).length, total: d.length };
      },
      childTypeOf,
      validParentsFor: (type, moving) => {
        const wanted: Type | null = { Topic: null, Project: "Topic", Task: "Project", Subtask: "Task" }[type] as Type | null;
        if (wanted == null) return [];
        const blocked = moving == null ? [] : [moving, ...descendants(moving).map((d) => d.id)];
        return items.filter((i) => i.type === wanted && !blocked.includes(i.id));
      },
      create: (parentId, summary, fields) => {
        const id = Math.max(...items.map((i) => i.id)) + 1;
        const type = (fields?.type ?? childTypeOf(parentId))!;
        setItems((prev) => [
          ...prev,
          { id, type, parentId, summary, status: "Open", assignee: null, due: null, labels: [], ...fields },
        ]);
        setLastCreated(id);
        return id;
      },
      reparent: (id, parentId) => {
        // ADR-0016: the subtree comes along; status reacts at the destination only.
        setItems((prev) => {
          const moved = prev.find((i) => i.id === id)!;
          const next = prev.map((i) => (i.id === id ? { ...i, parentId } : i));
          if (moved.status !== "In Progress") return next;
          const walkUp = (n: number | null) => {
            while (n != null) {
              const p = next.find((i) => i.id === n)!;
              if (p.status !== "Open") break;
              p.status = "In Progress";
              n = p.parentId;
            }
          };
          walkUp(parentId);
          return next;
        });
      },
      setStatus: (id, status) => {
        setItems((prev) => {
          const next = prev.map((i) => ({ ...i }));
          const find = (n: number) => next.find((i) => i.id === n)!;
          const kidsOf = (n: number) => next.filter((i) => i.parentId === n);
          const target = find(id);
          target.status = status;
          if (status === "Completed" || status === "Closed") {
            // Settle Cascade — every unfinished descendant takes the same status.
            const walk = (n: number) =>
              kidsOf(n).forEach((c) => {
                if (unfinished(c)) c.status = status;
                walk(c.id);
              });
            walk(id);
          }
          if (status === "In Progress") {
            // Start Cascade — Open ancestors move up, stopping at the first already started.
            let p = target.parentId;
            while (p != null) {
              const a = find(p);
              if (a.status !== "Open") break;
              a.status = "In Progress";
              p = a.parentId;
            }
          }
          return next;
        });
      },
      lastCreated,
    };
  }, [items, lastCreated]);

  return <Ctx.Provider value={api}>{kids}</Ctx.Provider>;
}

export function useTree() {
  return useContext(Ctx)!;
}
