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
  phone: "bg-label-1",
  seasonal: "bg-label-2",
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

  // ── Added for #17: a spread of overdue-ness, a dated Topic (no breadcrumb at
  //    all), and deep lineage on an overdue row.
  { id: 39, type: "Task", parentId: 16, summary: "Call the plumber about the leak under the sink", status: "Open", assignee: "Mira", due: day(-1), labels: ["urgent"] },
  { id: 40, type: "Subtask", parentId: 17, summary: "Get the impeller part number", status: "Open", assignee: "Dave", due: day(-9), labels: [] },
  { id: 41, type: "Task", parentId: 27, summary: "Book the carpet cleaner", status: "Open", assignee: "Dave", due: day(-16), labels: ["errand"] },
  { id: 42, type: "Subtask", parentId: 41, summary: "Find the receipt from last time", status: "Open", assignee: null, due: day(-47), labels: [] },
];

// ── Added for #18: Search opens on the *whole corpus*, so the corpus has to be
//    big enough that a flat list is genuinely unbounded, and wordy enough that
//    FTS over Summary + Description has something to bite on (ADR-0013).
SEED.push(
  // ── Cars ─────────────────────────────────────────────────────────────
  { id: 43, type: "Topic", parentId: null, summary: "Cars", status: "In Progress", assignee: null, due: null, labels: [],
    description: "Both cars, insurance, registration, and anything that happens in the driveway." },
  { id: 44, type: "Project", parentId: 43, summary: "Volvo 120k service", status: "Open", assignee: "Dave", due: day(34), labels: ["money"],
    description: "The big one — timing belt, water pump, all four fluids. Dealer quoted $1,850, the indie place on Fremont quoted $1,340." },
  { id: 45, type: "Task", parentId: 44, summary: "Get a second quote from the Fremont garage", status: "Completed", assignee: "Dave", due: day(-12), labels: ["phone"] },
  { id: 46, type: "Task", parentId: 44, summary: "Book the service week", status: "Open", assignee: "Dave", due: day(31), labels: [],
    description: "Needs to be a week neither of us is travelling — we are down to one car while it is in." },
  { id: 47, type: "Subtask", parentId: 46, summary: "Check the shared calendar for a clear week", status: "Open", assignee: null, due: null, labels: [] },
  { id: 48, type: "Task", parentId: 44, summary: "Ask whether the timing belt quote includes the water pump", status: "Open", assignee: "Dave", due: day(24), labels: ["phone", "waiting"] },
  { id: 49, type: "Project", parentId: 43, summary: "Mira's car registration", status: "Open", assignee: "Mira", due: day(18), labels: ["money"],
    description: "Renewal notice came in the post. Needs a smog check first." },
  { id: 50, type: "Task", parentId: 49, summary: "Smog check", status: "Open", assignee: "Mira", due: day(11), labels: ["errand"] },
  { id: 51, type: "Task", parentId: 49, summary: "Pay the renewal online", status: "Open", assignee: null, due: day(17), labels: ["money"] },
  { id: 52, type: "Task", parentId: 49, summary: "Replace the wiper blades", status: "Closed", assignee: "Dave", due: null, labels: [],
    description: "Turned out to be the washer nozzle, not the blades. Closing this and not replacing anything." },

  // ── Money ────────────────────────────────────────────────────────────
  { id: 53, type: "Topic", parentId: null, summary: "Money", status: "In Progress", assignee: null, due: null, labels: ["money"],
    description: "Bills, insurance, taxes, and the once-a-year things that are easy to miss." },
  { id: 54, type: "Project", parentId: 53, summary: "Tax return", status: "In Progress", assignee: "Dave", due: day(52), labels: ["money"],
    description: "Filing jointly again. Last year the missing piece was the 1099 from the freelance work, so start there." },
  { id: 55, type: "Task", parentId: 54, summary: "Collect the 1099s", status: "In Progress", assignee: "Dave", due: day(20), labels: ["waiting"] },
  { id: 56, type: "Task", parentId: 54, summary: "Chase the mortgage interest statement", status: "Open", assignee: "Dave", due: day(25), labels: ["phone", "waiting"] },
  { id: 57, type: "Task", parentId: 54, summary: "Book the accountant", status: "Open", assignee: "Mira", due: day(38), labels: ["phone"] },
  { id: 58, type: "Subtask", parentId: 57, summary: "Find last year's invoice to check her rate", status: "Open", assignee: null, due: null, labels: [] },
  { id: 59, type: "Project", parentId: 53, summary: "Home insurance renewal", status: "Open", assignee: "Mira", due: day(-5), labels: ["money", "urgent"],
    description: "Premium jumped 22% this year. Worth shopping it before it auto-renews — the auto-renew date is the due date on this one." },
  { id: 60, type: "Task", parentId: 59, summary: "Get three comparison quotes", status: "Open", assignee: "Mira", due: day(-5), labels: ["money"] },
  { id: 61, type: "Task", parentId: 59, summary: "Read the current policy's flood exclusions", status: "Open", assignee: "Dave", due: null, labels: [] },
  { id: 62, type: "Project", parentId: 53, summary: "Cancel the subscriptions we don't use", status: "Completed", assignee: "Dave", due: day(-21), labels: ["money"],
    description: "Saved $47/month. The gym one needed a phone call, which is why it took three weeks." },
  { id: 63, type: "Task", parentId: 62, summary: "Cancel the gym membership", status: "Completed", assignee: "Dave", due: day(-24), labels: ["phone"] },
  { id: 64, type: "Task", parentId: 62, summary: "Cancel the second streaming service", status: "Completed", assignee: "Mira", due: day(-26), labels: [] },

  // ── Garden ───────────────────────────────────────────────────────────
  { id: 65, type: "Topic", parentId: null, summary: "Garden", status: "In Progress", assignee: null, due: null, labels: ["weekend"],
    description: "The yard, the beds, the irrigation, and the tree the neighbour keeps mentioning." },
  { id: 66, type: "Project", parentId: 65, summary: "Fix the irrigation", status: "In Progress", assignee: "Dave", due: day(8), labels: [],
    description: "Zone 3 has not come on since spring. Either the valve solenoid or a break in the line under the lawn." },
  { id: 67, type: "Task", parentId: 66, summary: "Test each zone from the controller", status: "Completed", assignee: "Dave", due: day(-3), labels: [] },
  { id: 68, type: "Task", parentId: 66, summary: "Dig up the zone 3 valve box", status: "In Progress", assignee: "Dave", due: day(8), labels: ["weekend"] },
  { id: 69, type: "Subtask", parentId: 68, summary: "Buy a replacement solenoid", status: "Open", assignee: "Dave", due: day(4), labels: ["errand", "money"] },
  { id: 70, type: "Subtask", parentId: 68, summary: "Borrow the trenching spade from Ray", status: "Open", assignee: null, due: null, labels: ["waiting"] },
  { id: 71, type: "Project", parentId: 65, summary: "Trim the oak over the fence", status: "Open", assignee: null, due: day(60), labels: [],
    description: "The neighbour has now mentioned it twice, politely. It is a two-person job with a pole saw or a one-person job with a cheque." },
  { id: 72, type: "Task", parentId: 71, summary: "Get an arborist quote", status: "Open", assignee: "Mira", due: day(45), labels: ["money", "phone"] },
  { id: 73, type: "Task", parentId: 71, summary: "Check whether the city needs a permit for an oak", status: "Open", assignee: null, due: null, labels: [] },
  { id: 74, type: "Project", parentId: 65, summary: "Autumn beds", status: "Open", assignee: "Mira", due: null, labels: ["seasonal"],
    description: "Garlic, broad beans, and whatever is left of the sunflower seed." },
  { id: 75, type: "Task", parentId: 74, summary: "Pull the tomatoes", status: "Open", assignee: null, due: null, labels: ["seasonal", "weekend"] },
  { id: 76, type: "Task", parentId: 74, summary: "Order garlic sets", status: "Open", assignee: "Mira", due: day(15), labels: ["money"] },
  { id: 77, type: "Task", parentId: 74, summary: "Top up the compost bins", status: "Open", assignee: null, due: null, labels: ["weekend"] },

  // ── Pets ─────────────────────────────────────────────────────────────
  { id: 78, type: "Topic", parentId: null, summary: "Pets", status: "In Progress", assignee: null, due: null, labels: [],
    description: "Bramble. Vet, food, grooming, and the sitter." },
  { id: 79, type: "Project", parentId: 78, summary: "Bramble's annual vet visit", status: "Open", assignee: "Mira", due: day(29), labels: [],
    description: "Vaccinations due, plus the lump on her shoulder we said we would ask about." },
  { id: 80, type: "Task", parentId: 79, summary: "Book the appointment", status: "Open", assignee: "Mira", due: day(22), labels: ["phone"] },
  { id: 81, type: "Task", parentId: 79, summary: "Ask about the lump on her shoulder", status: "Open", assignee: null, due: null, labels: [] },
  { id: 82, type: "Task", parentId: 79, summary: "Refill the flea treatment", status: "Open", assignee: "Dave", due: day(13), labels: ["errand", "money"] },
  { id: 83, type: "Project", parentId: 78, summary: "Sort out the shedding", status: "Open", assignee: null, due: null, labels: [],
    description: "It is everywhere. Either a grooming appointment every six weeks or a better brush and more discipline." },
  { id: 84, type: "Task", parentId: 83, summary: "Try the deshedding brush for two weeks", status: "In Progress", assignee: "Dave", due: null, labels: [] },
  { id: 85, type: "Task", parentId: 83, summary: "Price a standing grooming appointment", status: "Open", assignee: null, due: null, labels: ["money", "phone"] },

  // ── Admin ────────────────────────────────────────────────────────────
  { id: 86, type: "Topic", parentId: null, summary: "Admin", status: "In Progress", assignee: null, due: null, labels: [],
    description: "Paperwork with a deadline that belongs to nothing else." },
  { id: 87, type: "Project", parentId: 86, summary: "Passport renewals", status: "In Progress", assignee: "Mira", due: day(56), labels: ["urgent"],
    description: "Mine expires in five months, which is under the six-month rule for half the places we would go." },
  { id: 88, type: "Task", parentId: 87, summary: "Get passport photos taken", status: "Completed", assignee: "Mira", due: day(-7), labels: ["errand"] },
  { id: 89, type: "Task", parentId: 87, summary: "Fill in the renewal form", status: "In Progress", assignee: "Mira", due: day(27), labels: [] },
  { id: 90, type: "Task", parentId: 87, summary: "Post the application, tracked", status: "Open", assignee: null, due: day(30), labels: ["errand"] },
  { id: 91, type: "Subtask", parentId: 90, summary: "Find Dave's birth certificate", status: "Open", assignee: "Dave", due: day(26), labels: [] },
  { id: 92, type: "Project", parentId: 86, summary: "Update the emergency contacts", status: "Open", assignee: null, due: null, labels: [],
    description: "Both of us still have my old work number down at the doctor, the vet and the school." },
  { id: 93, type: "Task", parentId: 92, summary: "Call the doctor's surgery", status: "Open", assignee: "Dave", due: null, labels: ["phone"] },
  { id: 94, type: "Task", parentId: 92, summary: "Update the vet's file", status: "Open", assignee: null, due: null, labels: ["phone"] },

  // ── Deeper rows on the existing Topics, so a filtered list still runs long ──
  { id: 95, type: "Subtask", parentId: 7, summary: "Check whether the coast road is open past Big Sur", status: "Open", assignee: "Dave", due: day(16), labels: [] },
  { id: 96, type: "Subtask", parentId: 7, summary: "Decide whether we stop in San Luis Obispo overnight", status: "Open", assignee: null, due: null, labels: [] },
  { id: 97, type: "Subtask", parentId: 11, summary: "Ask contractor 1 to itemise the posts", status: "Open", assignee: "Mira", due: day(-1), labels: ["phone", "waiting"] },
  { id: 98, type: "Subtask", parentId: 15, summary: "Move the planters off the deck", status: "Open", assignee: null, due: null, labels: ["weekend"] },
  { id: 99, type: "Subtask", parentId: 15, summary: "Take the old chairs to the dump", status: "Open", assignee: "Dave", due: null, labels: ["errand", "weekend"] },
  { id: 100, type: "Subtask", parentId: 23, summary: "Check whether the bakery does gluten free", status: "Open", assignee: "Mira", due: day(20), labels: ["phone"] },
  { id: 101, type: "Subtask", parentId: 23, summary: "Agree a budget for the cake", status: "Open", assignee: null, due: null, labels: ["money"] },
  { id: 102, type: "Subtask", parentId: 31, summary: "Green bin, first Tuesday only", status: "Open", assignee: "Dave", due: day(2), labels: [] },
  { id: 103, type: "Subtask", parentId: 32, summary: "Move the rug before vacuuming under it", status: "Open", assignee: null, due: null, labels: [] },
  { id: 104, type: "Subtask", parentId: 29, summary: "Clear the ironing off the guest bed", status: "Open", assignee: "Mira", due: day(19), labels: [] },
  { id: 105, type: "Subtask", parentId: 28, summary: "Buy a squeegee that reaches the upstairs windows", status: "Open", assignee: null, due: null, labels: ["errand", "money"] },
  { id: 106, type: "Subtask", parentId: 18, summary: "Measure the pantry before ordering the shelf", status: "Open", assignee: "Dave", due: null, labels: [] },
  { id: 107, type: "Subtask", parentId: 39, summary: "Get the plumber's number off the fridge", status: "Completed", assignee: "Mira", due: day(-2), labels: ["phone"] },
  { id: 108, type: "Subtask", parentId: 22, summary: "Ask whether they can do a set menu for 14", status: "In Progress", assignee: "Mira", due: day(4), labels: ["phone"] },
  { id: 109, type: "Subtask", parentId: 22, summary: "Confirm the deposit is refundable", status: "Open", assignee: null, due: day(5), labels: ["money"] },
  { id: 110, type: "Subtask", parentId: 46, summary: "Ask Ray whether we can borrow his car for the week", status: "Open", assignee: "Dave", due: day(28), labels: ["waiting"] },
  { id: 111, type: "Subtask", parentId: 60, summary: "Dig out the current policy number", status: "Completed", assignee: "Mira", due: day(-9), labels: [] },
  { id: 112, type: "Subtask", parentId: 60, summary: "Check whether the roof age changes the premium", status: "Open", assignee: null, due: day(-4), labels: ["money"] },
  { id: 113, type: "Subtask", parentId: 80, summary: "Check which vaccinations are actually due", status: "Open", assignee: null, due: null, labels: [] },
  { id: 114, type: "Subtask", parentId: 50, summary: "Find a smog place open on a Saturday", status: "Open", assignee: "Mira", due: day(9), labels: ["errand", "weekend"] },
  { id: 115, type: "Subtask", parentId: 55, summary: "Log in to the old freelance portal", status: "Open", assignee: "Dave", due: day(18), labels: ["waiting"] },
  { id: 116, type: "Subtask", parentId: 72, summary: "Get the neighbour's name so the arborist can talk to them", status: "Open", assignee: null, due: null, labels: [] },
  { id: 117, type: "Subtask", parentId: 76, summary: "Decide hardneck or softneck", status: "Open", assignee: "Mira", due: null, labels: ["seasonal"] },
  { id: 118, type: "Subtask", parentId: 82, summary: "Check whether the vet price-matches online", status: "Open", assignee: null, due: day(12), labels: ["money"] },
  { id: 119, type: "Subtask", parentId: 89, summary: "Check whether the old passport gets returned", status: "Open", assignee: null, due: null, labels: [] },
  { id: 120, type: "Subtask", parentId: 93, summary: "Write down both mobile numbers before calling", status: "Open", assignee: null, due: null, labels: [] },
);

/** A Topic with its own date — the one Due row with no breadcrumb to print. */
SEED.find((i) => i.id === 20)!.due = day(2);

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
