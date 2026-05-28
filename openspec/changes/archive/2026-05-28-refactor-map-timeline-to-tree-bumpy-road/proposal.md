## Why

`mapTimelineToTree` in `src/lib/timeline.ts` has four Bumpy Road code smells: three inline parse-and-guard blocks for year/month/day date strings, and a nested year/month output loop. The file already exports `parseDateString` that duplicates that parsing logic exactly, making the three accumulation bumps straightforwardly removable, and the output loop is easily extracted into a named helper.

## What Changes

- Replace the three inline `if (date.length === ...)` parse-and-guard blocks with a single call to the existing `parseDateString`, routing the result to the correct bucket
- Extract `buildYearNode(year: number, bucket: YearBucket): TreeYear` to flatten the nested year/month output loop
- No behavioural or API changes — inputs, outputs, sort order, and edge-case handling are identical

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirements in `date-tree` are unchanged; only the internal implementation structure changes.

## Impact

- `src/lib/timeline.ts` — only file touched
- No changes to exported types or function signatures
- Existing unit tests in `src/lib/timeline.test.ts` cover correctness and are expected to continue passing unchanged
