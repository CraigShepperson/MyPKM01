## 1. Collapse Accumulation Bumps

- [x] 1.1 Replace the three `if (date.length === ...)` branches in the accumulation loop with a single `parseDateString(date)` call, skipping on `null`
- [x] 1.2 Dispatch the parsed `{ year, month, day }` result to the correct bucket using a single flat conditional (year-only / month / day)

## 2. Extract Output Helper

- [x] 2.1 Add private function `buildYearNode(year: number, bucket: YearBucket): TreeYear` above `mapTimelineToTree`
- [x] 2.2 Implement: sort month keys, map each to a `TreeMonth` with sorted days, return the `TreeYear`
- [x] 2.3 Replace the nested `for (const year of years)` / `for (const month of monthNums)` loops with `years.map(year => buildYearNode(year, yearMap.get(year)!))`

## 3. Verify

- [x] 3.1 Run `npm test` — all existing `mapTimelineToTree` unit tests pass
- [x] 3.2 Run `npx tsc --noEmit` — no type errors
