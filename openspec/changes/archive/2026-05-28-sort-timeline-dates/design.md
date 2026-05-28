## Context

`mapTimelineToTree` in `src/lib/timeline.ts` currently sorts years, months, and days descending (`b - a`). The `DateTree` component relies on `result[0]` being the most recent year when deciding which node to auto-expand on load. Flipping to ascending order means the most recent year moves to the end of the array, so the auto-expand logic must be updated alongside the sort.

## Goals / Non-Goals

**Goals:**
- Years, months, and days render oldest-first in the date tree
- Auto-expand on load still opens the most recent year and its most recent month

**Non-Goals:**
- Changing the backend `list_timeline` command (it returns unordered data; sorting is purely frontend)
- Changing any entry ordering within a day (entries have no timestamp, only a folder name)

## Decisions

### 1. Flip sort comparators in `mapTimelineToTree`

Change the three `.sort()` calls from `(a, b) => b - a` to `(a, b) => a - b`:
- `years` array sort
- `monthNums` array sort within each year
- `treeDays` array sort within each month

**Alternative considered:** Sort at the component render layer instead of in the utility function. Rejected — the utility is the single source of truth for tree shape; sorting there keeps the component and tests simple.

### 2. Update auto-expand to use max value, not first index

The `DateTree` component's initial-expand logic currently reads `result[0]` (first = newest under descending). Under ascending order, `result[0]` becomes the oldest year.

Fix: derive the most-recent year by finding the node with the highest `.year` value (e.g. `result.at(-1)` after ascending sort, or `Math.max`). Same for the month within that year.

Using `result.at(-1)` is idiomatic and safe since the ascending sort guarantees the last element is the highest year.

## Risks / Trade-offs

- **Existing snapshots/tests:** Any test that asserts on array ordering will fail and must be updated. The `mapTimelineToTree` unit tests in `src/lib/timeline.test.ts` explicitly assert descending order — these are expected failures that confirm the change is working.
- **User habit:** Users accustomed to newest-first may need to scroll down to find recent entries. This is the intended behaviour change per the proposal.

## Migration Plan

1. Update `mapTimelineToTree` sort comparators (pure logic change, no data migration needed)
2. Update `DateTree` auto-expand to use `result.at(-1)` instead of `result[0]`
3. Update `date-tree` spec and tests to reflect ascending order
4. No deployment steps required — frontend-only change, ships with the next build
