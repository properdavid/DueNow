// PROTOTYPE — throwaway. The Due tab, HELD FIXED at ADR-0020's winner (the Radar
// cards from #17), so #18's Search variants are judged inside a populated app.
// Original stance: a glance-and-go surface, not a register. Rows become cards with room
// to breathe, dates are spoken relatively ("in 3 days", "5 days late") because
// that is the question being asked, and urgency is carried by a coloured left
// edge so the shape of the day is legible before any word is read. This is the
// one variant that prints a status mark: Open and In Progress are the difference
// between "nobody has touched this" and "someone is on it", which is the only
// thing separating two otherwise identical cards.
import { GROUPS, absolute, dueRows, relative, todayLabel, useMine, type DueRow } from "../due";
import { useNav } from "../proto";
import { Avatar, StatusIcon, TypeIcon } from "../screens";
import type { DueProps } from "../shell";
import { useTree } from "../store";

export default function DueFixed({ onOpen, selected, compact }: DueProps) {
  const t = useTree();
  const { scenario } = useNav();
  const { mineOnly, setMineOnly } = useMine();
  const rows = dueRows(t, mineOnly, scenario);

  return (
    <div className="bg-surface pb-6">
      <header className="border-b border-line bg-bg px-4 pt-3 pb-2">
        <h2 className="text-[17px] font-semibold tracking-tight">Due</h2>
        <p className="text-[12px] text-muted">{todayLabel()} · looking 30 days ahead</p>
      </header>

      <button
        onClick={() => setMineOnly(!mineOnly)}
        className="touch-min flex w-full items-center gap-2 border-b border-line bg-bg px-4 py-2 text-left text-[12px] hover:bg-surface"
      >
        <span className="text-muted">Showing</span>
        <span className="font-medium">{mineOnly ? "your work and unassigned" : "everything, both of you"}</span>
        <span className="ml-auto text-primary">{mineOnly ? "Show everyone" : "Just mine"}</span>
      </button>

      {rows.length === 0 && (
        <div className="mx-4 mt-6 rounded-lg border border-dashed border-line bg-bg px-6 py-10 text-center">
          <p className="text-[15px] font-medium">Nothing on the radar.</p>
          <p className="mt-1 text-[13px] text-muted">No dated work in the next 30 days.</p>
        </div>
      )}

      {rows.length > 0 &&
        GROUPS.map((g) => {
          const items = rows.filter((r) => r.group === g.key);
          return (
            <section key={g.key} className="px-4">
              <div className="flex items-baseline gap-2 pt-5 pb-2">
                <h3 className="text-[15px] font-semibold">{g.title}</h3>
                <span className="rounded-full bg-raised px-1.5 text-[11px] tabular-nums text-muted">{items.length}</span>
                <span className="ml-auto text-[11px] text-faint">{g.window}</span>
              </div>
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line px-4 py-5 text-center text-[12px] text-faint">
                  Nothing due {g.key === "now" ? "today" : g.key === "soon" ? "this week" : "after that"}.
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {items.map((r) => (
                    <Card key={r.item.id} r={r} compact={compact} selected={selected === r.item.id} onOpen={onOpen} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
    </div>
  );
}

function Card({ r, compact, selected, onOpen }: { r: DueRow; compact: boolean; selected: boolean; onOpen: (id: number) => void }) {
  const { item, lineage, overdue, days } = r;
  const edge = overdue ? "bg-overdue" : days === 0 ? "bg-type-topic" : days <= 7 ? "bg-primary/40" : "bg-line";
  const crumb = (compact ? lineage.slice(-2) : lineage).map((a) => a.summary).join(" › ");

  return (
    <li>
      <button
        onClick={() => onOpen(item.id)}
        className={`touch-min relative flex w-full gap-3 overflow-hidden rounded-lg border px-3 py-2.5 pl-4 text-left ${
          selected ? "border-primary bg-primary-soft" : "border-line bg-bg hover:border-faint"
        }`}
      >
        <span className={`absolute inset-y-0 left-0 w-1 ${edge}`} />
        <span className="min-w-0 flex-1">
          <span className="mb-0.5 flex items-center gap-1.5 text-[11px] text-faint">
            <TypeIcon type={item.type} size={11} />
            <span className="truncate">{crumb || `${item.type} · top level`}</span>
          </span>
          <span className="block text-[15px] leading-snug font-medium">{item.summary}</span>
          <span className="mt-1.5 flex items-center gap-2 text-[12px]">
            <span className={`font-medium ${overdue ? "text-overdue" : days === 0 ? "text-fg" : "text-muted"}`}>
              {relative(days)}
            </span>
            <span className="text-faint">{absolute(item.due!)}</span>
            <span className="ml-auto flex items-center gap-1.5 text-muted">
              <StatusIcon status={item.status} size={12} />
              <Avatar name={item.assignee} size={20} />
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
