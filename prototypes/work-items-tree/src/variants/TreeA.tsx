// PROTOTYPE — Variant A: "Full outline".
// The whole tree, all four rungs, indentation carries structure. Creation is global
// only (#10's FAB / sidebar button); a row offers "Add child" behind its ⋯ menu, which
// opens that same dialog pre-filled. Terminal items hide behind a per-parent reveal.
import { useState } from "react";
import { type WorkItem } from "../data";
import type { TreeProps } from "../shell";
import { Avatar, Chevron, DueCell, StatusIcon, TypeIcon } from "../screens";
import { terminal, unfinished, useTree } from "../store";

export default function TreeA({ onOpen, selected, compact, onMove, requestCreate }: TreeProps) {
  const t = useTree();
  // v1: the tree always opens fully collapsed. Expansion is session-only and is not
  // remembered — a saved default view is a v2 idea.
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [menu, setMenu] = useState<number | null>(null);

  const toggle = (id: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const expandAll = () => setOpen(new Set(t.items.map((i) => i.id)));
  const collapseAll = () => setOpen(new Set());

  const indent = compact ? 14 : 20;

  const Row = ({ item, depth }: { item: WorkItem; depth: number }) => {
    const all = t.children(item.id);
    const done = all.filter(terminal);
    const shown = revealed.has(item.id) ? all : all.filter(unfinished);
    const isOpen = open.has(item.id);
    const prog = t.progress(item.id);

    return (
      <>
        <li className="relative">
          <div
            className={`touch-min flex items-center gap-1.5 border-b border-line pr-2 hover:bg-surface ${
              compact ? "py-1.5" : "py-1"
            } ${selected === item.id ? "bg-primary-soft" : ""}`}
            style={{ paddingLeft: 6 + depth * indent }}
          >
            <button
              onClick={() => toggle(item.id)}
              className={`flex h-6 w-5 shrink-0 items-center justify-center rounded text-faint hover:bg-raised ${all.length ? "" : "invisible"}`}
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              <Chevron open={isOpen} />
            </button>

            <button onClick={() => onOpen(item.id)} className="flex min-w-0 flex-1 flex-col text-left">
              <span className="flex min-w-0 items-center gap-1.5">
                <TypeIcon type={item.type} size={compact ? 12 : 11} />
                <span className={`truncate ${item.type === "Topic" ? "font-semibold" : ""} ${terminal(item) ? "text-faint line-through" : ""}`}>
                  {item.summary}
                </span>
              </span>
              {/* Compact sheds the columns and stacks a meta line instead — and only
                  prints what the item actually has. */}
              {compact && (
                <span className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
                  <StatusIcon status={item.status} size={13} />
                  <span className="flex items-center gap-1">
                    <Avatar name={item.assignee} size={15} />
                    {item.assignee && <span>{item.assignee}</span>}
                  </span>
                  {item.due && <DueCell due={item.due} settled={terminal(item)} />}
                  {!isOpen && prog.total > 0 && <span className="text-faint">{prog.done}/{prog.total}</span>}
                </span>
              )}
            </button>

            {!compact && (
              <>
                {!isOpen && prog.total > 0 && (
                  <span className="shrink-0 rounded bg-raised px-1.5 text-[11px] text-muted tabular-nums">{prog.done}/{prog.total}</span>
                )}
                <StatusIcon status={item.status} />
                <Avatar name={item.assignee} />
                <span className="w-16 shrink-0 text-right text-[12px]"><DueCell due={item.due} settled={terminal(item)} /></span>
              </>
            )}

            <button
              onClick={() => setMenu(menu === item.id ? null : item.id)}
              className="h-6 w-6 shrink-0 rounded text-muted hover:bg-raised"
              aria-label="Row menu"
            >
              ⋯
            </button>
          </div>

          {menu === item.id && (
            <div className="absolute right-2 z-30 -mt-1 w-44 rounded border border-line bg-bg py-1 shadow-lg">
              {item.type !== "Subtask" && (
                <button
                  onClick={() => { setMenu(null); requestCreate(item.id); }}
                  className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface"
                >
                  Add {t.childTypeOf(item.id)}
                </button>
              )}
              {item.type !== "Topic" && (
                <button onClick={() => { setMenu(null); onMove(item.id); }} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface">
                  Move…
                </button>
              )}
              {/* Start only. Completing runs the settle cascade (ADR-0003) over rows the
                  tree may have collapsed out of sight — that stays a detail-view act. */}
              {item.status === "Open" && (
                <button onClick={() => { setMenu(null); t.setStatus(item.id, "In Progress"); }} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface">Start</button>
              )}
            </div>
          )}
        </li>

        {isOpen && shown.map((c) => <Row key={c.id} item={c} depth={depth + 1} />)}

        {isOpen && done.length > 0 && !revealed.has(item.id) && (
          <li>
            <button
              onClick={() => setRevealed((s) => new Set(s).add(item.id))}
              className="w-full border-b border-line py-1 text-left text-[12px] text-faint hover:bg-surface"
              style={{ paddingLeft: 6 + (depth + 1) * indent + 22 }}
            >
              {done.length} settled — show
            </button>
          </li>
        )}
      </>
    );
  };

  const topics = t.children(null);

  return (
    <div className="pb-6" onClick={(e) => { if (!(e.target as HTMLElement).closest("[aria-label='Row menu']")) setMenu(null); }}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[12px] text-faint">{t.items.filter(unfinished).length} unfinished</span>
        <span className="flex items-center gap-2">
          <button onClick={collapseAll} className="touch-min rounded border border-line px-2 py-1 text-[12px] hover:bg-surface">Collapse all</button>
          <button onClick={expandAll} className="touch-min rounded border border-line px-2 py-1 text-[12px] hover:bg-surface">Expand all</button>
        </span>
      </div>
      <ul className="border-t border-line">
        {topics.filter(unfinished).map((topic) => <Row key={topic.id} item={topic} depth={0} />)}
        {topics.filter(terminal).map((topic) => <Row key={topic.id} item={topic} depth={0} />)}
      </ul>
      <p className="px-3 pt-3 text-[12px] text-faint">
        Creation is the FAB only. A row's ⋯ can pre-fill its parent, but nothing is created in the row itself.
      </p>
    </div>
  );
}
