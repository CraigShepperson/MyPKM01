## Context

`mapTimelineToTree` (`src/lib/timeline.ts:82`) has two structural problems:

**Accumulation loop (lines 103–129):** Three consecutive `if/else if` branches each inline their own date-string parsing and `isNaN` guard, producing three separate bumps. The file already exports `parseDateString` (line 159) which performs exactly this parsing for all three resolutions and returns `null` on invalid input.

**Output loop (lines 135–151):** A `for (const year of years)` loop contains a `for (const month of monthNums)` loop, building `TreeMonth[]` inline — a second structural bump.

## Goals / Non-Goals

**Goals:**
- Collapse the three accumulation bumps into a single `parseDateString` call + a flat dispatch
- Extract `buildYearNode` to break the nested output loop into two independent passes

**Non-Goals:**
- Changing sort order, type signatures, or exported names
- Refactoring `ensureYear` / `ensureMonth` closures (they're fine as-is)
- Modifying the test suite (tests should pass unchanged)

## Decisions

**Use `parseDateString` directly for the accumulation dispatch**

Replace the three `if (date.length === ...)` blocks with:
```ts
const parsed = parseDateString(date);
if (!parsed) continue;
const { year, month, day } = parsed;
if (day !== undefined) {
  ensureMonth(ensureYear(year), month!).days.push({ day, date, entries });
} else if (month !== undefined) {
  ensureMonth(ensureYear(year), month).entries.push(...entries);
} else {
  ensureYear(year).entries.push(...entries);
}
```
This is one conditional tree (single bump) instead of three separate ones. No new logic — `parseDateString` already handles the `isNaN` guards internally.

Alternatives considered:
- **Inline a `switch` on `date.length`** — still three bumps, no improvement.
- **Extract separate `accumulateListing` helper** — valid but heavier than needed; `parseDateString` already abstracts the hard part.

**Extract `buildYearNode(year, bucket): TreeYear` for the output pass**

The inner month loop becomes a private helper, leaving the outer `years` loop as a simple `.map()` call. The helper is a pure function — no closure dependencies, easy to read in isolation.

Alternatives considered:
- **Leave the nested loops, extract only the month sort** — reduces one bump but doesn't address the nesting depth.

## Risks / Trade-offs

- **`parseDateString` contract** — the helper is already tested and stable; delegating to it removes duplication, not correctness. Risk: near-zero.
- **`month!` non-null assertion** — when `day` is defined, `month` is also defined (by the shape of the date string). The assertion is safe but worth a comment.
- **Existing tests** — 13+ unit tests in `timeline.test.ts` cover all resolutions and edge cases; they are the correctness check for this refactor.
