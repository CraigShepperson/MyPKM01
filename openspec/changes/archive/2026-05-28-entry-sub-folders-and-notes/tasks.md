## 1. Backend — Types and EntryMeta update

- [x] 1.1 Add `has_children: bool` field to the `EntryMeta` struct in `src-tauri/src/`; derive `Serialize`
- [x] 1.2 Update `list_timeline` handler to compute `has_children` for each entry by reading the entry folder and checking for non-underscore `.md` files or sub-directories
- [x] 1.3 Define serialisable structs `EntryNote`, `EntrySubfolder`, and `EntryChildrenListing` with `Serialize` derives

## 2. Backend — New Tauri commands

- [x] 2.1 Implement `list_entry_children(date, entry_id)` command — returns `EntryChildrenListing` excluding `_`-prefixed files; results sorted alphabetically
- [x] 2.2 Implement `create_entry_subfolder(date, entry_id, name)` command — validates no path separators or `_` prefix, idempotent if folder exists
- [x] 2.3 Implement `create_entry_note(date, entry_id, filename, subfolder)` command — validates `.md` extension, no path separators, rejects duplicates
- [x] 2.4 Register all three new commands in the Tauri app builder (`tauri::Builder::invoke_handler`)

## 3. Frontend — Type updates

- [x] 3.1 Add `has_children: boolean` to the `EntryMeta` TypeScript interface (wherever it is declared, e.g. `src/lib/timeline.ts` or a types file)
- [x] 3.2 Add TypeScript interfaces `EntryNote`, `EntrySubfolder`, and `EntryChildrenListing` matching the backend structs

## 4. DateTree — Entry expand/collapse

- [x] 4.1 Add `expandedEntries: Set<string>` state to `DateTree` to track which entry IDs are expanded
- [x] 4.2 Add `entryChildren: Map<string, EntryChildrenListing>` state to cache loaded children by entry ID
- [x] 4.3 Render an expand/collapse toggle on entry items where `has_children === true`; leaf entries (false) render unchanged
- [x] 4.4 On toggle open: call `invoke('list_entry_children', { date, entryId })`, store result in `entryChildren` map, add entryId to `expandedEntries`
- [x] 4.5 On toggle close: remove entryId from `expandedEntries` (keep cached children so re-open is instant)
- [x] 4.6 Clear `entryChildren` cache whenever `list_timeline` is re-invoked (window focus, `refreshKey` change)

## 5. DateTree — Render entry children

- [x] 5.1 When an entry is expanded, render its direct notes (from `entryChildren`) as clickable leaf items below the entry row
- [x] 5.2 When a note item is clicked, call `onSelect` with `{vaultRoot}/timeline/{date}/{entryId}/{filename}`
- [x] 5.3 Render sub-folder nodes from `entryChildren.subfolders` as collapsible rows below direct notes
- [x] 5.4 Add `expandedSubfolders: Set<string>` state (keyed by `{entryId}:{subfolderName}`) for sub-folder collapse/expand
- [x] 5.5 When a sub-folder is expanded, render its notes as leaf items
- [x] 5.6 When a sub-folder note item is clicked, call `onSelect` with `{vaultRoot}/timeline/{date}/{entryId}/{subfolderName}/{filename}`

## 6. DateTree — Add child UI

- [x] 6.1 Add a hover-visible `+` icon button to each entry item row; button is hidden when entry is not hovered
- [x] 6.2 Clicking the `+` button opens an inline menu with "New folder" and "New note" options
- [x] 6.3 "New folder": render an inline text input below the entry row; on confirm (Enter / blur with non-empty value) call `create_entry_subfolder`, then re-fetch children via `list_entry_children` and expand the entry
- [x] 6.4 "New note" (from entry): render an inline text input; on confirm append `.md` if missing, call `create_entry_note` with `subfolder: null`, then re-fetch and expand
- [x] 6.5 Add a hover-visible `+` button to each sub-folder node; clicking it shows only "New note"
- [x] 6.6 "New note" (from sub-folder): same inline input flow, call `create_entry_note` with the sub-folder name; re-fetch children on success
- [x] 6.7 Pressing Escape on any inline input dismisses it without invoking any command

## 7. Editor — Sub-folder note path parsing

- [x] 7.1 Update the `filePath` parsing logic in `BlockNoteEditor` so that after stripping `{vaultRoot}/timeline/`, the first segment is `date`, the second is `entryId`, and everything after `{entryId}/` is used as `filename` (supports both `"note.md"` and `"subfolder/note.md"`)
- [x] 7.2 Verify that auto-save (`write_entry_file`) also derives `filename` using the updated parsing so sub-folder notes are written back correctly
