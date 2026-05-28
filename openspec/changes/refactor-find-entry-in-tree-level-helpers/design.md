## Context

After the previous refactor, `findEntryInTree` (`src/components/DateTree.tsx:37`) looks like this:

```ts
function findEntryInTree(tree: TreeYear[], entryId: string): EntryMeta | null {
  for (const yearNode of tree) {
    const found = findInEntries(yearNode.entries, entryId);
    if (found) return found;                          // chunk 1 (for + if)
    for (const monthNode of yearNode.months) {
      const found = findInEntries(monthNode.entries, entryId);
      if (found) return found;                        // chunk 2 (for + for + if)
      for (const dayNode of monthNode.days) {
        const found = findInEntries(dayNode.entries, entryId);
        if (found) return found;                      // chunk 3 (for + for + for + if)
      }
    }
  }
  return null;
}
```

Three separate chunks of nested conditional logic remain. CodeScene flags this because the pattern — multiple bumps inside one function — is unchanged even though the inner `for + if` for entry matching was extracted.

## Goals / Non-Goals

**Goals:**
- Reduce each function to at most one nested conditional chunk
- Make `findEntryInTree` a flat single-level loop with no nesting beyond one `for + if`

**Non-Goals:**
- Changing search semantics, return type, or call sites
- Removing the existing `findInEntries` helper

## Decisions

**Extract `findInMonth` and `findInYear` as private module-level functions**

```
findInEntries  — searches a flat EntryMeta[]
findInMonth    — searches month.entries + iterates days (1 chunk: for + if)
findInYear     — searches year.entries + iterates months via findInMonth (1 chunk: for + if)
findEntryInTree — iterates years via findInYear (1 chunk: for + if)
```

Each function has exactly one `for + if` chunk. No function has multiple chunks. The bumpy road is gone.

The helpers are private (no `export`), module-level (not closures), and follow the same pattern as the existing `findInEntries`. No new types or imports are needed — `TreeMonth`, `TreeYear`, and `EntryMeta` are already imported.

Alternatives considered:
- **Single-function `reduce`/`flatMap` approach** — eliminates bumps but produces hard-to-read chained expressions with multiple `?? null` escapes. Not idiomatic for a performance-sensitive search path.
- **Stop at `findInYear` only** — leaves `findInYear` with two chunks (year entries check + month loop). Still bumpy.

## Risks / Trade-offs

- **Three extra private functions** — small addition to the file; each is 5–7 lines and clearly named. The readability gain outweighs the line count.
- **No behavioural change** — existing integration tests cover correctness without modification.
