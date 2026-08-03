// PROTOTYPE — throwaway. Variant switcher + shared nav state.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const VARIANTS = [
  { key: "A", name: "One responsive shell" },
  { key: "B", name: "Device-shaped shell" },
  { key: "C", name: "Chromeless / command-first" },
  { key: "D", name: "B revised — capsule + FAB" },
] as const;

export type Tab = "due" | "items" | "search" | "settings";

export function useNav() {
  const [params, setParams] = useSearchParams();
  const variant = (params.get("variant") ?? "A").toUpperCase();
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
    tab,
    item,
    goTab: (t: Tab) => set({ tab: t, item: null }),
    open: (id: number) => set({ item: String(id) }),
    close: () => set({ item: null }),
    setVariant: (v: string) => set({ variant: v, item: null }),
  };
}

export const SCALES = [1, 1.07, 1.14, 1.21] as const;
export const SCALE_LABELS = ["14px", "15px", "16px", "17px"] as const;

/** Effective width — zooming the frame shrinks the CSS px the app actually gets. */
export function useViewport() {
  const { i } = useScale();
  const [raw, setRaw] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setRaw(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const w = Math.round(raw / SCALES[i]);
  return { w, band: w < 768 ? "phone" : w < 1024 ? "tablet" : "desktop" };
}

export function useScale() {
  const [params, setParams] = useSearchParams();
  const i = Math.min(Math.max(Number(params.get("scale") ?? 2), 0), SCALES.length - 1);
  const set = (n: number) => {
    const p = new URLSearchParams(params);
    p.set("scale", String(n));
    setParams(p, { replace: true });
  };
  return { i, set };
}

export function Switcher() {
  const { variant, setVariant } = useNav();
  const scale = useScale();
  const { w, band } = useViewport();
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
        <span className="rounded-full bg-white/20 px-2 py-px text-[11px] tabular-nums">{band} · {w}px</span>
        <span className="flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-px text-[11px]">
          base
          {SCALES.map((_, n) => (
            <button
              key={n}
              onClick={() => scale.set(n)}
              className={`rounded-full px-1.5 tabular-nums ${scale.i === n ? "bg-white text-fg font-semibold" : "hover:bg-white/20"}`}
            >
              {SCALE_LABELS[n]}
            </button>
          ))}
        </span>
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
