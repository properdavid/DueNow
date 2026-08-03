// PROTOTYPE — throwaway. Three stances on DueNow's visual identity (#29), switchable
// via ?variant=A|B|C, over the app-state control in the black strip.
//
// Everything ADR-0017 through ADR-0028 settled is held FIXED — the shell, the tree, the
// detail view, the Due tab, Search, and the empty *card* itself (mark, headline, one
// line, no create button). Three things swap, and only three:
//
//   the WORDMARK — sign-in and the sidebar
//   the APP ICON — its own screen, the `icon sheet` state, at every size that ships
//   the CARD MARK — the thing at the top of all five of ADR-0028's cards
//
// The app states are #24's, carried over, because that is the only way to see the card
// marks: first run and all settled mean opposite things, and radar clear is the screen
// this household will see most.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { HOUSEHOLD_EMAIL } from "./empty";
import empty from "./empty-cards";
import { IdentityContext, type IdentityPack } from "./identity";
import { Switcher, useNav } from "./proto";
import { Shell } from "./shell";
import { TreeProvider } from "./store";
import type { SearchVariant } from "./shell";
import IdentityA from "./variants/IdentityA";
import IdentityB from "./variants/IdentityB";
import IdentityC from "./variants/IdentityC";
import IconSheet from "./variants/IconSheet";
import SearchA from "./variants/SearchA";

function App() {
  const { variant, state, setState } = useNav();
  const identity: IdentityPack = variant === "B" ? IdentityB : variant === "C" ? IdentityC : IdentityA;
  const signedOut = state === "signed-out" || state === "rejected";

  return (
    <IdentityContext.Provider value={identity}>
      <div className="flex h-screen flex-col">
        <Switcher />
        <div className="min-h-0 flex-1 [transform:translateZ(0)]">
          {state === "icons" ? (
            <IconSheet />
          ) : signedOut ? (
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
    </IdentityContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
