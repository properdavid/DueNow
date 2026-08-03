// PROTOTYPE — throwaway. Three stances on empty space (#24), switchable via
// ?variant=A|B|C, over the app state control in the black strip: signed out, an
// allowlist rejection, a first run, an all-settled tree, a clear radar, and a populated
// app to judge the rest against. The shell (ADR-0017), tree (ADR-0018), detail view
// (ADR-0019), Due tab (ADR-0020) and Search tab (ADR-0021) are all held fixed — only
// what happens when a surface has nothing in it swaps.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { HOUSEHOLD_EMAIL, type EmptyPack } from "./empty";
import { Switcher, useNav } from "./proto";
import { Shell } from "./shell";
import { TreeProvider } from "./store";
import type { SearchVariant } from "./shell";
import EmptyA from "./variants/EmptyA";
import EmptyB from "./variants/EmptyB";
import EmptyC from "./variants/EmptyC";
import SearchA from "./variants/SearchA";

function App() {
  const { variant, state, setState } = useNav();
  const empty: EmptyPack = variant === "B" ? EmptyB : variant === "C" ? EmptyC : EmptyA;
  const signedOut = state === "signed-out" || state === "rejected";

  return (
    <div className="flex h-screen flex-col">
      <Switcher />
      <div className="min-h-0 flex-1 [transform:translateZ(0)]">
        {signedOut ? (
          <empty.SignIn
            rejected={state === "rejected"}
            email={HOUSEHOLD_EMAIL}
            onSignIn={() => setState("first-run")}
            onRetry={() => setState("signed-out")}
          />
        ) : (
          <TreeProvider key={state} state={state}>
            <Shell key={variant} search={SearchA as SearchVariant} empty={empty} />
          </TreeProvider>
        )}
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
