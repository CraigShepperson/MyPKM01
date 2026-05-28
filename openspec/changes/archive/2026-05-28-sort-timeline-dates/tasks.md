## 1. Update Sort Comparators

- [x] 1.1 In `src/lib/timeline.ts`, change the `years` array sort from `(a, b) => b - a` to `(a, b) => a - b`
- [x] 1.2 In `src/lib/timeline.ts`, change the `monthNums` array sort from `(a, b) => b - a` to `(a, b) => a - b`
- [x] 1.3 In `src/lib/timeline.ts`, change the `treeDays` array sort from `(a, b) => b.day - a.day` to `(a, b) => a.day - b.day`

## 2. Fix Auto-Expand Logic

- [x] 2.1 In `src/components/DateTree.tsx` line 66, change `tree[0]` to `tree.at(-1)` and update the comment to "sorted ascending"
- [x] 2.2 In `src/components/DateTree.tsx` line 69, change `mostRecentYear.months[0]` to `mostRecentYear.months.at(-1)`

## 3. Update Tests

- [x] 3.1 In `src/lib/timeline.test.ts`, update the "groups multiple dates" test: change year order to `tree[0].year === 2024`, `tree[1].year === 2025`, and day order to `days[0].day === 26`, `days[1].day === 27`
- [x] 3.2 In `src/lib/timeline.test.ts`, update the "sorts years descending" test name to "sorts years ascending" and change the expected array from `[2025, 2024, 2023]` to `[2023, 2024, 2025]`
- [x] 3.3 In `src/lib/timeline.test.ts`, update the "sorts months descending within a year" test name to "sorts months ascending within a year" and change expected from `[11, 7, 3]` to `[3, 7, 11]`
- [x] 3.4 In `src/lib/timeline.test.ts`, update the "sorts days descending within a month" test name to "sorts days ascending within a month" and change expected from `[20, 12, 5]` to `[5, 12, 20]`

## 4. Verify

- [x] 4.1 Run `pnpm test` and confirm all timeline tests pass with the updated assertions
