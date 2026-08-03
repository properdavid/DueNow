// PROTOTYPE — throwaway. ADR-0017's shell and ADR-0018's tree, both held fixed across
// all three variants: compact below 1024 (capsule + FAB + full-screen push), split at
// or above (sidebar + resizable list/detail). Only the *detail view* swaps — it owns
// its whole pane, header and back/close affordance included, because how a detail view
// announces where you are is part of #12's question.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNav, useViewport } from "./proto";
import { Avatar, CreateDialog, DueTab, MoveDialog, SearchTab, SettingsTab } from "./screens";
import Tree from "./variants/TreeA";

const TABS = [
  { key: "due", label: "Due", icon: "◷" },
  { key: "items", label: "Work Items", icon: "☰" },
  { key: "search", label: "Search", icon: "⌕" },
  { key: "settings", label: "Settings", icon: "⚙" },
] as const;

export type TreeProps = {
  onOpen: (id: number) => void;
  selected: number | null;
  compact: boolean;
  onMove: (id: number) => void;
  requestCreate: (parentId: number | null) => void;
};

export type DetailProps = {
  id: number;
  compact: boolean;
  onOpen: (id: number) => void;
  onClose: () => void;
  onMove: (id: number) => void;
  requestCreate: (parentId: number | null) => void;
};

export function Shell({ detail }: { detail: (p: DetailProps) => React.ReactNode }) {
  const { compact } = useViewport();
  const { tab, item, goTab, open, close } = useNav();
  const [creating, setCreating] = useState<{ parent: number | null } | null>(null);
  const [moving, setMoving] = useState<number | null>(null);
  const [split, setSplit] = useState(480);
  const dragging = useRef(false);

  const onMove = useCallback((e: MouseEvent) => {
    if (dragging.current) setSplit(Math.min(Math.max(e.clientX - 208, 340), 900));
  }, []);
  useEffect(() => {
    const up = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", up); };
  }, [onMove]);

  const treeProps: TreeProps = {
    onOpen: open,
    selected: item,
    compact,
    onMove: (id) => setMoving(id),
    requestCreate: (parent) => setCreating({ parent }),
  };

  const detailProps: DetailProps = {
    id: item ?? 0,
    compact,
    onOpen: open,
    onClose: close,
    onMove: (id) => setMoving(id),
    requestCreate: (parent) => setCreating({ parent }),
  };

  const body = (
    <>
      {tab === "items" && <Tree {...treeProps} />}
      {tab === "due" && <DueTab onOpen={open} />}
      {tab === "search" && <SearchTab onOpen={open} />}
      {tab === "settings" && <SettingsTab />}
    </>
  );

  const dialogs = (
    <>
      {creating && <CreateDialog phone={compact} initialParent={creating.parent} onClose={() => setCreating(null)} />}
      {moving != null && <MoveDialog id={moving} phone={compact} onClose={() => setMoving(null)} />}
    </>
  );

  if (compact) {
    return (
      <div className="relative h-full overflow-hidden">
        {item ? (
          <main className="h-full overflow-hidden">{detail(detailProps)}</main>
        ) : (
          <main className="h-full overflow-y-auto pb-28">{body}</main>
        )}

        {!item && tab !== "settings" && (
          <button
            onClick={() => setCreating({ parent: null })}
            aria-label="New work item"
            className="absolute right-4 bottom-24 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[24px] leading-none text-primary-fg shadow-lg shadow-black/20"
          >
            +
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(env(safe-area-inset-bottom),14px)]">
          <nav className="pointer-events-auto flex w-[min(420px,calc(100%-24px))] items-center gap-1 rounded-[20px] border border-line bg-bg px-2 py-1.5 shadow-lg shadow-black/10">
            {TABS.map((tb) => {
              const active = tab === tb.key;
              return (
                <button
                  key={tb.key}
                  onClick={() => goTab(tb.key as never)}
                  className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] px-3 py-1 ${
                    active ? "bg-primary text-primary-fg" : "text-muted hover:bg-raised"
                  }`}
                >
                  <span className="text-[17px] leading-none">{tb.icon}</span>
                  <span className={`text-[11px] leading-tight whitespace-nowrap ${active ? "font-semibold" : "font-medium"}`}>{tb.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        {dialogs}
      </div>
    );
  }

  return (
    <div className="relative flex h-full overflow-hidden">
      <aside className="flex w-52 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex h-12 items-center px-3 text-[15px] font-semibold tracking-tight text-primary">DueNow</div>
        <div className="px-2 pb-2">
          <button
            onClick={() => setCreating({ parent: null })}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-[13px] font-medium text-primary-fg shadow-sm"
          >
            <span className="text-[16px] leading-none">+</span> New work item
          </button>
        </div>
        <nav className="flex-1 p-1.5">
          {TABS.filter((tb) => tb.key !== "settings").map((tb) => (
            <button
              key={tb.key}
              onClick={() => goTab(tb.key as never)}
              className={`mb-0.5 flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[13px] hover:bg-raised ${
                tab === tb.key ? "bg-primary-soft font-medium text-primary" : ""
              }`}
            >
              <span className="w-4 text-center">{tb.icon}</span>{tb.label}
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
        <section className="min-w-0 flex-1 overflow-y-auto"><SettingsTab /></section>
      ) : (
        <>
          <section style={{ width: split }} className="flex min-w-0 shrink-0 flex-col border-r border-line">
            <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
          </section>
          <div onMouseDown={() => (dragging.current = true)} className="w-1 shrink-0 cursor-col-resize hover:bg-primary/30" />
          <section className="flex min-w-0 flex-1 flex-col">
            {item ? (
              detail(detailProps)
            ) : (
              <div className="flex flex-1 items-center justify-center text-[13px] text-faint">Select a work item</div>
            )}
          </section>
        </>
      )}
      {dialogs}
    </div>
  );
}
