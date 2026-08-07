import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { FilterMenu } from "./filter-menu";

/* Dismissal is driven by document-level events and there is no DOM environment
   here, so the wiring is held where it is written. The behaviour itself is
   proven in a real browser at a wide viewport. */
const source = readFileSync(new URL("./filter-menu.tsx", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("../../routes/search.tsx", import.meta.url), "utf8");

describe("a Filter Bar menu", () => {
  test("renders its label as the summary and its content in the panel", () => {
    const markup = renderToStaticMarkup(
      <FilterMenu active={false} label="Type: Any">
        <span>Topic</span>
      </FilterMenu>,
    );

    expect(markup).toContain("<details");
    expect(markup).toContain("Type: Any");
    expect(markup).toContain("Topic");
  });

  test("marks itself as active so a narrowed filter is legible in the bar", () => {
    const inactive = renderToStaticMarkup(<FilterMenu active={false} label="Type: Any">x</FilterMenu>);
    const active = renderToStaticMarkup(<FilterMenu active label="Type: Task">x</FilterMenu>);

    expect(inactive).toContain("border-input");
    expect(active).toContain("border-primary");
  });
});

describe("dismissing a Filter Bar menu", () => {
  test("closes on a press outside itself, so another filter or a result dismisses it", () => {
    expect(source).toContain('addEventListener("pointerdown"');
    expect(source).toContain("!details.contains(event.target)");
  });

  test("closes on Escape and returns focus to the summary", () => {
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('querySelector("summary")?.focus()');
  });

  test("stops listening when unmounted", () => {
    expect(source).toContain('removeEventListener("pointerdown"');
    expect(source).toContain('removeEventListener("keydown"');
  });

  test("is the only way the Search tab builds a filter menu, at every width", () => {
    expect(routeSource).not.toContain("<details");
    expect(routeSource).toContain("<FilterMenu");
    // ADR-0033: one bar, so no compact sheet and nothing to apply.
    expect(routeSource).not.toContain("<Dialog");
  });
});
