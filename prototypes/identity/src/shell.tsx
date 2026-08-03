// PROTOTYPE — throwaway. ADR-0017's shell, ADR-0018's tree, ADR-0019's detail view and
// ADR-0020's Due tab, all held fixed across the three variants: compact below 1024
// (capsule + FAB + full-screen push), split at or above (sidebar + resizable
// list/detail). Only the *Search tab* swaps — it owns its whole pane, its own header,
// its own filter surface and its own sort control, because all three are #18's
// question. A Search variant may also declare `fullPane`, in which case it overrides
// the split on desktop and takes the whole width, with the detail view arriving as a
// push — the table variant needs seven columns and the 480px list column cannot pay
// for them, and whether that override is acceptable is part of what is being judged.
import { useCallback, useEffect, useRef, useState } from "react";
import { useIdentity } from "./identity";
import { dueRows, useMine } from "./due";
import type { EmptyPack } from "./empty";
import { useNav, useViewport } from "./proto";
import { Avatar, CreateDialog, MoveDialog, SettingsTab } from "./screens";
import Detail from "./variants/DetailA";
import Due from "./variants/DueFixed";
import Tree from "./variants/TreeA";
import { useTree } from "./store";

const TABS = [
  { key: "due", label: "Due", icon: "◷" },
  { key: "items", label: "Work Items", icon: "☰" },
  { key: "search", label: "Search", icon: "⌕" },
  { key: "settings", label: "Settings", icon: "⚙" },
] as const;

export type TreeProps = {
  empty: EmptyPack;
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

export type DueProps = {
  empty: EmptyPack;
  onOpen: (id: number) => void;
  selected: number | null;
  compact: boolean;
  requestCreate: () => void;
};

export type SearchProps = Omit<DueProps, "empty" | "requestCreate">;

export type SearchVariant = ((p: SearchProps) => React.ReactNode) & { fullPane?: boolean };

export function Shell({ search, empty }: { search: SearchVariant; empty: EmptyPack }) {
  const { compact } = useViewport();
  const identity = useIdentity();
  const { tab, item, goTab, open, close, scenario } = useNav();
  const t = useTree();
  const { mineOnly } = useMine();
  const [creating, setCreating] = useState<{ parent: number | null } | null>(null);
  const [moving, setMoving] = useState<number | null>(null);
  const [split, setSplit] = useState(620);
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
    empty,
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
      {tab === "due" && <Due empty={empty} onOpen={open} selected={item} compact={compact} requestCreate={() => setCreating({ parent: null })} />}
      {tab === "search" && search({ onOpen: open, selected: item, compact })}
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
          <main className="h-full overflow-hidden">{Detail(detailProps)}</main>
        ) : (
          <main className={`h-full pb-28 ${tab === "search" ? "overflow-hidden" : "overflow-y-auto"}`}>{body}</main>
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
        {identity.SidebarLockup()}
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
      ) : tab === "search" && search.fullPane ? (
        // The table variant takes the width: no split, and a work item pushes over the
        // results with a way back, exactly as it does on a phone.
        <section className="flex min-w-0 flex-1 flex-col">
          {item ? (
            <>
              <button
                onClick={close}
                className="flex shrink-0 items-center gap-1.5 border-b border-line bg-surface px-4 py-1.5 text-left text-[12px] text-primary"
              >
                ← Back to results
              </button>
              <div className="min-h-0 flex-1">{Detail(detailProps)}</div>
            </>
          ) : (
            <div className="min-h-0 flex-1">{body}</div>
          )}
        </section>
      ) : (
        <>
          <section style={{ width: split }} className="flex min-w-0 shrink-0 flex-col border-r border-line">
            <div className={`min-h-0 flex-1 ${tab === "search" ? "overflow-hidden" : "overflow-y-auto"}`}>{body}</div>
          </section>
          <div onMouseDown={() => (dragging.current = true)} className="w-1 shrink-0 cursor-col-resize hover:bg-primary/30" />
          <section className="flex min-w-0 flex-1 flex-col">
            {item ? (
              Detail(detailProps)
            ) : (
              <div className="min-h-0 flex-1">
                <empty.Unselected
                  rows={dueRows(t, mineOnly, scenario)}
                  firstRun={t.items.length === 0}
                  onOpen={open}
                  onCreate={() => setCreating({ parent: null })}
                />
              </div>
            )}
          </section>
        </>
      )}
      {dialogs}
    </div>
  );
}
