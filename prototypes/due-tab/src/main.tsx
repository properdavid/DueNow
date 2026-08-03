// PROTOTYPE — throwaway. Three Due tabs (#17), switchable via ?variant=A|B|C,
// mounted inside ADR-0017's shell with ADR-0018's tree and ADR-0019's detail view
// held fixed. Resize across 1024px to compare compact and split; the black strip's
// full / sparse / empty control shows the empty-group and empty-tab cases.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { Switcher, useNav } from "./proto";
import { Shell } from "./shell";
import { TreeProvider } from "./store";
import DueA from "./variants/DueA";
import DueB from "./variants/DueB";
import DueC from "./variants/DueC";

function App() {
  const { variant } = useNav();
  const due = variant === "B" ? DueB : variant === "C" ? DueC : DueA;
  return (
    <div className="flex h-screen flex-col">
      <Switcher />
      <div className="min-h-0 flex-1 [transform:translateZ(0)]">
        <Shell key={variant} due={(p) => due(p)} />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TreeProvider>
        <App />
      </TreeProvider>
    </BrowserRouter>
  </StrictMode>,
);
