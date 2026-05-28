## 1. Backend: rename_note Tauri command

- [x] 1.1 Add `rename_note_impl(vault_root, date, entry_id, old_filename, new_title)` to `src-tauri/src/vault/timeline.rs` — validates `new_title` (non-empty, no path separators), constructs `new_filename` by replacing the last segment of `old_filename` with `new_title.trim() + ".md"`, checks for collision (return `InvalidInput` if target exists and differs from source), then calls `fs::rename`
- [x] 1.2 Add `#[tauri::command] pub fn rename_note(...)` to `src-tauri/src/vault/timeline.rs` that resolves vault root from state and delegates to `rename_note_impl`
- [x] 1.3 Export `rename_note` from `src-tauri/src/vault/mod.rs`
- [x] 1.4 Add `rename_note` to the `use vault::{ ... }` import list and `invoke_handler` in `src-tauri/src/lib.rs`

## 2. App.tsx: title derivation for sub-notes

- [x] 2.1 Import `parseFilePath` from `./components/editor/editorUtils` in `App.tsx`
- [x] 2.2 Replace the `title={selectedEntry?.title ?? ""}` prop on `NotePanel` with a computed value: use `selectedEntry?.title ?? ""` when `parseFilePath(selectedFilePath).filename === "_default.md"`, otherwise use the last segment of `filename` with `.md` stripped

## 3. NotePanel: branched save dispatch

- [x] 3.1 In `NotePanel.tsx`'s `handleTitleChange` debounce callback, branch on `parsed.filename === "_default.md"`: keep the existing `invoke("rename_entry", ...)` call for entry notes, and add `invoke("rename_note", { date, entryId, oldFilename: parsed.filename, newTitle: trimmed })` for all other filenames
