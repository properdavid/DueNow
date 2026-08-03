// PROTOTYPE — throwaway stub data for the nav-shell prototype.
// Shapes follow ADR-0006 (one core field set) and ADR-0010 (adjacency list).

export type Status = "Open" | "In Progress" | "Completed" | "Closed";
export type Type = "Topic" | "Project" | "Task" | "Subtask";

export type WorkItem = {
  id: number;
  type: Type;
  parentId: number | null;
  summary: string;
  status: Status;
  assignee: string | null;
  due: string | null; // YYYY-MM-DD
  labels: string[];
  description?: string;
  comments?: { author: string; at: string; body: string; edited?: boolean }[];
};

export const PEOPLE = ["Dave", "Mira"];
export const ME = "Dave";

const base = new Date();
base.setHours(0, 0, 0, 0);

export function day(offset: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const TODAY = day(0);

export const LABELS: Record<string, string> = {
  errand: "bg-label-1",
  money: "bg-label-2",
  waiting: "bg-label-3",
  weekend: "bg-label-4",
  urgent: "bg-label-5",
};

export const SEED: WorkItem[] = [
  // ── Travel ────────────────────────────────────────────────────────────
  { id: 1, type: "Topic", parentId: null, summary: "Travel", status: "In Progress", assignee: null, due: null, labels: [],
    description: "Anything that involves going somewhere and sleeping there. Day trips live under Celebrations if they are for someone." },
  { id: 2, type: "Project", parentId: 1, summary: "San Diego Trip", status: "In Progress", assignee: "Mira", due: day(26), labels: ["weekend"],
    description: "Long weekend, driving down Friday morning. Budget ~$900 all in.\n\nSam and Kel are coming if they can get the Friday off. If they cannot, we drop to one night and skip the deposit.",
    comments: [
      { author: "Dave", at: "last week", body: "Checked the calendar — the only weekend that works before the patio job starts." },
      { author: "Mira", at: "4 days ago", body: "Booked nothing yet, but the whole thing hinges on lodging. Let's decide by Friday." },
      { author: "Dave", at: "2 days ago", body: "Fine by me. Ocean Beach over Pacific Beach if it is close." },
    ] },
  { id: 3, type: "Task", parentId: 2, summary: "Book lodging", status: "In Progress", assignee: "Mira", due: day(3), labels: ["money"],
    description: "Somewhere walkable to the beach. Two nights, Fri–Sun.",
    comments: [
      { author: "Mira", at: "2 days ago", body: "Shortlisted three places in Ocean Beach — all under $220/night." },
      { author: "Dave", at: "yesterday", body: "The second one has parking, let's take it." },
      { author: "Mira", at: "yesterday", body: "Agreed. I'll hold it — the deposit is refundable up to two weeks out, so there is no risk in going early." },
      { author: "Dave", at: "3 hours ago", body: "Held. Deposit goes out once Sam confirms." },
    ] },
  { id: 4, type: "Subtask", parentId: 3, summary: "Research Airbnbs", status: "Completed", assignee: "Mira", due: day(-4), labels: [] },
  { id: 5, type: "Subtask", parentId: 3, summary: "Confirm dates with Sam and Kel", status: "In Progress", assignee: "Dave", due: day(1), labels: ["waiting"],
    description: "Texted both. Sam is waiting on his shift roster.",
    comments: [{ author: "Dave", at: "yesterday", body: "Sam says probably. Kel is in." }] },
  { id: 6, type: "Subtask", parentId: 3, summary: "Pay deposit", status: "Open", assignee: null, due: day(3), labels: ["money"] },
  { id: 7, type: "Task", parentId: 2, summary: "Plan the drive down", status: "Open", assignee: "Dave", due: day(19), labels: [] },
  { id: 8, type: "Task", parentId: 2, summary: "Book dog sitter", status: "Open", assignee: "Dave", due: day(9), labels: ["urgent"] },

  // ── House ─────────────────────────────────────────────────────────────
  { id: 9, type: "Topic", parentId: null, summary: "House", status: "In Progress", assignee: null, due: null, labels: [] },
  { id: 10, type: "Project", parentId: 9, summary: "Replace Patio Cover", status: "In Progress", assignee: "Dave", due: day(12), labels: [],
    description: "The west end is rotting through. Three quotes before we pick." },
  { id: 11, type: "Task", parentId: 10, summary: "Get patio cover quotes", status: "In Progress", assignee: "Dave", due: day(-2), labels: ["urgent"],
    description: "Three contractors, written quotes, itemised.",
    comments: [
      { author: "Dave", at: "3 days ago", body: "Two in. Third hasn't called back." },
      { author: "Mira", at: "2 days ago", body: "The first quote does not itemise the posts. Worth asking before we compare." },
    ] },
  { id: 12, type: "Subtask", parentId: 11, summary: "Call contractor 1", status: "Completed", assignee: "Dave", due: day(-8), labels: [] },
  { id: 13, type: "Subtask", parentId: 11, summary: "Call contractor 2", status: "Completed", assignee: "Dave", due: day(-6), labels: [] },
  { id: 14, type: "Subtask", parentId: 11, summary: "Call contractor 3", status: "Open", assignee: "Dave", due: day(-2), labels: ["waiting"] },
  { id: 15, type: "Task", parentId: 10, summary: "Clear the patio", status: "Open", assignee: null, due: null, labels: ["weekend"] },
  { id: 16, type: "Project", parentId: 9, summary: "Kitchen", status: "In Progress", assignee: null, due: null, labels: [],
    description: "Never finishes. Anything kitchen-shaped that is not an emergency goes here." },
  { id: 17, type: "Task", parentId: 16, summary: "Fix the disposal", status: "Open", assignee: "Mira", due: day(0), labels: ["urgent"] },
  { id: 18, type: "Task", parentId: 16, summary: "Replace the pantry shelf", status: "Open", assignee: null, due: null, labels: [] },
  { id: 19, type: "Task", parentId: 16, summary: "Re-seal the counter edge", status: "Closed", assignee: "Dave", due: null, labels: [] },

  // ── Celebrations ──────────────────────────────────────────────────────
  { id: 20, type: "Topic", parentId: null, summary: "Celebrations", status: "In Progress", assignee: null, due: null, labels: [] },
  { id: 21, type: "Project", parentId: 20, summary: "Mum's 70th", status: "In Progress", assignee: "Mira", due: day(41), labels: [] },
  { id: 22, type: "Task", parentId: 21, summary: "Book the restaurant", status: "In Progress", assignee: "Mira", due: day(5), labels: ["urgent"] },
  { id: 23, type: "Task", parentId: 21, summary: "Order the cake", status: "Open", assignee: null, due: day(28), labels: [] },
  { id: 24, type: "Task", parentId: 21, summary: "Send invitations", status: "Open", assignee: "Dave", due: day(14), labels: ["errand"] },
  { id: 25, type: "Project", parentId: 20, summary: "Anniversary", status: "Completed", assignee: "Dave", due: day(-30), labels: [] },

  // ── Cleaning ──────────────────────────────────────────────────────────
  { id: 26, type: "Topic", parentId: null, summary: "Cleaning", status: "In Progress", assignee: null, due: null, labels: [] },
  { id: 27, type: "Project", parentId: 26, summary: "Deep clean before guests", status: "Open", assignee: null, due: day(23), labels: ["weekend"] },
  { id: 28, type: "Task", parentId: 27, summary: "Windows", status: "Open", assignee: null, due: null, labels: [] },
  { id: 29, type: "Task", parentId: 27, summary: "Guest room", status: "Open", assignee: "Mira", due: day(21), labels: [] },
  { id: 30, type: "Project", parentId: 26, summary: "Weekly rota", status: "In Progress", assignee: null, due: null, labels: [] },
  { id: 31, type: "Task", parentId: 30, summary: "Bins out", status: "Open", assignee: "Dave", due: day(2), labels: ["errand"] },
  { id: 32, type: "Task", parentId: 30, summary: "Vacuum downstairs", status: "Open", assignee: null, due: day(6), labels: [] },

  // ── Deeper / longer rows, to stress the compact row ───────────────────
  { id: 33, type: "Subtask", parentId: 8, summary: "Ask Jules whether she can take Bramble again", status: "Open", assignee: "Dave", due: day(7), labels: ["waiting"] },
  { id: 34, type: "Subtask", parentId: 8, summary: "Kennel backup", status: "Open", assignee: null, due: null, labels: [] },
  { id: 35, type: "Subtask", parentId: 24, summary: "Collect current addresses from Mum", status: "Open", assignee: "Mira", due: day(10), labels: [] },
  { id: 36, type: "Subtask", parentId: 24, summary: "Print", status: "Open", assignee: null, due: null, labels: ["errand"] },
  { id: 37, type: "Subtask", parentId: 29, summary: "Wash the spare bedding and air the room out properly", status: "Open", assignee: null, due: null, labels: [] },
  { id: 38, type: "Subtask", parentId: 22, summary: "Confirm the private room holds 14", status: "Completed", assignee: "Mira", due: day(-3), labels: [] },
];

export function daysOut(due: string): number {
  return Math.round((new Date(due + "T00:00:00").getTime() - base.getTime()) / 86_400_000);
}

export function formatDue(due: string | null): string {
  if (!due) return "—";
  const d = daysOut(due);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d < 0) return `${-d} days ago`;
  return new Date(due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
