// PROTOTYPE — Variant C: "Sectioned checklist".
// The top two rungs stop being rows: a Topic is a sticky section, a Project is a group
// header. Only Tasks and Subtasks are list rows, so nothing is ever indented more than
// once. Every list ends in a live capture field — typing and hitting Enter creates,
// and leaves the field open for the next one. Terminal items dim and sink, never hide.
import { useState } from "react";
import type { WorkItem } from "../data";
import { Avatar, DueCell } from "../screens";
import type { TreeProps } from "../shell";
import { terminal, unfinished, useTree } from "../store";

export default function TreeC({ onOpen, selected, compact, onMove }: TreeProps) {
  const t = useTree();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [openSubs, setOpenSubs] = useState<Set<number>>(new Set());
  const [capture, setCapture] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [hideDone, setHideDone] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);

  const toggleIn = (set: Set<number>, id: number) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  };

  const sorted = (id: number) => {
    const kids = t.children(id);
    const live = kids.filter(unfinished);
    const done = hideDone ? [] : kids.filter(terminal);
    return [...live, ...done];
  };

  const submit = (parentId: number) => {
    if (draft.trim()) t.create(parentId, draft.trim());
    setDraft("");
  };

  const Check = ({ item }: { item: WorkItem }) => (
    <button
      onClick={() => t.setStatus(item.id, terminal(item) ? "Open" : "Completed")}
      aria-label={terminal(item) ? "Reopen" : "Complete"}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
        item.status === "Completed"
          ? "border-completed bg-completed text-white"
          : item.status === "Closed"
            ? "border-closed bg-closed text-white"
            : item.status === "In Progress"
              ? "border-progress text-progress"
              : "border-faint text-transparent hover:border-fg"
      }`}
    >
      {item.status === "Closed" ? "✕" : item.status === "In Progress" ? "◐" : "✓"}
    </button>
  );

  const Capture = ({ parentId, label }: { parentId: number; label: string }) =>
    capture === parentId ? (
      <div className="flex items-center gap-2 py-1 pr-3 pl-9">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit(parentId);
            if (e.key === "Escape") { setCapture(null); setDraft(""); }
          }}
          onBlur={() => { if (!draft.trim()) setCapture(null); }}
          placeholder={`${label}…  (Enter to add another, Esc to stop)`}
          className="min-h-9 min-w-0 flex-1 rounded border border-primary px-2 text-[13px] outline-none"
        />
      </div>
    ) : (
      <button
        onClick={() => { setCapture(parentId); setDraft(""); }}
        className="w-full py-1.5 pr-3 pl-9 text-left text-[13px] text-faint hover:bg-surface hover:text-primary"
      >
        + {label}
      </button>
    );

  const TaskRow = ({ item }: { item: WorkItem }) => {
    const subs = sorted(item.id);
    const showSubs = openSubs.has(item.id);
    const prog = t.progress(item.id);
    return (
      <>
        <li className="relative">
          <div className={`touch-min flex items-center gap-2 border-b border-line pr-2 pl-3 hover:bg-surface ${selected === item.id ? "bg-primary-soft" : ""}`}>
            <Check item={item} />
            <button onClick={() => onOpen(item.id)} className="min-w-0 flex-1 py-2 text-left">
              <span className={`block truncate ${terminal(item) ? "text-faint line-through" : ""}`}>{item.summary}</span>
              {(item.assignee || item.due) && (
                <span className="mt-0.5 flex items-center gap-2 text-[12px]">
                  {item.assignee && <span className="flex items-center gap-1 text-muted"><Avatar name={item.assignee} size={16} />{compact ? "" : item.assignee}</span>}
                  {item.due && <DueCell due={item.due} />}
                </span>
              )}
            </button>
            {prog.total > 0 && (
              <button
                onClick={() => setOpenSubs((s) => toggleIn(s, item.id))}
                className="shrink-0 rounded bg-raised px-1.5 py-0.5 text-[11px] text-muted tabular-nums hover:bg-line"
              >
                {prog.done}/{prog.total} {showSubs ? "▾" : "▸"}
              </button>
            )}
            <button onClick={() => setMenu(menu === item.id ? null : item.id)} className="h-6 w-6 shrink-0 rounded text-muted hover:bg-raised" aria-label="Row menu">⋯</button>
          </div>
          {menu === item.id && (
            <div className="absolute right-2 z-30 w-40 rounded border border-line bg-bg py-1 shadow-lg">
              <button onClick={() => { setMenu(null); setOpenSubs((s) => new Set(s).add(item.id)); setCapture(item.id); }} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface">Add Subtask</button>
              <button onClick={() => { setMenu(null); onMove(item.id); }} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface">Move…</button>
              <button onClick={() => { setMenu(null); t.setStatus(item.id, "Closed"); }} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface">Close (not achieved)</button>
            </div>
          )}
        </li>
        {showSubs && (
          <>
            {subs.map((s) => (
              <li key={s.id}>
                <div className={`touch-min flex items-center gap-2 border-b border-line py-1.5 pr-2 pl-9 hover:bg-surface ${selected === s.id ? "bg-primary-soft" : ""}`}>
                  <Check item={s} />
                  <button onClick={() => onOpen(s.id)} className="min-w-0 flex-1 text-left">
                    <span className={`block truncate text-[13px] ${terminal(s) ? "text-faint line-through" : ""}`}>{s.summary}</span>
                  </button>
                  {s.assignee && <Avatar name={s.assignee} size={16} />}
                  {s.due && <span className="text-[12px]"><DueCell due={s.due} /></span>}
                </div>
              </li>
            ))}
            <li className="border-b border-line"><Capture parentId={item.id} label="Add subtask" /></li>
          </>
        )}
      </>
    );
  };

  const ProjectGroup = ({ project }: { project: WorkItem }) => {
    const isCollapsed = collapsed.has(project.id);
    const prog = t.progress(project.id);
    return (
      <div className="border-b border-line last:border-b-0">
        <div className="flex items-center gap-2 bg-surface/70 px-3 py-1.5">
          <button onClick={() => setCollapsed((s) => toggleIn(s, project.id))} className="shrink-0 text-[10px] text-faint">
            {isCollapsed ? "▸" : "▾"}
          </button>
          <button onClick={() => onOpen(project.id)} className="min-w-0 flex-1 text-left">
            <span className={`truncate text-[13px] font-semibold ${terminal(project) ? "text-faint line-through" : ""}`}>{project.summary}</span>
          </button>
          {project.due && <span className="text-[12px]"><DueCell due={project.due} /></span>}
          <span className="shrink-0 text-[11px] text-faint tabular-nums">{prog.done}/{prog.total}</span>
        </div>
        {!isCollapsed && (
          <ul>
            {sorted(project.id).map((task) => <TaskRow key={task.id} item={task} />)}
            <li><Capture parentId={project.id} label="Add task" /></li>
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="pb-6" onClick={(e) => { if (!(e.target as HTMLElement).closest("[aria-label='Row menu']")) setMenu(null); }}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[12px] text-faint">{t.items.filter(unfinished).length} unfinished</span>
        <button onClick={() => setHideDone((v) => !v)} className="touch-min rounded border border-line px-2 py-1 text-[12px] hover:bg-surface">
          {hideDone ? "Settled hidden" : "Settled shown"}
        </button>
      </div>

      {t.children(null).map((topic) => (
        <section key={topic.id}>
          <div className="sticky top-0 z-10 flex items-center gap-2 border-y border-line bg-raised px-3 py-1.5 backdrop-blur">
            <button onClick={() => onOpen(topic.id)} className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold tracking-wider uppercase">
              {topic.summary}
            </button>
            <span className="text-[11px] text-faint tabular-nums">{t.progress(topic.id).done}/{t.progress(topic.id).total}</span>
            <button
              onClick={() => { setCapture(topic.id); setDraft(""); }}
              className="rounded px-1.5 text-[15px] leading-none text-primary hover:bg-surface"
              aria-label={`Add project to ${topic.summary}`}
            >
              +
            </button>
          </div>
          {capture === topic.id && (
            <div className="px-3 py-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit(topic.id);
                  if (e.key === "Escape") { setCapture(null); setDraft(""); }
                }}
                onBlur={() => { if (!draft.trim()) setCapture(null); }}
                placeholder={`New Project in ${topic.summary}…`}
                className="min-h-10 w-full rounded border border-primary px-2 text-[13px] outline-none"
              />
            </div>
          )}
          {sorted(topic.id).map((p) => <ProjectGroup key={p.id} project={p} />)}
        </section>
      ))}

      <p className="px-3 pt-4 text-[12px] text-faint">
        Checkbox = Complete, and the settle cascade runs — tick a Project's last live Task and watch the counts.
        The FAB is still the only way to make a Topic.
      </p>
    </div>
  );
}
