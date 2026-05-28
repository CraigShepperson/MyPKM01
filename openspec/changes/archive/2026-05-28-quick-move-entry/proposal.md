## Why

Moving entries to common relative dates (today, tomorrow, or next week) is a frequent action that currently requires opening the "Move To…" modal and manually typing a date. Quick-move shortcuts eliminate that friction for the most common scheduling adjustments.

## What Changes

- Add three new context menu items to entry rows in `DateTree`: **Move to Today**, **Move to Tomorrow**, **Move to Next Monday**
- Each item computes the target `YYYY-MM-DD` date client-side and calls `move_entry` directly — no modal required
- "Move to Next Monday" resolves to the Monday of the next calendar week (ISO week, always a future date)
- The existing "Move To…" modal action is preserved as-is

## Capabilities

### New Capabilities

_(none — this change extends existing behaviour only)_

### Modified Capabilities

- `date-tree`: New quick-move context menu actions on entry items that invoke `move_entry` with a pre-computed target date

## Impact

- `src/components/DateTree.tsx` — context menu additions and date computation logic
- No backend changes required; `move_entry` Tauri command already handles all cases
- No new dependencies — date arithmetic uses native `Date` APIs only
