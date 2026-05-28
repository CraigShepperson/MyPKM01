import { describe, it, expect } from "vitest";
import { findNearestFutureDate, mapTimelineToTree, type DayListing } from "./timeline";

describe("mapTimelineToTree", () => {
  it("returns an empty array for empty input", () => {
    expect(mapTimelineToTree([])).toEqual([]);
  });

  it("groups multiple dates under correct year/month/day nodes", () => {
    const input: DayListing[] = [
      { date: "2025-05-27", entries: [{ id: "a1", title: "Standup", entry_type: "meeting" }] },
      { date: "2025-05-26", entries: [{ id: "b1", title: "Review PR", entry_type: "task" }] },
      { date: "2024-12-01", entries: [{ id: "c1", title: "Year-end", entry_type: "event" }] },
    ];

    const tree = mapTimelineToTree(input);

    // Two year nodes
    expect(tree).toHaveLength(2);

    // 2024 is first (ascending sort)
    expect(tree[0].year).toBe(2024);
    expect(tree[1].year).toBe(2025);

    // 2025 has one month: May
    expect(tree[1].months).toHaveLength(1);
    expect(tree[1].months[0].monthName).toBe("May");
    expect(tree[1].months[0].month).toBe(5);

    // May has two days, sorted ascending: 26 then 27
    expect(tree[1].months[0].days).toHaveLength(2);
    expect(tree[1].months[0].days[0].day).toBe(26);
    expect(tree[1].months[0].days[1].day).toBe(27);

    // Entries are preserved on the day nodes
    expect(tree[1].months[0].days[0].entries[0].title).toBe("Review PR");

    // 2024 has December
    expect(tree[0].months[0].monthName).toBe("December");
  });

  it("sorts years ascending", () => {
    const input: DayListing[] = [
      { date: "2023-01-01", entries: [] },
      { date: "2025-01-01", entries: [] },
      { date: "2024-01-01", entries: [] },
    ];

    const tree = mapTimelineToTree(input);
    const years = tree.map((y) => y.year);
    expect(years).toEqual([2023, 2024, 2025]);
  });

  it("sorts months ascending within a year", () => {
    const input: DayListing[] = [
      { date: "2025-03-01", entries: [] },
      { date: "2025-11-01", entries: [] },
      { date: "2025-07-01", entries: [] },
    ];

    const tree = mapTimelineToTree(input);
    const months = tree[0].months.map((m) => m.month);
    expect(months).toEqual([3, 7, 11]);
  });

  it("sorts days ascending within a month", () => {
    const input: DayListing[] = [
      { date: "2025-05-05", entries: [] },
      { date: "2025-05-20", entries: [] },
      { date: "2025-05-12", entries: [] },
    ];

    const tree = mapTimelineToTree(input);
    const days = tree[0].months[0].days.map((d) => d.day);
    expect(days).toEqual([5, 12, 20]);
  });

  it("attaches the full date string to each TreeDay", () => {
    const input: DayListing[] = [
      { date: "2025-05-27", entries: [] },
    ];

    const tree = mapTimelineToTree(input);
    expect(tree[0].months[0].days[0].date).toBe("2025-05-27");
  });

  it("uses correct English month names", () => {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const expected = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    for (let i = 0; i < months.length; i++) {
      const date = `2025-${String(months[i]).padStart(2, "0")}-01`;
      const tree = mapTimelineToTree([{ date, entries: [] }]);
      expect(tree[0].months[0].monthName).toBe(expected[i]);
    }
  });

  it("skips entries with invalid date strings", () => {
    const input: DayListing[] = [
      { date: "not-a-date", entries: [] },
      { date: "2025-05-27", entries: [{ id: "a1", title: "Valid", entry_type: "task" }] },
    ];

    const tree = mapTimelineToTree(input);
    expect(tree).toHaveLength(1);
    expect(tree[0].year).toBe(2025);
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
