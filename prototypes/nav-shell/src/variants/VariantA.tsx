// PROTOTYPE — Variant A: "One responsive shell".
// The integral-grc answer, ported straight: one collapsible left sidebar at every
// width, a Sheet below 768px, single pane everywhere, opening an item NAVIGATES.
import { useState } from "react";
import { byId, lineage } from "../data";
import { useNav, useViewport } from "../proto";
import { Avatar, DueTab, ItemDetail, SearchTab, SettingsTab, TreeTab } from "../screens";

const NAV = [
  { key: "due", label: "Due", icon: "◷" },
  { key: "items", label: "Work Items", icon: "☰" },
  { key: "search", label: "Search", icon: "⌕" },
] as const;

export default function VariantA() {
  const { tab, item, goTab, open, close } = useNav();
  const { band } = useViewport();
  const phone = band === "phone";
  const [collapsed, setCollapsed] = useState(false);
  const [sheet, setSheet] = useState(false);

  const railed = !phone && collapsed;
  const width = railed ? 48 : 224;

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className={`flex h-12 items-center border-b border-line ${railed ? "justify-center" : "px-3"}`}>
        <span className="text-[15px] font-semibold tracking-tight text-primary">{railed ? "D" : "DueNow"}</span>
      </div>
      <nav className="flex-1 p-1.5">
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => { goTab(n.key as never); setSheet(false); }}
            title={railed ? n.label : undefined}
            className={`touch-min mb-0.5 flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[13px] hover:bg-raised ${
              tab === n.key ? "bg-primary-soft font-medium text-primary" : "text-fg"
            } ${railed ? "justify-center px-0" : ""}`}
          >
            <span className="w-4 text-center text-[14px]">{n.icon}</span>
            {!railed && n.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-line p-1.5">
        <button
          onClick={() => { goTab("settings"); setSheet(false); }}
          title={railed ? "Settings" : undefined}
          className={`touch-min flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[13px] hover:bg-raised ${
            tab === "settings" ? "bg-primary-soft font-medium text-primary" : ""
          } ${railed ? "justify-center px-0" : ""}`}
        >
          <Avatar name="Dave" size={20} />
          {!railed && <span className="min-w-0 flex-1 truncate">Dave</span>}
          {!railed && <span className="text-faint">⚙</span>}
        </button>
      </div>
    </div>
  );

  const title = item
    ? byId.get(item)!.summary
    : { due: "Due", items: "Work Items", search: "Search", settings: "Settings" }[tab];

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-bg px-2">
        <button
          onClick={() => (phone ? setSheet(true) : setCollapsed((c) => !c))}
          className="touch-min rounded px-2 py-1 text-muted hover:bg-raised"
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        {item && (
          <button onClick={close} className="touch-min rounded px-2 py-1 text-muted hover:bg-raised" aria-label="Back">←</button>
        )}
        <div className="min-w-0 flex-1">
          {item && !phone && <p className="truncate text-[11px] text-faint">{lineage(item) || "Topics"}</p>}
          <h1 className="truncate text-[14px] font-semibold">{title}</h1>
        </div>
        <button className="touch-min rounded px-2 py-1 text-muted hover:bg-raised" title="Theme">◐</button>
      </header>

      <div className="flex min-h-0 flex-1">
        {!phone && (
          <aside style={{ width }} className="shrink-0 overflow-hidden border-r border-line bg-surface transition-[width] duration-150">
            {SidebarBody}
          </aside>
        )}
        {phone && sheet && (
          <>
            <div onClick={() => setSheet(false)} className="fixed inset-0 z-40 bg-black/30" />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-bg shadow-xl">{SidebarBody}</aside>
          </>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className={`mx-auto w-full ${tab === "search" && !item ? "" : "max-w-4xl"}`}>
            {item ? (
              <ItemDetail id={item} onOpen={open} showHeader={false} />
            ) : tab === "due" ? (
              <DueTab onOpen={open} />
            ) : tab === "items" ? (
              <TreeTab onOpen={open} />
            ) : tab === "search" ? (
              <SearchTab onOpen={open} layout={phone ? "stacked" : "table"} />
            ) : (
              <SettingsTab />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
