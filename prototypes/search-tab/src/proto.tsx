// PROTOTYPE — throwaway. Variant switcher + nav state in the URL.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Scenario } from "./due";

export const VARIANTS = [
  { key: "A", name: "Table — full-pane takeover, sortable headers, Filters sheet on phone" },
  { key: "B", name: "Console — permanent facet rail with live counts, inside the split" },
  { key: "C", name: "Query bar — keyword + filter chips, identical rows at every width" },
] as const;

export type Tab = "due" | "items" | "search" | "settings";

export function useNav() {
  const [params, setParams] = useSearchParams();
  const variant = (params.get("variant") ?? "A").toUpperCase();
  const tab = (params.get("tab") ?? "search") as Tab;
  const scenario = (params.get("data") ?? "full") as Scenario;
  const itemParam = params.get("item");
  const item = itemParam ? Number(itemParam) : null;

  const set = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v === null ? p.delete(k) : p.set(k, v)));
    setParams(p, { replace: false });
  };

  return {
    variant,
    tab,
    item,
    scenario,
    setScenario: (s: Scenario) => set({ data: s === "full" ? null : s }),
    goTab: (t: Tab) => set({ tab: t, item: null }),
    open: (id: number) => set({ item: String(id) }),
    close: () => set({ item: null }),
    // The variant swap keeps the open work item — the detail view *is* what changes.
    setVariant: (v: string) => set({ variant: v }),
  };
}

/** ADR-0017: one breakpoint at 1024 — compact below, split at or above. */
export function useViewport() {
  const [raw, setRaw] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setRaw(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return { w: raw, compact: raw < 1024 };
}

function DataSwitch() {
  const { scenario, setScenario } = useNav();
  const opts: Scenario[] = ["full", "sparse", "empty"];
  return (
    <span className="flex items-center gap-px">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => setScenario(o)}
          className={`rounded-full px-2 py-px text-[11px] ${scenario === o ? "bg-white text-fg" : "bg-white/20 hover:bg-white/30"}`}
        >
          {o}
        </button>
      ))}
    </span>
  );
}

export function Switcher() {
  const { variant, setVariant } = useNav();
  const { w, compact } = useViewport();
  const idx = Math.max(0, VARIANTS.findIndex((v) => v.key === variant));

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") setVariant(VARIANTS[(idx + VARIANTS.length - 1) % VARIANTS.length].key);
      if (e.key === "ArrowRight") setVariant(VARIANTS[(idx + 1) % VARIANTS.length].key);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  return (
    <div className="flex h-8 shrink-0 items-stretch bg-fg text-bg select-none">
      <button
        onClick={() => setVariant(VARIANTS[(idx + VARIANTS.length - 1) % VARIANTS.length].key)}
        className="px-3 text-[13px] hover:bg-white/15"
        aria-label="Previous variant"
      >
        ←
      </button>
      <span className="flex min-w-0 flex-1 items-center justify-center gap-2 text-[12px] whitespace-nowrap">
        <b>{VARIANTS[idx].key}</b>
        <span className="truncate">{VARIANTS[idx].name}</span>
        <span className="rounded-full bg-white/20 px-2 py-px text-[11px] tabular-nums">
          {compact ? "compact" : "split"} · {w}px
        </span>
        <DataSwitch />
      </span>
      <button
        onClick={() => setVariant(VARIANTS[(idx + 1) % VARIANTS.length].key)}
        className="px-3 text-[13px] hover:bg-white/15"
        aria-label="Next variant"
      >
        →
      </button>
    </div>
  );
}
