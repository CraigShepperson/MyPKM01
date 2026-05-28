## 1. Extract Helper Function

- [x] 1.1 Add `function findInEntries(entries: EntryMeta[], id: string): EntryMeta | null` above `findEntryInTree` in `DateTree.tsx`
- [x] 1.2 Implement using `entries.find(e => e.id === id) ?? null`

## 2. Refactor findEntryInTree

- [x] 2.1 Replace the year-level inline `for + if` bump with `findInEntries(yearNode.entries, entryId)`
- [x] 2.2 Replace the month-level inline `for + if` bump with `findInEntries(monthNode.entries, entryId)`
- [x] 2.3 Replace the day-level inline `for + if` bump with `findInEntries(dayNode.entries, entryId)`

## 3. Verify

- [x] 3.1 Run `npm run typecheck` (or equivalent) — no type errors
- [ ] 3.2 Smoke-test the app — date tree loads and entry selection works as before
