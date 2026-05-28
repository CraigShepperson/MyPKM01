## Why

Timeline entries are currently anchored to a specific day, which forces false precision for events that exist only at a coarse planning horizon. A conference months out, a project milestone for next year — these shouldn't require a placeholder date just to live in the timeline.

## What Changes

- Timeline entries can be anchored to a year (`2027`), a month (`2027-03`), or a specific day (`2027-03-15`)
- Resolution is encoded in the vault folder name and inferred from its shape — no additional metadata required
- A new `move_entry` Tauri command renames an entry's parent folder, changing its resolution and/or date in one step
- The frontend date tree renders year-level and month-level entries floating above their respective month/day lists
- Entry creation and editing both use a single segmented `[Year] [Month?] [Day?]` modal — month and day are optional
- Right-clicking any entry in the tree shows an "Edit date" action that opens the modal

## Capabilities

### New Capabilities

- `planning-resolution`: Coarse-resolution timeline entries anchored to a year or month, with a segmented date picker for creation and editing

### Modified Capabilities

- `timeline-io`: `list_timeline` must recognise `YYYY` and `YYYY-MM` folder names in addition to `YYYY-MM-DD`; new `move_entry` command added
- `date-tree`: Tree data model extended — `TreeYear` gains `entries[]`, `TreeMonth` gains `entries[]`; tree renders coarse entries in the correct position

## Impact

- `src-tauri/src/` — `list_timeline` command updated; `move_entry` command added
- `src/lib/timeline.ts` — `mapTimelineToTree` updated to handle variable-length date strings; `TreeYear` and `TreeMonth` types extended
- `src/components/DateTree.tsx` — renders year-level and month-level entry lists; right-click context menu added
- New modal component for the segmented date picker (shared between creation and edit flows)
