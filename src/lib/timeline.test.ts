import { describe, it, expect } from "vitest";
import { findNearestFutureDate, formatDateString, mapTimelineToTree, parseDateString, type DayListing } from "./timeline";

describe("mapTimelineToTree", () => {
  it("returns an empty array for empty input", () => {
    expect(mapTimelineToTree([])).toEqual([]);
  });

  it("groups multiple day-resolution dates under correct year/month/day nodes", () => {
    const input: DayListing[] = [
      { date: "2025-05-27", entries: [{ id: "a1", title: "Standup", entry_type: "meeting" }] },
      { date: "2025-05-26", entries: [{ id: "b1", title: "Review PR", entry_type: "task" }] },
      { date: "2024-12-01", entries: [{ id: "c1", title: "Year-end", entry_type: "event" }] },
    ];

    const tree = mapTimelineToTree(input);

    expect(tree).toHaveLength(2);
    expect(tree[0].year).toBe(2024);
    expect(tree[1].year).toBe(2025);

    expect(tree[1].months).toHaveLength(1);
    expect(tree[1].months[0].monthName).toBe("May");
    expect(tree[1].months[0].month).toBe(5);

    expect(tree[1].months[0].days).toHaveLength(2);
    expect(tree[1].months[0].days[0].day).toBe(26);
    expect(tree[1].months[0].days[1].day).toBe(27);

    expect(tree[1].months[0].days[0].entries[0].title).toBe("Review PR");
    expect(tree[0].months[0].monthName).toBe("December");
  });

  it("places year-resolution listing on TreeYear.entries", () => {
    const input: DayListing[] = [
      { date: "2027", entries: [{ id: "a1", title: "Future plan", entry_type: "event" }] },
    ];

    const tree = mapTimelineToTree(input);
    expect(tree).toHaveLength(1);
    expect(tree[0].year).toBe(2027);
    expect(tree[0].entries).toHaveLength(1);
    expect(tree[0].entries[0].title).toBe("Future plan");
    expect(tree[0].months).toHaveLength(0);
  });

  it("places month-resolution listing on TreeMonth.entries", () => {
    const input: DayListing[] = [
      { date: "2027-06", entries: [{ id: "a1", title: "Book flights", entry_type: "task" }] },
    ];

    const tree = mapTimelineToTree(input);
    expect(tree).toHaveLength(1);
    expect(tree[0].year).toBe(2027);
    expect(tree[0].months).toHaveLength(1);
    expect(tree[0].months[0].monthName).toBe("June");
    expect(tree[0].months[0].entries).toHaveLength(1);
    expect(tree[0].months[0].entries[0].title).toBe("Book flights");
    expect(tree[0].months[0].days).toHaveLength(0);
  });

  it("handles mixed resolutions in the same year", () => {
    const input: DayListing[] = [
      { date: "2027",       entries: [{ id: "y1", title: "Year item", entry_type: "event" }] },
      { date: "2027-06",    entries: [{ id: "m1", title: "Month item", entry_type: "task" }] },
      { date: "2027-06-15", entries: [{ id: "d1", title: "Day item", entry_type: "meeting" }] },
    ];

    const tree = mapTimelineToTree(input);
    expect(tree).toHaveLength(1);
    expect(tree[0].entries[0].title).toBe("Year item");
    expect(tree[0].months[0].entries[0].title).toBe("Month item");
    expect(tree[0].months[0].days[0].entries[0].title).toBe("Day item");
  });

  it("skips unrecognised date shapes", () => {
    const input: DayListing[] = [
      { date: "not-a-date", entries: [] },
      { date: "2025-05-27", entries: [{ id: "a1", title: "Valid", entry_type: "task" }] },
    ];

    const tree = mapTimelineToTree(input);
    expect(tree).toHaveLength(1);
    expect(tree[0].year).toBe(2025);
  });

  it("sorts years ascending", () => {
    const input: DayListing[] = [
      { date: "2023-01-01", entries: [] },
      { date: "2025-01-01", entries: [] },
      { date: "2024-01-01", entries: [] },
    ];

    const tree = mapTimelineToTree(input);
    expect(tree.map((y) => y.year)).toEqual([2023, 2024, 2025]);
  });

  it("sorts months ascending within a year", () => {
    const input: DayListing[] = [
      { date: "2025-03-01", entries: [] },
      { date: "2025-11-01", entries: [] },
      { date: "2025-07-01", entries: [] },
    ];

    const tree = mapTimelineToTree(input);
    expect(tree[0].months.map((m) => m.month)).toEqual([3, 7, 11]);
  });

  it("sorts days ascending within a month", () => {
    const input: DayListing[] = [
      { date: "2025-05-05", entries: [] },
      { date: "2025-05-20", entries: [] },
      { date: "2025-05-12", entries: [] },
    ];

    const tree = mapTimelineToTree(input);
    expect(tree[0].months[0].days.map((d) => d.day)).toEqual([5, 12, 20]);
  });

  it("attaches the full date string to each TreeDay", () => {
    const input: DayListing[] = [{ date: "2025-05-27", entries: [] }];
    const tree = mapTimelineToTree(input);
    expect(tree[0].months[0].days[0].date).toBe("2025-05-27");
  });

  it("uses correct English month names", () => {
    const expected = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    for (let i = 1; i <= 12; i++) {
      const date = `2025-${String(i).padStart(2, "0")}-01`;
      const tree = mapTimelineToTree([{ date, entries: [] }]);
      expect(tree[0].months[0].monthName).toBe(expected[i - 1]);
    }
  });

  it("year and month nodes both have empty entries arrays by default", () => {
    const input: DayListing[] = [{ date: "2025-05-27", entries: [] }];
    const tree = mapTimelineToTree(input);
    expect(tree[0].entries).toEqual([]);
    expect(tree[0].months[0].entries).toEqual([]);
  });
});

describe("findNearestFutureDate", () => {
  const tree = mapTimelineToTree([
    { date: "2025-05-01", entries: [] },
    { date: "2025-06-15", entries: [] },
    { date: "2026-01-10", entries: [] },
  ]);

  it("returns the nearest date on or after today", () => {
    const result = findNearestFutureDate(tree, "2025-05-20");
    expect(result).toEqual({ year: 2025, month: 6, date: "2025-06-15" });
  });

  it("treats today's date as a future date", () => {
    const result = findNearestFutureDate(tree, "2025-06-15");
    expect(result).toEqual({ year: 2025, month: 6, date: "2025-06-15" });
  });

  it("returns null when all dates are before today", () => {
    const result = findNearestFutureDate(tree, "2030-01-01");
    expect(result).toBeNull();
  });

  it("returns null for an empty tree", () => {
    expect(findNearestFutureDate([], "2025-06-01")).toBeNull();
  });
});

describe("parseDateString", () => {
  it("parses year-only string", () => {
    expect(parseDateString("2027")).toEqual({ year: 2027 });
  });

  it("parses year-month string", () => {
    expect(parseDateString("2027-06")).toEqual({ year: 2027, month: 6 });
  });

  it("parses year-month-day string", () => {
    expect(parseDateString("2027-06-15")).toEqual({ year: 2027, month: 6, day: 15 });
  });

  it("returns null for unrecognised shape", () => {
    expect(parseDateString("not-a-date")).toBeNull();
    expect(parseDateString("")).toBeNull();
  });
});

describe("formatDateString", () => {
  it("formats year only", () => {
    expect(formatDateString(2027)).toBe("2027");
  });

  it("formats year and month", () => {
    expect(formatDateString(2027, 6)).toBe("2027-06");
  });

  it("formats year, month, and day", () => {
    expect(formatDateString(2027, 6, 15)).toBe("2027-06-15");
  });

  it("zero-pads month and day", () => {
    expect(formatDateString(2027, 3, 5)).toBe("2027-03-05");
  });
});
