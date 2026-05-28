## Context

`findEntryInTree` (`src/components/DateTree.tsx:33`) traverses a three-level tree (year → month → day) searching for an `EntryMeta` by id. Each level repeats the same pattern:

```ts
for (const e of <node>.entries) if (e.id === entryId) return e;
```

This appears three times, creating three bumps of nested conditional logic. The function is small (11 lines) but the repetition makes the intent of each line less obvious and creates three places to update if the matching logic ever changes.

## Goals / Non-Goals

**Goals:**
- Extract a private `findInEntries` helper that encapsulates the single-level search
- Replace all three inline bumps with calls to the helper

**Non-Goals:**
- Changing the traversal order or search semantics
- Refactoring the broader `DateTree` component
- Adding tests (function is a pure utility; existing integration tests cover it)

## Decisions

**Use `Array.find()` in the helper, not a manual `for` loop**

`entries.find(e => e.id === id) ?? null` is idiomatic TypeScript and removes the need for a loop+conditional entirely. The return type `EntryMeta | null` matches what callers expect — `Array.find` returns `undefined` on miss, so `?? null` normalises it.

Alternatives considered:
- **Keep `for + if`** — no real advantage; `find` is clearer for a linear scan with a predicate.
- **Single flat search with `flatMap`** — would work but obscures the tree structure and is harder to follow.

**Private module-level function, not a closure or method**

`findInEntries` is a pure utility with no component state dependency. A module-level function (no `export`) matches the style of `findEntryInTree` itself and keeps it easy to unit-test in isolation if needed later.

## Risks / Trade-offs

- **Trivial change, low risk** — both the helper and the call sites are straightforward; no logic changes.
- **TypeScript types** — `EntryMeta[]` is already imported; no new types or imports needed.
