// PROTOTYPE — Variant B: "Drill-down".
// The tree is never drawn whole and nothing is ever indented: you stand *inside* one
// work item and see a flat, full-width list of its children. Creation is contextual by
// construction — the parent is where you are standing, so there is no picker.
import { useState } from "react";
import type { WorkItem } from "../data";
import { Avatar, DueCell, StatusBadge, StatusDot } from "../screens";
import type { TreeProps } from "../shell";
import { terminal, unfinished, useTree } from "../store";

export default function TreeB({ onOpen, selected, compact, onMove }: TreeProps) {
  const t = useTree();
  const [focus, setFocus] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [draft, setDraft] = useState("");
  const [capture, setCapture] = useState<number | null>(null);

  const focusItem = focus == null ? null : t.byId(focus);
  const path = focus == null ? [] : [...t.ancestors(focus), focusItem!];
  const childType = t.childTypeOf(focus);

  const listFor = (id: number | null) => {
    const kids = t.children(id);
    return showAll ? kids : kids.filter(unfinished);
  };

  const enter = (item: WorkItem) => (item.type === "Subtask" ? onOpen(item.id) : setFocus(item.id));

  const submit = () => {
    if (draft.trim()) t.create(focus, draft.trim());
    setDraft("");
  };

  const Row = ({ item }: { item: WorkItem }) => {
    const prog = t.progress(item.id);
    return (
      <li>
        <div className={`touch-min flex items-center gap-2 border-b border-line pr-2 hover:bg-surface ${selected === item.id ? "bg-primary-soft" : ""}`}>
          <button onClick={() => enter(item)} className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 text-left">
            <StatusDot status={item.status} />
            <span className="min-w-0 flex-1">
              <span className={`block truncate ${terminal(item) ? "text-faint line-through" : ""}`}>{item.summary}</span>
              {(item.due || item.assignee || prog.total > 0) && (
                <span className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
                  {item.assignee && <span>{item.assignee}</span>}
                  {item.due && <DueCell due={item.due} />}
                  {prog.total > 0 && <span className="text-faint">{prog.done}/{prog.total} settled</span>}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => onOpen(item.id)}
            className="shrink-0 rounded px-2 py-1 text-[11px] text-faint hover:bg-raised"
            aria-label="Open detail"
          >
            detail
          </button>
          {item.type !== "Subtask" && <span className="shrink-0 pr-1 text-faint">›</span>}
        </div>
      </li>
    );
  };

  const Column = ({ id }: { id: number | null }) => (
    <div className="flex min-w-0 flex-1 shrink flex-col border-r border-line last:border-r-0">
      <div className="flex items-center gap-1 border-b border-line bg-surface px-2 py-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
        {id == null ? "Topics" : t.byId(id).summary}
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {listFor(id).map((c) => (
          <li key={c.id}>
            <button
              onClick={() => (c.type === "Subtask" ? onOpen(c.id) : setFocus(c.id))}
              className={`touch-min flex w-full items-center gap-1.5 border-b border-line px-2 py-1.5 text-left hover:bg-surface ${
                path.some((p) => p.id === c.id) ? "bg-primary-soft" : selected === c.id ? "bg-raised" : ""
              }`}
            >
              <StatusDot status={c.status} />
              <span className={`min-w-0 flex-1 truncate text-[13px] ${terminal(c) ? "text-faint line-through" : ""}`}>{c.summary}</span>
              {c.due && <span className="shrink-0 text-[11px]"><DueCell due={c.due} /></span>}
              {c.type !== "Subtask" && <span className="shrink-0 text-faint">›</span>}
            </button>
          </li>
        ))}
        {t.childTypeOf(id) && (
          <li>
            {capture === id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) { t.create(id, draft.trim()); setDraft(""); }
                  if (e.key === "Escape") { setCapture(null); setDraft(""); }
                }}
                onBlur={() => { if (!draft.trim()) setCapture(null); }}
                placeholder={`New ${t.childTypeOf(id)}…`}
                className="m-1 w-[calc(100%-0.5rem)] rounded border border-primary px-2 py-1 text-[13px] outline-none"
              />
            ) : (
              <button
                onClick={() => { setCapture(id); setDraft(""); }}
                className="w-full px-2 py-2 text-left text-[12px] text-primary hover:bg-surface"
              >
                + New {t.childTypeOf(id)}
              </button>
            )}
          </li>
        )}
      </ul>
    </div>
  );

  // ── Split: Miller columns — the path, side by side ────────────────────
  if (!compact) {
    const cols: (number | null)[] = [null, ...path.map((p) => p.id)];
    const visible = cols.slice(Math.max(0, cols.length - 2));
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
          <span className="truncate text-[12px] text-faint">{focusItem ? `${t.lineage(focus!)} › ${focusItem.summary}` : "All Topics"}</span>
          <button onClick={() => setShowAll((v) => !v)} className="rounded border border-line px-2 py-1 text-[12px] hover:bg-surface">
            {showAll ? "All" : "Unfinished"}
          </button>
        </div>
        <div className="flex min-h-0 flex-1">
          {visible.map((c, n) => <Column key={`${c}-${n}`} id={c} />)}
        </div>
        {focusItem && (
          <div className="flex items-center gap-2 border-t border-line px-3 py-2">
            <button onClick={() => onOpen(focusItem.id)} className="rounded border border-line px-2 py-1 text-[12px] hover:bg-surface">Open “{focusItem.summary}”</button>
            {focusItem.type !== "Topic" && (
              <button onClick={() => onMove(focusItem.id)} className="rounded border border-line px-2 py-1 text-[12px] hover:bg-surface">Move…</button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Compact: one level at a time, full width ──────────────────────────
  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 border-b border-line bg-bg/95 px-3 py-2 backdrop-blur">
        <nav className="flex items-center gap-1 overflow-x-auto text-[12px] whitespace-nowrap text-faint">
          <button onClick={() => setFocus(null)} className={`rounded px-1 py-0.5 ${focus == null ? "font-semibold text-fg" : "hover:bg-surface"}`}>Topics</button>
          {path.map((p, n) => (
            <span key={p.id} className="flex items-center gap-1">
              <span>›</span>
              <button
                onClick={() => setFocus(p.id)}
                className={`max-w-[9rem] truncate rounded px-1 py-0.5 ${n === path.length - 1 ? "font-semibold text-fg" : "hover:bg-surface"}`}
              >
                {p.summary}
              </button>
            </span>
          ))}
        </nav>
        {focusItem && (
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={focusItem.status} />
            <Avatar name={focusItem.assignee} />
            <DueCell due={focusItem.due} />
            <span className="ml-auto flex gap-1">
              <button onClick={() => onOpen(focusItem.id)} className="touch-min rounded border border-line px-2 py-1 text-[12px]">Open</button>
              {focusItem.type !== "Topic" && (
                <button onClick={() => onMove(focusItem.id)} className="touch-min rounded border border-line px-2 py-1 text-[12px]">Move…</button>
              )}
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-faint">
            {childType ? `${listFor(focus).length} ${childType}${listFor(focus).length === 1 ? "" : "s"}` : "No children — a Subtask is the last rung"}
          </span>
          <button onClick={() => setShowAll((v) => !v)} className="touch-min rounded border border-line px-2 py-1 text-[12px]">
            {showAll ? "All" : "Unfinished"}
          </button>
        </div>
      </div>

      <ul>
        {listFor(focus).map((c) => <Row key={c.id} item={c} />)}
      </ul>

      {childType && (
        <div className="flex items-center gap-2 px-3 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={focusItem ? `New ${childType} in “${focusItem.summary}”` : "New Topic"}
            className="min-h-11 min-w-0 flex-1 rounded border border-line px-2 outline-none focus:border-primary"
          />
          <button onClick={submit} className="min-h-11 rounded bg-primary px-3 text-[13px] font-medium text-primary-fg">Add</button>
        </div>
      )}
      <p className="px-3 text-[12px] text-faint">
        Creation needs no parent picker — the parent is the screen you are on. The FAB still creates from anywhere.
      </p>
    </div>
  );
}
