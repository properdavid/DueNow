// PROTOTYPE — Variant B: "Device-shaped shell".
// Three structurally different layouts sharing content components:
//   phone   — bottom tab bar, full-screen push navigation
//   tablet  — left icon rail, single pane
//   desktop — sidebar + resizable two-pane list/detail; selection swaps the pane
import { useCallback, useEffect, useRef, useState } from "react";
import { byId, lineage } from "../data";
import { useNav, useViewport } from "../proto";
import { Avatar, DueTab, ItemDetail, SearchTab, SettingsTab, TreeTab } from "../screens";

const NAV = [
  { key: "due", label: "Due", icon: "◷" },
  { key: "items", label: "Work Items", icon: "☰" },
  { key: "search", label: "Search", icon: "⌕" },
  { key: "settings", label: "Settings", icon: "⚙" },
] as const;

export default function VariantB() {
  const { band } = useViewport();
  if (band === "phone") return <Phone />;
  if (band === "tablet") return <Tablet />;
  return <Desktop />;
}

function List({ onOpen, selected, dense, search }: { onOpen: (id: number) => void; selected?: number | null; dense?: boolean; search: "table" | "stacked" }) {
  const { tab } = useNav();
  if (tab === "due") return <DueTab onOpen={onOpen} selected={selected} dense={dense} />;
  if (tab === "items") return <TreeTab onOpen={onOpen} selected={selected} dense={dense} />;
  if (tab === "search") return <SearchTab onOpen={onOpen} selected={selected} layout={search} />;
  return <SettingsTab />;
}

const titleOf = (tab: string) => ({ due: "Due", items: "Work Items", search: "Search", settings: "Settings" })[tab]!;

// ── Phone ────────────────────────────────────────────────────────────────

function Phone() {
  const { tab, item, goTab, open, close } = useNav();
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-11 shrink-0 items-center gap-1 border-b border-line px-1">
        {item && <button onClick={close} className="touch-min rounded px-2 text-muted" aria-label="Back">←</button>}
        <h1 className={`min-w-0 flex-1 truncate text-[15px] font-semibold ${item ? "" : "px-2"}`}>
          {item ? byId.get(item)!.summary : titleOf(tab)}
        </h1>
        {!item && tab === "items" && <button className="touch-min rounded px-3 text-primary">+</button>}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {item ? <ItemDetail id={item} onOpen={open} showHeader={false} /> : <List onOpen={open} search="stacked" />}
      </main>

      <nav className="flex shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => goTab(n.key as never)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] ${
              tab === n.key && !item ? "text-primary" : "text-muted"
            }`}
            style={{ minHeight: 52 }}
          >
            <span className="text-[17px] leading-none">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Tablet ───────────────────────────────────────────────────────────────

function Tablet() {
  const { tab, item, goTab, open, close } = useNav();
  return (
    <div className="flex h-full">
      <nav className="flex w-14 shrink-0 flex-col items-center gap-0.5 border-r border-line bg-surface py-2">
        <span className="mb-2 text-[15px] font-bold text-primary">D</span>
        {NAV.slice(0, 3).map((n) => (
          <button
            key={n.key}
            onClick={() => goTab(n.key as never)}
            className={`flex w-12 flex-col items-center gap-0.5 rounded py-1.5 text-[9px] ${
              tab === n.key ? "bg-primary-soft text-primary" : "text-muted hover:bg-raised"
            }`}
            style={{ minHeight: 46 }}
          >
            <span className="text-[16px] leading-none">{n.icon}</span>
            {n.label.split(" ")[0]}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => goTab("settings")} className="rounded p-2 hover:bg-raised" style={{ minHeight: 44 }}>
          <Avatar name="Dave" size={26} />
        </button>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-2">
          {item && <button onClick={close} className="touch-min rounded px-2 text-muted" aria-label="Back">←</button>}
          <div className="min-w-0 flex-1">
            {item && <p className="truncate text-[11px] text-faint">{lineage(item) || "Topics"}</p>}
            <h1 className="truncate text-[14px] font-semibold">{item ? byId.get(item)!.summary : titleOf(tab)}</h1>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className={`mx-auto w-full ${tab === "search" && !item ? "" : "max-w-3xl"}`}>
            {item ? <ItemDetail id={item} onOpen={open} showHeader={false} /> : <List onOpen={open} search="table" />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Desktop ──────────────────────────────────────────────────────────────

function Desktop() {
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

  const full = tab === "settings";

  return (
    <div className="flex h-full">
      <aside className="flex w-52 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex h-12 items-center px-3 text-[15px] font-semibold tracking-tight text-primary">DueNow</div>
        <nav className="flex-1 p-1.5">
          {NAV.slice(0, 3).map((n) => (
            <button
              key={n.key}
              onClick={() => goTab(n.key as never)}
              className={`mb-0.5 flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[13px] hover:bg-raised ${
                tab === n.key ? "bg-primary-soft font-medium text-primary" : ""
              }`}
            >
              <span className="w-4 text-center">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => goTab("settings")}
          className={`flex items-center gap-2 border-t border-line px-3 py-2 text-left text-[13px] hover:bg-raised ${
            tab === "settings" ? "text-primary" : ""
          }`}
        >
          <Avatar name="Dave" /> Dave <span className="ml-auto text-faint">⚙</span>
        </button>
      </aside>

      {full ? (
        <main className="min-w-0 flex-1 overflow-y-auto"><div className="max-w-2xl"><SettingsTab /></div></main>
      ) : (
        <>
          <section style={{ width: split }} className="flex min-w-0 shrink-0 flex-col border-r border-line">
            <header className="flex h-12 shrink-0 items-center border-b border-line px-3 text-[14px] font-semibold">{titleOf(tab)}</header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <List onOpen={open} selected={item} dense search="stacked" />
            </div>
          </section>
          <div
            onMouseDown={() => (dragging.current = true)}
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-primary/30"
          />
          <section className="flex min-w-0 flex-1 flex-col">
            {item ? (
              <>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] text-faint">{lineage(item) || "Topics"}</p>
                    <h1 className="truncate text-[14px] font-semibold">{byId.get(item)!.summary}</h1>
                  </div>
                  <button onClick={close} className="rounded px-2 text-muted hover:bg-raised" aria-label="Close">✕</button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <ItemDetail id={item} onOpen={open} showHeader={false} />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-[13px] text-faint">
                Select a work item
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
