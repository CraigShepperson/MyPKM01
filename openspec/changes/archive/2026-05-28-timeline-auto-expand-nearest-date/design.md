## Context

`DateTree` manages expanded state with a `Set<string>` of node keys (`y:<year>`, `m:<year>-<month>`, `d:<YYYY-MM-DD>`). On first data load a `useRef` guard fires once and populates the set with the most recent year and month keys (lines 61-73 of `DateTree.tsx`). Day nodes are never auto-expanded today.

The pure tree utilities live in `src/lib/timeline.ts`; `DateTree.tsx` consumes them. The tree is sorted ascending (oldest → newest), so `tree.at(-1)` is currently "most recent".

## Goals / Non-Goals

**Goals:**
- On first render, expand exactly the year, month, and day nodes that contain the nearest future date (≥ today).
- Fall back to the most recent past year/month/day when no future dates exist.
- Keep the logic pure and unit-testable, separate from component state.

**Non-Goals:**
- Scroll the expanded node into view (a separate UX concern).
- Change expand/collapse behaviour after the initial load.
- Re-run the auto-expand logic on subsequent focus-refetches.

## Decisions

### Add `findNearestFutureDate` to `timeline.ts`

A new pure function `findNearestFutureDate(tree: TreeYear[], today: string): { year: number; month: number; date: string } | null` will be exported from `timeline.ts`. It iterates the ascending-sorted tree and returns the first `TreeDay` whose `date >= today` string (lexicographic comparison is valid for `YYYY-MM-DD`). Returns `null` if no future date exists.

**Alternatives considered:**
- Inline logic in `DateTree` — harder to unit-test; component already complex enough.
- Compute on raw `DayListing[]` before tree conversion — would require a second pass over the data; the tree is already built when the initial-expansion effect runs.

### Accept `today` as a parameter (not `new Date()` internally)

The function signature takes `today: string` (`YYYY-MM-DD`). `DateTree` calls it with `new Date().toISOString().slice(0, 10)`.

This keeps the function pure and trivially testable without mocking the system clock.

### Expand year, month, AND day on initial load

The new behaviour adds a day key to the initial expanded set. Previously only year and month were opened; entries were not visible without a second click. Opening the day node immediately exposes entries for the target date.

### Fallback to most recent past date

When `findNearestFutureDate` returns `null`, the `DateTree` auto-expand effect falls back to `tree.at(-1)` (most recent year), its last month, and that month's last day — the same leaf-level depth as the future-date path.

## Risks / Trade-offs

- **String date comparison assumption** — Lexicographic `>=` on `YYYY-MM-DD` strings is correct but fragile if date formats ever change. Mitigated by the existing pattern of treating `date` as a validated `YYYY-MM-DD` string throughout the codebase.
- **Day node now auto-expanded** — Users with many entries on the target day will see them all on first load. Acceptable given the intent is to surface upcoming entries immediately.
- **Existing tests will need updating** — Unit tests asserting "most recent year/month expanded" will fail and must be updated to the new nearest-future-date expectation.
