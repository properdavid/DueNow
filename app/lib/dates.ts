/**
 * One formatter for a Due Date, wherever one is printed (ADR-0031).
 *
 * A Due Date is a whole calendar day stored as `YYYY-MM-DD`, so it is read back
 * in UTC: any other zone would shift the day it names.
 */
const dueDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

export function formatDueDate(dueDate: string) {
  const [year, month, day] = dueDate.split("-").map(Number);
  return dueDateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}
