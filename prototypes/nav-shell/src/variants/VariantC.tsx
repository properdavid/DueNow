// PROTOTYPE — Variant C: "Chromeless / command-first".
// Bets that four destinations don't deserve permanent chrome: one thin top bar,
// a segmented control for the two real surfaces, Search as a ⌘K palette, Settings
// behind the avatar, and detail as an overlay drawer at every width.
import { useEffect, useRef, useState } from "react";
import { ITEMS, byId, formatDue, lineage } from "../data";
import { useNav, useViewport } from "../proto";
import { Avatar, DueTab, ItemDetail, SettingsTab, StatusBadge, TreeTab } from "../screens";

export default function VariantC() {
  const { tab, item, goTab, open, close } = useNav();
  const { band } = useViewport();
  const phone = band === "phone";
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(true); }
      if (e.key === "Escape") { setPalette(false); setMenu(false); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const main = tab === "items" ? "items" : "due";

  return (
    <div className="flex h-full flex-col">
      <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
        <span className="text-[15px] font-semibold tracking-tight text-primary">{phone ? "DN" : "DueNow"}</span>

        <div className="mx-auto flex overflow-hidden rounded-md border border-line">
          {(["due", "items"] as const).map((t) => (
            <button
              key={t}
              onClick={() => goTab(t)}
              className={`touch-min px-3 py-1 text-[13px] ${main === t ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface"}`}
            >
              {t === "due" ? "Due" : "Work Items"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPalette(true)}
          className="touch-min flex items-center gap-2 rounded border border-line px-2 py-1 text-[12px] text-faint hover:bg-surface"
        >
          ⌕ {!phone && <span>Search</span>}
          {!phone && <kbd className="rounded bg-raised px-1 text-[10px]">⌘K</kbd>}
        </button>
        <button onClick={() => setMenu((m) => !m)} className="touch-min rounded px-1 py-1 hover:bg-surface">
          <Avatar name="Dave" size={24} />
        </button>

        {menu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
            <div className="absolute top-11 right-2 z-40 w-48 overflow-hidden rounded-md border border-line bg-bg shadow-lg">
              <p className="border-b border-line px-3 py-2 text-[11px] text-faint">dave@example.com</p>
              <button
                onClick={() => { goTab("settings"); setMenu(false); }}
                className="touch-min flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-surface"
              >
                ⚙ Settings
              </button>
              <button className="touch-min flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-surface">◐ Theme</button>
              <button className="touch-min flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-[13px] hover:bg-surface">Sign out</button>
            </div>
          </>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl">
          {main === "due" ? <DueTab onOpen={open} selected={item} /> : <TreeTab onOpen={open} selected={item} />}
        </div>
      </main>

      {/* New work item — the only persistent action */}
      <button
        className="fixed right-4 bottom-20 z-20 h-12 w-12 rounded-full bg-primary text-[20px] text-primary-fg shadow-lg"
        aria-label="New work item"
      >
        +
      </button>

      {palette && <Palette onPick={(id) => { setPalette(false); open(id); }} onClose={() => setPalette(false)} />}

      <Drawer open={item != null || tab === "settings"} phone={phone} onClose={close}>
        {tab === "settings" ? (
          <>
            <header className="flex h-12 items-center justify-between border-b border-line px-4">
              <h1 className="text-[14px] font-semibold">Settings</h1>
              <button onClick={() => goTab("due")} className="touch-min rounded px-2 text-muted hover:bg-surface">✕</button>
            </header>
            <SettingsTab />
          </>
        ) : item != null ? (
          <ItemDetail id={item} onOpen={open} onClose={close} />
        ) : null}
      </Drawer>
    </div>
  );
}

function Drawer({ open, phone, onClose, children }: { open: boolean; phone: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/25" />
      <aside
        className={
          phone
            ? "fixed inset-x-0 bottom-0 z-50 h-[88vh] overflow-y-auto rounded-t-xl border-t border-line bg-bg shadow-2xl"
            : "fixed inset-y-0 right-0 z-50 w-[520px] overflow-y-auto border-l border-line bg-bg shadow-2xl"
        }
      >
        {phone && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line" />}
        {children}
      </aside>
    </>
  );
}

function Palette({ onPick, onClose }: { onPick: (id: number) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const rows = ITEMS.filter((i) => i.summary.toLowerCase().includes(q.toLowerCase())).slice(0, 14);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] bg-black/30" />
      <div className="fixed top-[12vh] left-1/2 z-[70] w-[min(620px,92vw)] -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-bg shadow-2xl">
        <input
          ref={ref}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search work items…"
          className="w-full border-b border-line px-4 py-3 text-[15px] outline-none"
        />
        <div className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2">
          {["Type", "Status", "Assignee", "Due", "Labels"].map((f) => (
            <button key={f} className="rounded border border-line px-2 py-0.5 text-[12px] text-muted hover:bg-surface">{f} ▾</button>
          ))}
        </div>
        <ul className="max-h-[52vh] overflow-y-auto">
          {rows.map((i) => (
            <li key={i.id}>
              <button onClick={() => onPick(i.id)} className="touch-min flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-surface">
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{i.summary}</span>
                  <span className="block truncate text-[11px] text-faint">{lineage(i.id) || i.type}</span>
                </span>
                <StatusBadge status={i.status} />
                <Avatar name={i.assignee} />
                <span className="w-16 shrink-0 text-right text-[12px] text-muted">{formatDue(i.due)}</span>
              </button>
            </li>
          ))}
          {rows.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-faint">No matches.</li>}
        </ul>
        <p className="border-t border-line px-4 py-1.5 text-[11px] text-faint">
          {rows.length} shown · ↑↓ to move · ↵ to open · esc to close
        </p>
      </div>
    </>
  );
}

export const _unused = byId;
