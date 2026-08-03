// PROTOTYPE — Variant D: "B revised".
// B's device-shaped layouts, with the round of feedback applied:
//   - floating capsule tab bar (Supportive's pattern) instead of an edge-to-edge bar
//   - Settings leaves the tab bar and lives behind the avatar
//   - one FAB is the universal create — including Topics; "+ New Topic" is gone
//   - the title header goes: the shell already says which tab you're in
//   - desktop keeps the resizable list + detail split
import { useCallback, useEffect, useRef, useState } from "react";
import { byId, children, lineage } from "../data";
import { useNav, useViewport } from "../proto";
import { Avatar, DueTab, ItemDetail, SearchTab, SettingsTab, TreeTab } from "../screens";

const TABS = [
  { key: "due", label: "Due", short: "Due", icon: "◷" },
  { key: "items", label: "Work Items", short: "Items", icon: "☰" },
  { key: "search", label: "Search", short: "Search", icon: "⌕" },
  { key: "settings", label: "Settings", short: "Settings", icon: "⚙" },
] as const;

export default function VariantD() {
  const { band } = useViewport();
  const [creating, setCreating] = useState(false);
  const shared = { creating, setCreating };
  // Two layouts, one breakpoint: compact below 1024, split at or above it.
  // An iPad in portrait is a phone with more breathing room; rotate for the split.
  return band === "desktop" ? <Desktop {...shared} /> : <Compact {...shared} />;
}

type Shared = { creating: boolean; setCreating: (v: boolean) => void };

function Body({ onOpen, selected, dense, search, trailing }: {
  onOpen: (id: number) => void; selected?: number | null; dense?: boolean;
  search: "table" | "stacked"; trailing?: React.ReactNode;
}) {
  const { tab } = useNav();
  if (tab === "items") return <TreeTab onOpen={onOpen} selected={selected} dense={dense} hideNewTopic trailing={trailing} />;
  if (tab === "search") return <SearchTab onOpen={onOpen} selected={selected} layout={search} trailing={trailing} />;
  if (tab === "settings") return <SettingsTab />;
  return <DueTab onOpen={onOpen} selected={selected} dense={dense} trailing={trailing} />;
}

// ── The floating capsule ─────────────────────────────────────────────────

function Capsule() {
  const { tab, goTab } = useNav();
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(env(safe-area-inset-bottom),14px)]">
      <nav className="pointer-events-auto flex w-[min(420px,calc(100%-24px))] items-center gap-1 rounded-[20px] border border-line bg-bg px-2 py-1.5 shadow-lg shadow-black/10">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => goTab(t.key as never)}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] px-3 py-1 transition-colors ${
                active ? "bg-primary text-primary-fg" : "text-muted hover:bg-raised"
              }`}
            >
              <span className="text-[17px] leading-none">{t.icon}</span>
              <span className={`text-[11px] leading-tight whitespace-nowrap ${active ? "font-semibold" : "font-medium"}`}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Fab({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label="New work item"
      className={`absolute right-4 bottom-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[24px] leading-none text-primary-fg shadow-lg shadow-black/20 ${className}`}
    >
      +
    </button>
  );
}

// ── Create sheet — the FAB's target, and the only route to a new Topic ────

function CreateSheet({ onClose, phone }: { onClose: () => void; phone: boolean }) {
  const [parent, setParent] = useState<number | "">("");
  const parentItem = parent === "" ? null : byId.get(Number(parent))!;
  const type = !parentItem
    ? "Topic"
    : ({ Topic: "Project", Project: "Task", Task: "Subtask", Subtask: "—" } as const)[parentItem.type];

  const candidates = [...byId.values()].filter((i) => i.type !== "Subtask");

  return (
    <>
      <div onClick={onClose} className="absolute inset-0 z-40 bg-black/25" />
      <div
        className={
          phone
            ? "absolute inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-line bg-bg p-4 shadow-2xl"
            : "absolute top-1/2 left-1/2 z-50 w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-bg p-4 shadow-2xl"
        }
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">New {type}</h2>
          <button onClick={onClose} className="rounded px-2 text-muted hover:bg-surface">✕</button>
        </div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-faint">Summary</label>
        <input autoFocus placeholder="What needs doing?" className="mb-3 w-full rounded border border-line px-2 py-2 outline-none focus:border-primary" />
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-faint">Under</label>
        <select
          value={parent}
          onChange={(e) => setParent(e.target.value === "" ? "" : Number(e.target.value))}
          className="min-h-11 w-full rounded border border-line px-2 py-1.5"
        >
          <option value="">Nothing — this is a new Topic</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {"— ".repeat(c.type === "Topic" ? 0 : c.type === "Project" ? 1 : 2)}{c.summary} ({c.type})
            </option>
          ))}
        </select>
        <p className="mt-2 text-[12px] text-faint">
          The parent decides the type. No parent means a Topic — so one button creates every rung.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="min-h-11 rounded border border-line px-3 text-[13px]">Cancel</button>
          <button onClick={onClose} className="min-h-11 rounded bg-primary px-3 text-[13px] font-medium text-primary-fg">Create</button>
        </div>
      </div>
    </>
  );
}

// ── Compact — phone and tablet, uncapped ─────────────────────────────────

function Compact({ creating, setCreating }: Shared) {
  const { tab, item, open, close } = useNav();

  return (
    <div className="relative h-full overflow-hidden">
      <main className="h-full overflow-y-auto pb-28">
        {item ? (
          <>
            <div className="sticky top-0 z-20 flex items-center gap-1 border-b border-line bg-bg/95 px-1 py-1 backdrop-blur">
              <button onClick={close} className="min-h-11 rounded px-2 text-muted" aria-label="Back">←</button>
              <p className="min-w-0 flex-1 truncate text-[11px] text-faint">{lineage(item) || "Topics"}</p>
            </div>
            <ItemDetail id={item} onOpen={open} />
          </>
        ) : (
          <Body onOpen={open} search="stacked" />
        )}
      </main>

      {!item && tab !== "settings" && <Fab onClick={() => setCreating(true)} className="bottom-24" />}
      <Capsule />
      {creating && <CreateSheet phone onClose={() => setCreating(false)} />}
    </div>
  );
}

// ── Desktop ──────────────────────────────────────────────────────────────

function Desktop({ creating, setCreating }: Shared) {
  const { tab, item, goTab, open, close } = useNav();
  const [split, setSplit] = useState(460);
  const dragging = useRef(false);

  const onMove = useCallback((e: MouseEvent) => {
    if (dragging.current) setSplit(Math.min(Math.max(e.clientX - 208, 320), 900));
  }, []);
  useEffect(() => {
    const up = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", up); };
  }, [onMove]);

  return (
    <div className="relative flex h-full overflow-hidden">
      <aside className="flex w-52 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex h-12 items-center px-3 text-[15px] font-semibold tracking-tight text-primary">DueNow</div>
        <div className="px-2 pb-2">
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-[13px] font-medium text-primary-fg shadow-sm"
          >
            <span className="text-[16px] leading-none">+</span> New work item
          </button>
        </div>
        <nav className="flex-1 p-1.5">
          {TABS.filter((t) => t.key !== "settings").map((t) => (
            <button
              key={t.key}
              onClick={() => goTab(t.key as never)}
              className={`mb-0.5 flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[13px] hover:bg-raised ${
                tab === t.key ? "bg-primary-soft font-medium text-primary" : ""
              }`}
            >
              <span className="w-4 text-center">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => goTab("settings")}
          className={`flex items-center gap-2 border-t border-line px-3 py-2 text-left text-[13px] hover:bg-raised ${
            tab === "settings" ? "bg-primary-soft font-medium text-primary" : ""
          }`}
        >
          <Avatar name="Dave" /> Dave <span className="ml-auto text-faint">⚙</span>
        </button>
      </aside>

      {tab === "settings" ? (
        <section className="min-w-0 flex-1 overflow-y-auto">
          <div className="max-w-2xl"><SettingsTab /></div>
        </section>
      ) : (
      <>
      <section style={{ width: split }} className="flex min-w-0 shrink-0 flex-col border-r border-line">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Body onOpen={open} selected={item} dense search="stacked" />
        </div>
      </section>
      <div onMouseDown={() => (dragging.current = true)} className="w-1 shrink-0 cursor-col-resize hover:bg-primary/30" />
      <section className="flex min-w-0 flex-1 flex-col">
        {item ? (
          <>
            <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] text-faint">{lineage(item) || "Topics"}</p>
                <h1 className="truncate text-[14px] font-semibold">{byId.get(item)!.summary}</h1>
              </div>
              <span className="text-[11px] text-faint">{children(item).length} children</span>
              <button onClick={close} className="rounded px-2 text-muted hover:bg-raised" aria-label="Close">✕</button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ItemDetail id={item} onOpen={open} showHeader={false} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[13px] text-faint">Select a work item</div>
        )}
      </section>
      </>
      )}

      {creating && <CreateSheet phone={false} onClose={() => setCreating(false)} />}
    </div>
  );
}
