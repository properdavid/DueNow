// PROTOTYPE — throwaway. Three variants of the DueNow navigation shell,
// switchable via ?variant=A|B|C. Resize the window to judge phone/tablet/desktop.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { SCALES, Switcher, useNav, useScale } from "./proto";
import VariantA from "./variants/VariantA";
import VariantB from "./variants/VariantB";
import VariantC from "./variants/VariantC";
import VariantD from "./variants/VariantD";

function App() {
  const { variant } = useNav();
  const { i } = useScale();
  return (
    <div className="flex h-screen flex-col">
      <Switcher />
      {/* transform creates a containing block so each variant's fixed overlays
          stay inside the app frame instead of covering the switcher */}
      <div className="min-h-0 flex-1 [transform:translateZ(0)]" style={{ zoom: SCALES[i] }}>
        {variant === "B" ? <VariantB /> : variant === "C" ? <VariantC /> : variant === "D" ? <VariantD /> : <VariantA />}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
