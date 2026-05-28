// ── Types mirroring the Rust backend structs ─────────────────────────────────

export interface EntryMeta {
  id: string;
  title: string;
  entry_type: string;
  has_children: boolean;
}

export interface EntryNote {
  name: string;
  filename: string;
}

export interface EntrySubfolder {
  name: string;
  notes: EntryNote[];
}

export interface EntryChildrenListing {
  notes: EntryNote[];
  subfolders: EntrySubfolder[];
}

export type FocusedItem =
  | { type: "entry";     entryId: string; date: string }
  | { type: "subfolder"; entryId: string; date: string; subfolderName: string };

export interface DayListing {
  date: string; // "YYYY" | "YYYY-MM" | "YYYY-MM-DD"
  entries: EntryMeta[];
}

// ── Display tree types ────────────────────────────────────────────────────────

export interface TreeDay {
  day: number;
  date: string; // full "YYYY-MM-DD" — used to construct file paths
  entries: EntryMeta[];
}

export interface TreeMonth {
  month: number;     // 1–12
  monthName: string; // "January", "February", …
  entries: EntryMeta[]; // month-resolution entries (no specific day)
  days: TreeDay[];
}

export interface TreeYear {
  year: number;
  entries: EntryMeta[]; // year-resolution entries (no specific month)
  months: TreeMonth[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES: readonly string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ── findNearestFutureDate ─────────────────────────────────────────────────────

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

type YearBucket = {
  entries: EntryMeta[];
  months: Map<number, { entries: EntryMeta[]; days: TreeDay[] }>;
};

function buildYearNode(year: number, bucket: YearBucket): TreeYear {
  const monthNums = Array.from(bucket.months.keys()).sort((a, b) => a - b);
  const months: TreeMonth[] = monthNums.map(month => {
    const mb = bucket.months.get(month)!;
    return {
      month,
      monthName: MONTH_NAMES[month - 1] ?? String(month),
      entries: mb.entries,
      days: mb.days.sort((a, b) => a.day - b.day),
    };
  });
  return { year, entries: bucket.entries, months };
}

export function mapTimelineToTree(days: DayListing[]): TreeYear[] {
  const yearMap = new Map<number, YearBucket>();

  const ensureYear = (year: number) => {
    if (!yearMap.has(year)) yearMap.set(year, { entries: [], months: new Map() });
    return yearMap.get(year)!;
  };

  const ensureMonth = (yearBucket: YearBucket, month: number) => {
    if (!yearBucket.months.has(month)) yearBucket.months.set(month, { entries: [], days: [] });
    return yearBucket.months.get(month)!;
  };

  for (const { date, entries } of days) {
    const parsed = parseDateString(date);
    if (!parsed) continue;
    const { year, month, day } = parsed;
    if (day !== undefined) {
      ensureMonth(ensureYear(year), month!).days.push({ day, date, entries }); // month always defined when day is
    } else if (month !== undefined) {
      ensureMonth(ensureYear(year), month).entries.push(...entries);
    } else {
      ensureYear(year).entries.push(...entries);
    }
  }

  const years = Array.from(yearMap.keys()).sort((a, b) => a - b);
  return years.map(year => buildYearNode(year, yearMap.get(year)!));
}

// ── parseDateString ───────────────────────────────────────────────────────────

/** Parse a resolution date string into its numeric components. */
export function parseDateString(date: string): { year: number; month?: number; day?: number } | null {
  if (date.length === 4) {
    const year = parseInt(date, 10);
    return isNaN(year) ? null : { year };
  }
  if (date.length === 7) {
    const year = parseInt(date.slice(0, 4), 10);
    const month = parseInt(date.slice(5, 7), 10);
    return isNaN(year) || isNaN(month) ? null : { year, month };
  }
  if (date.length === 10) {
    const parts = date.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return isNaN(year) || isNaN(month) || isNaN(day) ? null : { year, month, day };
  }
  return null;
}

/** Format year/month/day components into a resolution date string. */
export function formatDateString(year: number, month?: number, day?: number): string {
  if (month === undefined) return String(year);
  const mm = String(month).padStart(2, "0");
  if (day === undefined) return `${year}-${mm}`;
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// ── Quick-move date helpers ───────────────────────────────────────────────────

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getToday(): string {
  return localDateString(new Date());
}

export function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localDateString(d);
}

/** Returns the Monday of the next calendar week. Always at least 1 day ahead. */
export function getNextMonday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return localDateString(d);
}
