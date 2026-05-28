## Context

`DateTree` renders three tiers of clickable rows: entry rows (opening `_default.md`), direct note items (`NoteItem`), and sub-folder note items (also `NoteItem` inside `SubfolderNode`). All three call the `onSelect` prop when clicked. `App.tsx` tracks the currently open file as `selectedFilePath` state but never passes it back to `DateTree`, so the tree has no way to know which row is active.

## Goals / Non-Goals

**Goals:**
- A single `selectedFilePath` prop on `DateTree` drives a visual highlight on whichever row matches the currently open file.
- The highlight covers all three row types: entry rows, direct notes, sub-folder notes.

**Non-Goals:**
- Keyboard navigation or focus management changes.
- Scroll-to-selected behaviour (separate feature if needed).
- Highlighting year/month/day tree headers.

## Decisions

### Pass `selectedFilePath` as a prop, not via context

`DateTree` is a single-file component; all sub-components (`NoteItem`, `SubfolderNode`, the entry row render block) live in the same file. Prop drilling one extra `string | undefined` down two levels is simpler than introducing a React context for this single value.

**Alternative considered:** React context — adds boilerplate and indirection not justified by the depth here.

### Derive the highlight from path equality, not from a separate ID

Each row already computes the path it would pass to `onSelect`. Comparing that computed path to `selectedFilePath` is the most direct approach and avoids introducing a secondary selection-ID state.

**Alternative considered:** Track a selected `entryId` + `filename` pair — requires decomposing the path in two places and staying in sync with `onSelect`'s path construction logic.

### Apply highlight with a single Tailwind class swap on the row button

Entry rows, `NoteItem`, and `SubfolderNode` note buttons already have a `hover:bg-muted/60` class. The active state uses `bg-muted` (solid, not hover-dependent) so it persists visibly regardless of hover state.

**Alternative considered:** A coloured left border — slightly more prominent but harder to align across the three different indent levels; the background swap is simpler and consistent.

## Risks / Trade-offs

- **Path format mismatch** — `selectedFilePath` from App.tsx may use OS-native separators (backslashes on Windows) while paths constructed inside `DateTree` use forward slashes (via template literals). → Normalise both to forward slashes before comparing, or use `===` only after verifying the path construction is consistent end-to-end.

## Migration Plan

Frontend-only change. No backend commands affected. No migration required; adding a new optional prop is backwards-compatible.
