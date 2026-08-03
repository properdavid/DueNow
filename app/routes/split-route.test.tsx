import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { SplitRoute } from "~/components/shell/split-route";

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

    expect(markup).toContain("hidden pb-28 lg:block");
    expect(markup).toContain("lg:resize-x");
    expect(markup).toContain("Work Items Tree placeholder");
    expect(markup).toContain("Detail View placeholder");
    expect(markup).not.toContain("Nothing selected");
  });
});
