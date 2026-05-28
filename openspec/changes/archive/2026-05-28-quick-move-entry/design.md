## Context

The `DateTree` context menu currently has a single "Move To…" action that opens the `ResolutionDatePicker` modal. Users frequently move entries to common relative dates (today, tomorrow, next Monday) and the modal adds unnecessary steps for these cases. The `move_entry` Tauri command already handles all moves; this change is purely frontend.

## Goals / Non-Goals

**Goals:**
- Add "Move to Today", "Move to Tomorrow", "Move to Next Monday" as context menu items above "Move To…"
- Each fires `move_entry` immediately with a pre-computed `YYYY-MM-DD` string — no modal
- "Next Monday" is always a future date (next calendar week's Monday, never today even if today is Monday)

**Non-Goals:**
- No backend changes
- No new relative-date shortcuts beyond the three listed
- No changes to the existing "Move To…" modal flow

## Decisions

### Date computation in the component

Native `Date` arithmetic is used directly in `DateTree` — no date library. The three helpers are:

- **Today**: `new Date()` formatted as `YYYY-MM-DD` in local time
- **Tomorrow**: today + 1 day
- **Next Monday**: find the Monday of the week after the current week. Algorithm: advance from today by `(8 - today.getDay()) % 7 || 7` days, ensuring the result is always at least 1 day ahead and always a Monday. Simpler alternative (just `+7 days`) was rejected because it does not guarantee a Monday.

Formatting uses a simple zero-padded template string rather than `toISOString()` (which returns UTC and can produce the wrong date for users in negative UTC offsets).

### Menu placement

The three quick-move items appear as a group directly above the existing "Move To…" item, separated by a thin divider. This keeps related actions together and preserves discoverability of the modal for arbitrary dates.

## Risks / Trade-offs

- **Local time dependency**: Date arithmetic is in the user's local timezone. This is correct for a personal PKM — entries live on a local filesystem.
- **No undo**: Quick-move fires immediately without confirmation. Given `move_entry` is already used this way in the existing flow and entries are local files, this is acceptable. A future undo stack could address this generically.

## Migration Plan

Frontend-only change. No data migrations or deploy steps required.
