## Why

A prior refactor of `findEntryInTree` extracted `findInEntries` but left the Bumpy Road unresolved: the function still contains three separate `for + if` chunks at year, month, and day nesting depths. CodeScene continues to flag it because the structure — multiple chunks of nested conditional logic inside one function — is unchanged. Per-level helpers are needed to distribute the traversal so each function has at most one nested chunk.

## What Changes

- Add private helper `findInMonth(monthNode: TreeMonth, entryId: string): EntryMeta | null` — searches month entries then iterates day nodes
- Add private helper `findInYear(yearNode: TreeYear, entryId: string): EntryMeta | null` — searches year entries then delegates month search to `findInMonth`
- Rewrite `findEntryInTree` body to iterate years and delegate to `findInYear`, leaving it with a single `for + if` chunk (no longer bumpy)
- No behavioural or API changes — inputs, outputs, and search semantics are identical

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirements in `date-tree` are unchanged; only the internal implementation structure changes.

## Impact

- `src/components/DateTree.tsx` — only file touched
- No prop, event, or type interface changes
