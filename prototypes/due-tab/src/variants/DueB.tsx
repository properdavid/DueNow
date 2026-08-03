// PROTOTYPE — throwaway. Variant B — AGENDA.
// Stance: a deadline radar is a calendar read forwards, so the tab is one
// continuous chronological rail. Dates leave the rows entirely and become
// headings — a day is written once and everything landing on it hangs beneath.
// The three groups survive as thin dividers between stretches of days rather
// than as three separate lists. Overdue is not a row treatment but its own
// stretch at the top, headed "Late", because late work has already stopped
// being about which day it was.
import { GROUPS, dueRows, lateness, useMine, type DueRow } from "../due";
import { useNav } from "../proto";
import { Avatar, TypeIcon } from "../screens";
import type { DueProps } from "../shell";
import { useTree } from "../store";

export default function DueB({ onOpen, selected, compact }: DueProps) {
  const t = useTree();
  const { scenario } = useNav();
  const { mineOnly, setMineOnly } = useMine();
  const rows = dueRows(t, mineOnly, scenario);

  const groups = GROUPS.map((g) => ({ ...g, rows: rows.filter((r) => r.group === g.key) }));

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-bg px-3 py-2">
        <span className="text-[13px] font-semibold">Due</span>
        <button
          onClick={() => setMineOnly(!mineOnly)}
          className="touch-min flex items-center gap-1.5 rounded-full border border-line py-1 pr-2.5 pl-1 text-[12px] hover:bg-surface"
        >
          <span className="flex -space-x-1.5">
            <Avatar name="Dave" size={18} />
            {!mineOnly && <Avatar name="Mira" size={18} />}
            {mineOnly && <Avatar name={null} size={18} />}
          </span>
          {mineOnly ? "You + unassigned" : "Everyone"}
        </button>
      </header>

      {rows.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-[15px] font-medium">The next 30 days are clear.</p>
          <p className="mt-1 text-[13px] text-muted">
            Nothing dated is waiting on either of you. Undated work lives in Work Items.
          </p>
        </div>
      )}

      {rows.length > 0 &&
        groups.map((g) => {
          const late = g.rows.filter((r) => r.overdue).sort((a, b) => a.days - b.days);
          const days = groupByDay(g.rows.filter((r) => !r.overdue));
          return (
            <section key={g.key}>
              <div className="flex items-baseline gap-2 border-y border-line bg-surface px-3 py-1">
                <h3 className="text-[11px] font-semibold tracking-wider uppercase">{g.title}</h3>
                <span className="text-[11px] text-faint">{g.window}</span>
                {g.rows.length === 0 && <span className="ml-auto text-[11px] text-faint">clear</span>}
              </div>

              {late.length > 0 && (
                <>
                  <h4 className="flex items-baseline gap-2 bg-overdue/8 px-3 py-1 text-[12px] font-semibold text-overdue">
                    Late
                    <span className="text-[11px] font-normal opacity-70">{late.length}, oldest first</span>
                  </h4>
                  <ul>
                    {late.map((r) => (
                      <Row key={r.item.id} r={r} rail={lateness(r.days)} compact={compact} selected={selected === r.item.id} onOpen={onOpen} late />
                    ))}
                  </ul>
                </>
              )}

              {days.map((d) => (
                <div key={d.key}>
                  <h4 className="px-3 pt-3 pb-1 text-[12px] font-semibold text-muted">{d.label}</h4>
                  <ul>
                    {d.items.map((r) => (
                      <Row key={r.item.id} r={r} compact={compact} selected={selected === r.item.id} onOpen={onOpen} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          );
        })}
    </div>
  );
}

function Row({
  r,
  rail,
  compact,
  selected,
  onOpen,
  late,
}: {
  r: DueRow;
  rail?: string;
  compact: boolean;
  selected: boolean;
  onOpen: (id: number) => void;
  late?: boolean;
}) {
  const { item, lineage } = r;
  const crumb = (compact ? lineage.slice(-2) : lineage).map((a) => a.summary).join(" › ");
  return (
    <li>
      <button
        onClick={() => onOpen(item.id)}
        className={`touch-min flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-surface ${selected ? "bg-primary-soft" : ""}`}
      >
        <span className="pt-1">
          <TypeIcon type={item.type} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] leading-snug">{item.summary}</span>
          <span className="block truncate text-[11px] text-faint">{crumb || item.type}</span>
        </span>
        {late && <span className="shrink-0 pt-0.5 text-[11px] whitespace-nowrap text-overdue">{rail}</span>}
        <Avatar name={item.assignee} size={20} />
      </button>
    </li>
  );
}

function groupByDay(rows: DueRow[]) {
  const out: { key: string; label: string; group: DueRow["group"]; items: DueRow[] }[] = [];
  rows.forEach((r) => {
    const key = r.item.due!;
    const found = out.find((d) => d.key === key);
    if (found) found.items.push(r);
    else out.push({ key, label: dayHeading(r), group: r.group, items: [r] });
  });
  return out;
}

function dayHeading(r: DueRow): string {
  const d = new Date(r.item.due! + "T00:00:00");
  if (r.days === 0) return "Today";
  if (r.days === 1) return "Tomorrow";
  const abs = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  return r.days <= 7 ? abs : `${abs} · in ${r.days} days`;
}
