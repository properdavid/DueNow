import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * A Filter Bar dropdown. `details` gives us the open/close state and keyboard
 * activation for free but never dismisses itself, so this adds the outside-press
 * and Escape handling a menu is expected to have.
 */
export function FilterMenu({
  label,
  active,
  panelClassName,
  onOpen,
  children,
}: {
  label: React.ReactNode;
  active: boolean;
  panelClassName?: string;
  onOpen?: () => void;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDetailsElement>(null);

  React.useEffect(() => {
    const dismiss = (focusSummary: boolean) => {
      const details = ref.current;
      if (!details?.open) return;
      details.open = false;
      if (focusSummary) details.querySelector("summary")?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const details = ref.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) dismiss(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss(true);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details
      ref={ref}
      className="lg:relative"
      onToggle={(event) => {
        if (event.currentTarget.open) onOpen?.();
      }}
    >
      <summary
        className={cn(
          "list-none rounded-md border px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "border-primary bg-card text-primary",
          active ? "bg-accent text-accent-foreground" : null,
        )}
      >
        {label}
      </summary>
      {/* Below the breakpoint the panel spans its positioned ancestor rather than
          its own chip, so a chip wrapped to the right of a row cannot overflow. */}
      <div className={cn("absolute inset-x-0 z-40 mt-1 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg lg:inset-x-auto lg:left-0", panelClassName)}>
        {children}
      </div>
    </details>
  );
}
