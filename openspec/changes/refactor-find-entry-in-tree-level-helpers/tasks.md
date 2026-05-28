## 1. Add Per-Level Helpers

- [x] 1.1 Add `function findInMonth(monthNode: TreeMonth, entryId: string): EntryMeta | null` above `findEntryInTree` — searches `monthNode.entries` then iterates `monthNode.days` calling `findInEntries`
- [x] 1.2 Add `function findInYear(yearNode: TreeYear, entryId: string): EntryMeta | null` above `findEntryInTree` — searches `yearNode.entries` then iterates `yearNode.months` calling `findInMonth`

## 2. Rewrite findEntryInTree

- [x] 2.1 Replace the body of `findEntryInTree` with a single loop over `tree` that calls `findInYear` and returns on the first match

## 3. Verify

- [x] 3.1 Run `npx tsc --noEmit` — no type errors
- [ ] 3.2 Smoke-test the app — date tree loads and entry selection works as before
