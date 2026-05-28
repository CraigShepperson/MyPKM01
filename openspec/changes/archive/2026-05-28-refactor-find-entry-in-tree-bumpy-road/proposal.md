## Why

`findEntryInTree` in `src/components/DateTree.tsx` contains three identical bumps — an inline `for + if` to match an entry by id — repeated at the year, month, and day levels of the tree. Extracting that repeated pattern into a named helper eliminates the duplication and flattens the nested structure.

## What Changes

- Extract a private helper `findInEntries(entries: EntryMeta[], id: string): EntryMeta | null` using `Array.find()`
- Replace all three inline `for + if` bumps in `findEntryInTree` with calls to the helper
- No behavioural or API changes — the function's signature, return type, and search semantics are identical

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirements in `date-tree` are unchanged; only the internal implementation structure changes.

## Impact

- `src/components/DateTree.tsx` — only file touched
- No prop or event interface changes, no frontend behaviour changes
