// PROTOTYPE — throwaway. Three work item detail views (#12), switchable via
// ?variant=A|B|C, mounted inside ADR-0017's shell behind ADR-0018's tree.
// Resize across 1024px to compare compact and split.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { Switcher, useNav } from "./proto";
import { Shell } from "./shell";
import { TreeProvider } from "./store";
import DetailA from "./variants/DetailA";
import DetailB from "./variants/DetailB";
import DetailC from "./variants/DetailC";

function App() {
  const { variant } = useNav();
  const detail = variant === "B" ? DetailB : variant === "C" ? DetailC : DetailA;
  return (
    <div className="flex h-screen flex-col">
      <Switcher />
      <div className="min-h-0 flex-1 [transform:translateZ(0)]">
        <Shell key={variant} detail={(p) => detail(p)} />
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
