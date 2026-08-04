import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { SplitRoute } from "~/components/shell/split-route";
import {
  LIST_COLUMN_CEILING_PX,
  LIST_COLUMN_DEFAULT_PX,
  LIST_COLUMN_FLOOR_PX,
} from "~/components/work-items/tree-geometry";

describe("split route layout seam", () => {
  test("without a selected work item the right column shows the Nothing selected card", () => {
    const Stub = createRoutesStub([
      {
        path: "/items",
        Component: () => <SplitRoute hasSelection={false}>Work Items Tree placeholder</SplitRoute>,
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/items"]} />);

    expect(markup).toContain("Work Items Tree placeholder");
    expect(markup).toContain("Nothing selected");
    expect(markup).toContain("Pick a work item on the left and it opens here, beside the list.");
  });

  test("with a selected work item compact layout hides the list and renders the outlet as a push", () => {
    const Stub = createRoutesStub([
      {
        path: "/items",
        Component: () => <SplitRoute hasSelection>Work Items Tree placeholder</SplitRoute>,
        children: [{ path: ":id", Component: () => <article>Detail View placeholder</article> }],
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/items/12"]} />);

    expect(markup).toContain("hidden @container pb-28 lg:block");
    expect(markup).toContain("Work Items Tree placeholder");
    expect(markup).toContain("Detail View placeholder");
    expect(markup).not.toContain("Nothing selected");
  });

  test("the shared border carries a splitter over the range the tree can survive", () => {
    const Stub = createRoutesStub([
      {
        path: "/items",
        Component: () => <SplitRoute hasSelection={false}>Work Items Tree placeholder</SplitRoute>,
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/items"]} />);

    // The affordance is on the border a person reaches for, not a corner grip.
    expect(markup).not.toContain("resize-x");
    expect(markup).toContain('role="separator"');
    expect(markup).toContain('aria-orientation="vertical"');
    expect(markup).toContain('aria-controls="list-column"');
    expect(markup).toContain(`aria-valuemin="${LIST_COLUMN_FLOOR_PX}"`);
    expect(markup).toContain(`aria-valuemax="${LIST_COLUMN_CEILING_PX}"`);
    expect(markup).toContain(`aria-valuenow="${LIST_COLUMN_DEFAULT_PX}"`);
    expect(markup).toContain(`--list-column-width:${LIST_COLUMN_DEFAULT_PX}px`);
  });
});
