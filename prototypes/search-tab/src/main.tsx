// PROTOTYPE — throwaway. Three Search tabs (#18), switchable via ?variant=A|B|C,
// mounted inside ADR-0017's shell with ADR-0018's tree, ADR-0019's detail view and
// ADR-0020's Due tab held fixed. Resize across 1024px to compare compact and split;
// the black strip's full / sparse / empty control tells "no hits" apart from "the
// corpus is empty".
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { Switcher, useNav } from "./proto";
import { Shell } from "./shell";
import { TreeProvider } from "./store";
import type { SearchVariant } from "./shell";
import SearchA from "./variants/SearchA";
import SearchB from "./variants/SearchB";
import SearchC from "./variants/SearchC";

function App() {
  const { variant } = useNav();
  const search = (variant === "B" ? SearchB : variant === "C" ? SearchC : SearchA) as SearchVariant;
  return (
    <div className="flex h-screen flex-col">
      <Switcher />
      <div className="min-h-0 flex-1 [transform:translateZ(0)]">
        <Shell key={variant} search={search} />
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
