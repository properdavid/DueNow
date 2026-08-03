// PROTOTYPE — throwaway. The seam the three variants plug into.
// #24's four surfaces: the sign-in screen (including an allowlist rejection), the Work
// Items tree with nothing in it, the Due tab with nothing on the radar, and the Split
// Layout's right column before anything is selected.
//
// ADR-0024: "empty is two states, not one", and the test is always whether any work
// item exists — never whether a row is currently visible. So `firstRun` is passed down
// separately from "there is nothing to show", and every variant must answer both.
import type { WorkItem } from "./data";
import type { DueRow } from "./due";

export type SignInProps = {
  /** The allowlist said no. Same screen, or a different one — that is the question. */
  rejected: boolean;
  email: string;
  onSignIn: () => void;
  onRetry: () => void;
};

export type TreeEmptyProps = {
  firstRun: boolean;
  /** Terminal Topics sitting behind ADR-0018's per-parent reveal. */
  settled: number;
  onReveal: () => void;
  onCreate: () => void;
  /** Only variant C uses this — creating a Topic without leaving the tree. */
  onCreateTopic: (summary: string) => void;
  compact: boolean;
};

export type DueEmptyProps = {
  firstRun: boolean;
  /** The nearest dated, unfinished work item *past* the 30-day horizon, if any. */
  next: { item: WorkItem; days: number } | null;
  onOpen: (id: number) => void;
  onCreate: () => void;
};

export type UnselectedProps = {
  /** What the Due tab would show — offered so a variant may put the pane to work. */
  rows: DueRow[];
  firstRun: boolean;
  onOpen: (id: number) => void;
  onCreate: () => void;
};

export type EmptyPack = {
  name: string;
  SignIn: (p: SignInProps) => React.ReactNode;
  TreeEmpty: (p: TreeEmptyProps) => React.ReactNode;
  DueEmpty: (p: DueEmptyProps) => React.ReactNode;
  Unselected: (p: UnselectedProps) => React.ReactNode;
};

export const HOUSEHOLD_EMAIL = "sam.okafor@gmail.com";
