## Why

The timeline tree currently displays dates newest-first (descending), which makes it harder to read chronological history as a natural forward progression. Sorting ascending aligns with how timelines are conventionally read — oldest at the top, newest at the bottom.

## What Changes

- `mapTimelineToTree` sort order changes from descending to ascending for years, months, and days within months.
- The auto-expand rule ("most recent year and month expanded on load") is updated to expand the **last** (highest) year and its last month, since ascending order places the most recent entries at the bottom.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `date-tree`: Sort order for years, months, and days changes from descending to ascending. The auto-expand-on-load rule must reference the correct node (last/highest) under the new ordering.

## Impact

- `src/lib/timeline.ts` — three sort comparators in `mapTimelineToTree` change from `b - a` to `a - b`
- `openspec/specs/date-tree/spec.md` — requirement text and scenarios updated to reflect ascending order and corrected auto-expand behaviour
- No backend changes; `list_timeline` returns unordered data and sorting is purely a frontend concern
