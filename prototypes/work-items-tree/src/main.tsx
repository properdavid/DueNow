// PROTOTYPE — throwaway. Three Work Items trees (#11), switchable via ?variant=A|B|C,
// mounted inside ADR-0017's shell. Resize across 1024px to compare compact and split.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { Switcher, useNav } from "./proto";
import { Shell } from "./shell";
import { TreeProvider } from "./store";
import TreeA from "./variants/TreeA";
import TreeB from "./variants/TreeB";
import TreeC from "./variants/TreeC";

function App() {
  const { variant } = useNav();
  const tree = variant === "B" ? TreeB : variant === "C" ? TreeC : TreeA;
  return (
    <div className="flex h-screen flex-col">
      <Switcher />
      <div className="min-h-0 flex-1 [transform:translateZ(0)]">
        <Shell key={variant} tree={(p) => tree(p)} />
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
