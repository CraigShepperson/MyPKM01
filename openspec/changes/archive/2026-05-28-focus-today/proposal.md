## Why

After navigating through the tree or scrolling away, there is no way to quickly return focus to today's date. A "Today" button in the topbar gives a one-click shortcut back to the current date's position in the timeline.

## What Changes

- Add a "Today" text button to the topbar, placed to the left of the existing `+` button
- Clicking it re-runs the expand-to-nearest-future-date logic in `DateTree`, expanding the year/month/day path to the nearest future date (or today if present) and collapsing everything else
- `DateTree` gains a `focusTodayKey` prop (same counter pattern as `refreshKey`) that triggers the re-expansion when incremented; the initial-expansion guard is reset so the logic always fires
- `App.tsx` adds `focusTodayKey` state and wires the "Today" button to increment it; both topbar buttons are wrapped in a `flex gap-2` container inside `topbarContent`

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `date-tree`: `DateTree` accepts a `focusTodayKey` prop that re-runs the nearest-future-date expansion logic (and resets the initial-load guard) whenever the value changes

## Impact

- `src/components/DateTree.tsx` — add `focusTodayKey?: number` prop; add `useEffect` that resets `hasSetInitialExpansion` and calls the expand-to-today logic when `focusTodayKey` changes
- `src/App.tsx` — add `focusTodayKey` state; wrap topbar buttons in a `flex` container; pass `focusTodayKey` to `DateTree`
