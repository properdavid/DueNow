// PROTOTYPE — throwaway. Variant A — LEDGER.
// Stance: the Due tab is a dense register you scan top to bottom. Dates are
// absolute and right-aligned in one tabular column, so the eye reads a calendar
// down the edge; overdue is red plus a lateness suffix. Breadcrumb runs inline
// *before* the summary, so lineage and summary read as one sentence. No status
// mark at all — everything here is unfinished by definition, so the mark would
// be a column of two near-identical glyphs.
import { GROUPS, absolute, dueRows, lateness, todayLabel, useMine, type DueRow } from "../due";
import { useNav } from "../proto";
import { Avatar } from "../screens";
import type { DueProps } from "../shell";
import { useTree } from "../store";

export default function DueA({ onOpen, selected, compact }: DueProps) {
  const t = useTree();
  const { scenario } = useNav();
  const { mineOnly, setMineOnly } = useMine();
  const rows = dueRows(t, mineOnly, scenario);

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-bg px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{todayLabel()}</span>
        <div className="flex shrink-0 rounded border border-line text-[12px]">
          <button
            onClick={() => setMineOnly(true)}
            className={`touch-min rounded-l px-2 py-1 ${mineOnly ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface"}`}
          >
            Mine + unassigned
          </button>
          <button
            onClick={() => setMineOnly(false)}
            className={`touch-min rounded-r px-2 py-1 ${!mineOnly ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface"}`}
          >
            Everyone
          </button>
        </div>
      </header>

      {rows.length === 0 && (
        <p className="px-3 py-8 text-center text-[13px] text-faint">
          Nothing due in the next 30 days.
        </p>
      )}

      {rows.length > 0 &&
        GROUPS.map((g) => {
          const items = rows.filter((r) => r.group === g.key);
          return (
            <section key={g.key}>
              <div className="sticky top-[41px] z-[5] flex items-baseline gap-2 border-b border-line bg-surface px-3 py-1">
                <h3 className="text-[11px] font-semibold tracking-wider uppercase">{g.title}</h3>
                <span className="text-[11px] text-faint">{g.window}</span>
                <span className="ml-auto text-[11px] tabular-nums text-faint">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <p className="border-b border-line px-3 py-1.5 text-[12px] text-faint">— nothing</p>
              ) : (
                <ul>
                  {items.map((r) => (
                    <Row key={r.item.id} r={r} compact={compact} selected={selected === r.item.id} onOpen={onOpen} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
    </div>
  );
}

function Row({ r, compact, selected, onOpen }: { r: DueRow; compact: boolean; selected: boolean; onOpen: (id: number) => void }) {
  const { item, lineage, overdue, days } = r;
  // Compact keeps only the nearest ancestor — three ancestors and a summary do not
  // fit 390 points, and the nearest one is the one that disambiguates.
  const crumbs = compact ? lineage.slice(-1) : lineage;

  return (
    <li>
      <button
        onClick={() => onOpen(item.id)}
        className={`touch-min flex w-full items-center gap-2 border-b border-line px-3 py-1.5 text-left hover:bg-surface ${selected ? "bg-primary-soft" : ""}`}
      >
        {/* The breadcrumb gives way before the summary does — it is context, and the
            summary is the thing being read. */}
        <span className="flex min-w-0 flex-1 items-baseline gap-1 text-[14px] leading-snug">
          {crumbs.length > 0 && (
            <span className="max-w-[45%] shrink truncate text-faint">
              {crumbs.map((a) => a.summary).join(" › ")} ›
            </span>
          )}
          <span className="min-w-0 truncate">{item.summary}</span>
        </span>
        <Avatar name={item.assignee} size={18} />
        <span className={`w-[104px] shrink-0 text-right text-[12px] tabular-nums ${overdue ? "font-medium text-overdue" : "text-muted"}`}>
          {absolute(item.due!)}
          {overdue && <span className="block text-[11px] font-normal">{lateness(days)}</span>}
        </span>
      </button>
    </li>
  );
}
