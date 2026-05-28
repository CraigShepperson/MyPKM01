## 1. Date helpers

- [x] 1.1 Implement `getToday(): string` — returns today's local date as `YYYY-MM-DD` using zero-padded template string (not `toISOString`)
- [x] 1.2 Implement `getTomorrow(): string` — returns today + 1 day as `YYYY-MM-DD`
- [x] 1.3 Implement `getNextMonday(): string` — returns the Monday of the next calendar week; if today is Monday, returns the Monday 7 days ahead. Formula: advance by `(8 - date.getDay()) % 7 || 7` days
- [x] 1.4 Add unit tests for all three helpers covering: mid-week day, Friday (crosses month), Sunday, and Monday (must skip to following Monday)

## 2. Context menu — quick-move actions

- [x] 2.1 Add "Move to Today" button to the entry context menu in `DateTree`, above the existing "Move To…" item
- [x] 2.2 Add "Move to Tomorrow" button to the context menu
- [x] 2.3 Add "Move to Next Monday" button to the context menu
- [x] 2.4 Add a visual divider between the three quick-move items and the "Move To…" item
- [x] 2.5 Wire each quick-move button to call `move_entry` with the entry's `id`, `from_date`, and the computed target date, then close the context menu
- [x] 2.6 On successful `move_entry`, re-invoke `list_timeline` and refresh the tree (same pattern as existing "Move To…" confirm handler)
- [x] 2.7 Verify the context menu closes immediately on quick-move selection (before the async `move_entry` resolves)
