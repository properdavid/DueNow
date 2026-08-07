/* PROTOTYPE — throwaway. Swaps how the six semantic button variants resolve to
   classes, so the palette can be judged on real screens before it is committed.
   Delete this file and inline the winning table into button.tsx. */
import { createContext, useContext } from "react";
import * as React from "react";
import { useSearchParams } from "react-router";

export type ButtonScheme = "A" | "B" | "C";

export const buttonSchemeNames: Record<ButtonScheme, string> = {
  A: "Baseline — today's colours",
  B: "Full scheme — effect states colour",
  C: "Muted write — tinted fill instead of solid",
};

/* Each scheme answers the six buckets settled in the grilling session:
   write / open / destroy / discard / neutral / bare. */
export const buttonSchemes: Record<ButtonScheme, Record<string, string>> = {
  A: {
    write: "bg-primary text-primary-foreground",
    open: "border border-input bg-card text-foreground",
    destroy: "bg-destructive text-destructive-foreground",
    discard: "border border-destructive bg-card text-destructive",
    neutral: "border border-input bg-card text-foreground",
    bare: "border border-transparent text-foreground",
    inline: "border border-transparent text-foreground",
  },
  B: {
    write: "bg-primary text-primary-foreground",
    open: "border border-primary bg-card text-primary",
    destroy: "bg-destructive text-destructive-foreground",
    discard: "border border-destructive bg-card text-destructive",
    neutral: "border border-input bg-card text-muted-foreground",
    bare: "border border-transparent text-muted-foreground",
    inline: "border border-transparent text-foreground",
  },
  C: {
    write: "border border-primary bg-accent text-accent-foreground",
    open: "border border-primary bg-card text-primary",
    destroy: "bg-destructive text-destructive-foreground",
    discard: "border border-destructive bg-card text-destructive",
    neutral: "border border-input bg-card text-muted-foreground",
    bare: "border border-transparent text-muted-foreground",
    inline: "border border-transparent text-foreground",
  },
};

const ButtonSchemeContext = createContext<ButtonScheme>("A");

export function useButtonScheme() {
  return useContext(ButtonSchemeContext);
}

export function ButtonSchemeProvider({ children }: { children: React.ReactNode }) {
  const [params] = useSearchParams();
  const requested = params.get("proto");
  const scheme: ButtonScheme = requested === "B" || requested === "C" ? requested : "A";
  return <ButtonSchemeContext.Provider value={scheme}>{children}</ButtonSchemeContext.Provider>;
}

const order: ButtonScheme[] = ["A", "B", "C"];

export function ButtonSchemeSwitcher() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("proto");
  const scheme: ButtonScheme = requested === "B" || requested === "C" ? requested : "A";

  const step = React.useCallback(
    (delta: number) => {
      const next = order[(order.indexOf(scheme) + delta + order.length) % order.length];
      const nextParams = new URLSearchParams(params);
      nextParams.set("proto", next);
      setParams(nextParams, { replace: true, preventScrollReset: true });
    },
    [params, scheme, setParams],
  );

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [step]);

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-2 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full border-2 border-foreground bg-background px-4 py-2 text-xs font-medium shadow-lg">
      <button type="button" aria-label="Previous scheme" onClick={() => step(-1)}>←</button>
      <span>{scheme} — {buttonSchemeNames[scheme]}</span>
      <button type="button" aria-label="Next scheme" onClick={() => step(1)}>→</button>
    </div>
  );
}
