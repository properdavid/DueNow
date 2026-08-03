// PROTOTYPE — throwaway. Variant switcher + nav state in the URL.
// #29 asks what the wordmark, the app icon and the empty-card mark are, so the black
// strip keeps #24's app-state switch — every state is a place a mark shows up — and
// gains one more, `icon sheet`, which is not a screen of the app at all: it is every
// icon size ADR-0029 ships, for all three variants at once.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Scenario } from "./due";

export const VARIANTS = [
  { key: "A", name: "Tile — the app tile is the frame; card marks describe the surface" },
  { key: "B", name: "Badge — the mark has an edge, so it travels: lockup, sidebar, every card" },
  { key: "C", name: "Monogram — no ticks, no lockup; cards borrow the app's own marks" },
] as const;

export const STATES = [
  { key: "signed-out", label: "signed out" },
  { key: "rejected", label: "rejected" },
  { key: "first-run", label: "first run" },
  { key: "all-settled", label: "all settled" },
  { key: "clear", label: "radar clear" },
  { key: "full", label: "populated" },
  { key: "icons", label: "icon sheet" },
] as const;

export type AppState = (typeof STATES)[number]["key"];
export type Tab = "due" | "items" | "search" | "settings";

export function useNav() {
  const [params, setParams] = useSearchParams();
  const variant = (params.get("variant") ?? "A").toUpperCase();
  const state = (params.get("state") ?? "icons") as AppState;
  const tab = (params.get("tab") ?? "due") as Tab;
  const itemParam = params.get("item");
  const item = itemParam ? Number(itemParam) : null;

  const set = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v === null ? p.delete(k) : p.set(k, v)));
    setParams(p, { replace: false });
  };

  return {
    variant,
    state,
    tab,
    item,
    // The corpus itself carries emptiness now, so Search's own scenario is always "full".
    scenario: "full" as Scenario,
    setState: (s: AppState) => set({ state: s, item: null }),
    goTab: (t: Tab) => set({ tab: t, item: null }),
    open: (id: number) => set({ item: String(id) }),
    close: () => set({ item: null }),
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

function StateSwitch() {
  const { state, setState } = useNav();
  return (
    <span className="flex items-center gap-px">
      {STATES.map((s) => (
        <button
          key={s.key}
          onClick={() => setState(s.key)}
          className={`rounded-full px-2 py-px text-[11px] whitespace-nowrap ${
            state === s.key ? "bg-white text-fg" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          {s.label}
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
        <span className="hidden truncate xl:inline">{VARIANTS[idx].name}</span>
        <span className="rounded-full bg-white/20 px-2 py-px text-[11px] tabular-nums">
          {compact ? "compact" : "split"} · {w}px
        </span>
        <StateSwitch />
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
