import { Clock } from "lucide-react";
import { useState } from "react";
import { Link, useMatches } from "react-router";

import type { Route } from "./+types/due";
import { getDatabase, requireUser } from "~/auth/session.server";
import { EmptyCard } from "~/components/shell/empty-card";
import { SplitRoute } from "~/components/shell/split-route";
import { Avatar, StatusMark } from "~/components/ui/work-item-marks";
import { loadDueRadar, type DueRadarCard, type DueRadarScope, type DueRadarUrgency } from "~/domain/work-items/work-items.server";

type DueGroupKey = "now" | "soon" | "later";

const groupDetails = {
  now: { heading: "Due Now", empty: "Nothing overdue or due today" },
  soon: { heading: "Due Soon", empty: "Nothing due in the next 7 days" },
  later: { heading: "Due Later", empty: "Nothing due in the 23 days after that" },
} as const satisfies Record<DueGroupKey, { heading: string; empty: string }>;

const urgencyEdgeClassName = {
  overdue: "bg-urgency-overdue",
  today: "bg-urgency-today",
  soon: "bg-urgency-soon",
  later: "bg-urgency-later",
} as const satisfies Record<DueRadarUrgency, string>;

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = await requireUser(request, context);
  const database = getDatabase(context);
  const mine = loadDueRadar(database, user.id, "mine");
  const everyone = loadDueRadar(database, user.id, "everyone");
  return { ...mine, everyoneGroups: everyone.groups, scope: "mine" as const, user };
}

export default function Due({ loaderData }: Route.ComponentProps) {
  const hasSelection = useMatches().some((match) => match.id === "due-item");
  const [scope, setScope] = useState<DueRadarScope>("mine");
  const groups = scope === "mine" ? loaderData.groups : loaderData.everyoneGroups;
  const hasAnyRadarCards =
    loaderData.groups.now.length +
      loaderData.groups.soon.length +
      loaderData.groups.later.length +
      loaderData.everyoneGroups.now.length +
      loaderData.everyoneGroups.soon.length +
      loaderData.everyoneGroups.later.length >
    0;
  const emptyState = loaderData.hasEverHadWorkItems
    ? { headline: "Nothing on the radar", line: "No work is due in the next 30 days." }
    : {
        headline: "Nothing due yet",
        line: "This is where dated work shows up, 30 days ahead. Create your first work item and give it a due date.",
      };

  return (
    <SplitRoute hasSelection={hasSelection}>
      {!hasAnyRadarCards ? (
        <div className="flex min-h-screen items-center justify-center p-6 lg:min-h-full">
          <EmptyCard headline={emptyState.headline} line={emptyState.line} Mark={Clock} />
        </div>
      ) : (
      <div className="min-h-screen space-y-6 p-6 lg:min-h-full">
        <header className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Due</h1>
            <p className="mt-1 text-xs text-muted-foreground">What is approaching in the next 30 days.</p>
          </div>
          <FilterSentence scope={scope} setScope={setScope} />
        </header>

        <div className="space-y-6">
          {(["now", "soon", "later"] as const).map((key) => (
            <DueGroup key={key} groupKey={key} cards={groups[key]} currentUserId={loaderData.user.id} />
          ))}
        </div>
      </div>
      )}
    </SplitRoute>
  );
}

function FilterSentence({ scope, setScope }: { scope: DueRadarScope; setScope: (scope: DueRadarScope) => void }) {
  if (scope === "everyone") {
    return (
      <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 text-xs text-card-foreground">
        <span>Showing everyone</span>
        <button className="font-medium text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" type="button" onClick={() => setScope("mine")}>
          Show your work
        </button>
      </div>
    );
  }
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 text-xs text-card-foreground">
      <span>Showing your work and unassigned</span>
      <button className="font-medium text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" type="button" onClick={() => setScope("everyone")}>
        Show everyone
      </button>
    </div>
  );
}

function DueGroup({ groupKey, cards, currentUserId }: { groupKey: DueGroupKey; cards: DueRadarCard[]; currentUserId: number }) {
  const details = groupDetails[groupKey];
  return (
    <section className="space-y-3" aria-labelledby={`due-${groupKey}`}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={`due-${groupKey}`} className="text-lg font-semibold">
          {details.heading}
        </h2>
        <span className="rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {cards.length}
        </span>
      </div>
      {cards.length > 0 ? (
        <div className="space-y-3">
          {cards.map((card) => (
            <DueCard key={card.id} card={card} currentUserId={currentUserId} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-xs text-muted-foreground">{details.empty}</div>
      )}
    </section>
  );
}

function DueCard({ card, currentUserId }: { card: DueRadarCard; currentUserId: number }) {
  const overdue = card.urgency === "overdue";
  return (
    <Link
      className="group relative block h-32 overflow-hidden rounded-lg border border-border bg-card p-4 pl-6 text-card-foreground hover-elevate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      to={`/due/${card.id}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${urgencyEdgeClassName[card.urgency]}`} aria-hidden="true" />
      <p className="truncate text-xs text-muted-foreground">
        <Breadcrumb card={card} />
      </p>
      <h3 className="mt-2 text-sm font-medium">{card.summary}</h3>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className={overdue ? "font-medium text-urgency-overdue" : undefined}>
          {card.relativeDate} <span className="text-muted-foreground">· {card.absoluteDate}</span>
        </span>
        <StatusMark status={card.status} />
        <AssigneeMeta card={card} currentUserId={currentUserId} />
      </div>
    </Link>
  );
}

function Breadcrumb({ card }: { card: DueRadarCard }) {
  if (card.type === "topic") {
    return <span>{typeLabel(card.type)}</span>;
  }
  const full = card.breadcrumb.map((item) => item.summary).join(" › ");
  const compact = card.breadcrumb.slice(-2).map((item) => item.summary).join(" › ");
  return (
    <>
      <span className="lg:hidden">{compact}</span>
      <span className="hidden lg:inline">{full}</span>
    </>
  );
}

function AssigneeMeta({ card, currentUserId }: { card: DueRadarCard; currentUserId: number }) {
  if (!card.assignee) {
    return (
      <span className="inline-flex items-center gap-1">
        <Avatar assignee={null} currentUserId={currentUserId} />
        <span>Unassigned</span>
      </span>
    );
  }
  return <Avatar assignee={card.assignee} currentUserId={currentUserId} withName />;
}

function typeLabel(type: DueRadarCard["type"]) {
  return { topic: "Topic", project: "Project", task: "Task", subtask: "Subtask" }[type];
}
