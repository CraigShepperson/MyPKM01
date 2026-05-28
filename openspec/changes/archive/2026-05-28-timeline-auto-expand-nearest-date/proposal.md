## Why

When the timeline opens it currently highlights the most recent past date, but users primarily want to see what's coming next. Expanding to the nearest future date on load removes the manual navigation step to find upcoming entries.

## What Changes

- The `DateTree` initial expand logic changes: on first render, the year, month, and day nodes that contain the closest future date to today SHALL be expanded; all other nodes SHALL be collapsed.
- If no future dates exist in the tree, the component SHALL fall back to expanding the most recent past year, month, and day.
- Day nodes are now part of the initial expand path (previously only year and month were expanded by default).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `date-tree`: The initial expanded-state requirement changes — instead of expanding the most recent year and month, the tree expands the full year/month/day path to the nearest future date (or nearest past date if no future dates exist).

## Impact

- `src/lib/timeline.ts` — add a pure utility function to find the nearest future `TreeDay` and its ancestor year/month nodes given today's date.
- `DateTree` component — replace the current "highest year/month" initial-state logic with the new nearest-future-date logic.
- Existing unit tests for initial render state in `DateTree` will need updating to reflect the new default expansion behaviour.
