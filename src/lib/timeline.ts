// ── Types mirroring the Rust backend structs ─────────────────────────────────

export interface EntryMeta {
  id: string;
  title: string;
  entry_type: string;
}

export interface DayListing {
  date: string; // "YYYY-MM-DD"
  entries: EntryMeta[];
}

// ── Display tree types ────────────────────────────────────────────────────────

export interface TreeDay {
  day: number;
  date: string; // full "YYYY-MM-DD" — used to construct file paths
  entries: EntryMeta[];
}

export interface TreeMonth {
  month: number;   // 1–12
  monthName: string; // "January", "February", …
  days: TreeDay[];
}

export interface TreeYear {
  year: number;
  months: TreeMonth[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES: readonly string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ── findNearestFutureDate ─────────────────────────────────────────────────────

/**
 * Returns the year, month, and date string of the first TreeDay whose date is
 * >= today (YYYY-MM-DD lexicographic comparison). Returns null if no such day
 * exists. Pure function — no side effects.
 */
export function findNearestFutureDate(
  tree: TreeYear[],
  today: string,
): { year: number; month: number; date: string } | null {
  for (const yearNode of tree) {
    for (const monthNode of yearNode.months) {
      for (const dayNode of monthNode.days) {
        if (dayNode.date >= today) {
          return { year: yearNode.year, month: monthNode.month, date: dayNode.date };
        }
      }
    }
  }
  return null;
}

// ── mapTimelineToTree ─────────────────────────────────────────────────────────

/**
 * Groups a flat array of `DayListing` values (from the backend) into a nested
 * `TreeYear[]` structure for display in the date tree.
 *
 * - Years sorted descending (newest first)
 * - Months sorted descending within each year
 * - Days sorted descending within each month
 *
 * This is a pure function — no side effects, no I/O.
 */
export function mapTimelineToTree(days: DayListing[]): TreeYear[] {
  // year → month → TreeDay[]
  const yearMap = new Map<number, Map<number, TreeDay[]>>();

  for (const day of days) {
    const parts = day.date.split("-");
    if (parts.length !== 3) continue;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const dayNum = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(dayNum)) continue;

    if (!yearMap.has(year)) {
      yearMap.set(year, new Map());
    }
    const monthMap = yearMap.get(year)!;

    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }
    monthMap.get(month)!.push({
      day: dayNum,
      date: day.date,
      entries: day.entries,
    });
  }

  // Build sorted output
  const result: TreeYear[] = [];

  const years = Array.from(yearMap.keys()).sort((a, b) => a - b);

  for (const year of years) {
    const monthMap = yearMap.get(year)!;
    const months: TreeMonth[] = [];

    const monthNums = Array.from(monthMap.keys()).sort((a, b) => a - b);

    for (const month of monthNums) {
      const treeDays = monthMap
        .get(month)!
        .sort((a, b) => a.day - b.day);

      months.push({
        month,
        monthName: MONTH_NAMES[month - 1] ?? String(month),
        days: treeDays,
      });
    }

    result.push({ year, months });
  }

  return result;
}
