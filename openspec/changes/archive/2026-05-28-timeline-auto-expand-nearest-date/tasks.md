## 1. Pure Utility Function

- [x] 1.1 Add `findNearestFutureDate(tree: TreeYear[], today: string): { year: number; month: number; date: string } | null` to `src/lib/timeline.ts` — traverse ascending years/months/days and return the first `TreeDay` where `date >= today`; return `null` if none found

## 2. DateTree Initial Expansion

- [x] 2.1 Replace the current auto-expand `useEffect` in `src/components/DateTree.tsx` (lines 61-73) to call `findNearestFutureDate(tree, new Date().toISOString().slice(0, 10))`
- [x] 2.2 When a future date is found, seed `expandedKeys` with three keys: `y:<year>`, `m:<year>-<month>`, and `d:<YYYY-MM-DD>`
- [x] 2.3 When `findNearestFutureDate` returns `null`, fall back to expanding `tree.at(-1)` (most recent year), its last month, and that month's last day using the same three-key pattern

## 3. Tests

- [x] 3.1 Add unit tests for `findNearestFutureDate` in `src/lib/timeline.test.ts` covering: nearest future date returned, today's date treated as future, all-past input returns `null`, empty array returns `null`
- [x] 3.2 Update any existing `DateTree` tests that assert the initial expansion state to reflect the new nearest-future-date behaviour
