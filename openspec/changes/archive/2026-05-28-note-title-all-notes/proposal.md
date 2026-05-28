## Why

The editable title header currently only works correctly for entry notes (`_default.md`): it shows the entry's frontmatter title and saves via `rename_entry`. When a sub-note (e.g., `meeting-notes.md`) is opened, the panel incorrectly shows the parent entry's title and any edit would corrupt the entry's frontmatter rather than rename the file. Sub-notes need their own title source (the filename) and their own save strategy (file rename).

## What Changes

- `NotePanel` derives the displayed title from the filename (without `.md`) when the selected file is not `_default.md`
- `App.tsx` passes the correct title for both entry notes and sub-notes to `NotePanel`
- Editing the title of a sub-note renames the file on disk via a new `rename_note` Tauri command instead of calling `rename_entry`
- `NotePanel` dispatches to the correct save command based on the file type (`_default.md` vs. other `.md`)

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
- `note-title-editor`: Title source and persistence strategy differ for sub-notes vs entry notes — requirements for load-time title and save behaviour need updating
- `entry-children-io`: Adds a `rename_note` Tauri command that renames a note file within an entry directory

## Impact

- `src/components/editor/NotePanel.tsx` — branched save logic based on filename
- `src/App.tsx` — title passed to `NotePanel` must be derived from filename for sub-notes
- `src-tauri/src/vault/timeline.rs` — new `rename_note_impl` and `rename_note` command
- `src-tauri/src/lib.rs` and `src-tauri/src/vault/mod.rs` — register and export `rename_note`
