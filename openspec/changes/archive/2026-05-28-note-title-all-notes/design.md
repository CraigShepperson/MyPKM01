## Context

`NotePanel` receives a `title: string` prop from `App.tsx` and internally calls `rename_entry` when the title is edited. `App.tsx` currently passes `selectedEntry?.title ?? ""` for every file selection — the entry's frontmatter title regardless of which file is open. When a sub-note (`meeting-notes.md`, `subfolder/tasks.md`) is selected this is doubly wrong: the displayed title is the parent entry's name, and any edit corrupts the entry's frontmatter instead of renaming the file.

The `parseFilePath` helper in `editorUtils.ts` already extracts `{ date, entryId, filename }` from an absolute path. `NotePanel` uses it today for `rename_entry`. `filename` is the full relative path after the entry directory (e.g. `"notes.md"` or `"sub/tasks.md"`).

## Goals / Non-Goals

**Goals:**
- Sub-notes display their own filename (without `.md`) as the title
- Editing a sub-note's title renames the file on disk
- Entry notes (`_default.md`) continue to work exactly as before
- Logic is contained to `App.tsx` (title derivation) and `NotePanel.tsx` (save dispatch), with a new backend command

**Non-Goals:**
- Updating the DateTree sidebar immediately to reflect the new filename after a rename (a refresh-on-blur is acceptable)
- Validating title characters on the frontend beyond trimming whitespace
- Supporting undo/redo of renames

## Decisions

### 1. Title derivation: done in App.tsx, not NotePanel

`App.tsx` is the right place to compute the title to pass to `NotePanel`, because it already has both the `selectedFilePath` and `selectedEntry`. The rule:

- Parse `selectedFilePath` with `parseFilePath` to get `filename`
- If `filename === "_default.md"` → `title = selectedEntry.title`
- Otherwise → `title` = last path segment of `filename` with `.md` stripped (handles both `"notes.md"` and `"sub/notes.md"`)

**Alternative considered**: Derive title inside `NotePanel`. Rejected — `NotePanel` would need to perform the same parse that `App.tsx` already does, and `EntryMeta.title` is not available there.

### 2. Save dispatch: branched inside NotePanel on filename

`NotePanel` already calls `parseFilePath(filePath)` to get `parsed.filename` for `rename_entry`. It can branch on `parsed.filename === "_default.md"`:

- `_default.md` → `invoke("rename_entry", { date, entryId, title })`
- any other filename → `invoke("rename_note", { date, entryId, oldFilename: parsed.filename, newTitle: trimmed })`

**Alternative considered**: Pass `onSaveTitle` callback from `App.tsx`. Rejected — the debounce timer and cancel logic live in `NotePanel`; pushing the command dispatch out would require lifting that state too. The filename check is a one-liner and doesn't need external knowledge.

### 3. rename_note command: accepts old filename + new title, constructs new filename server-side

`rename_note` accepts `date: String`, `entry_id: String`, `old_filename: String`, `new_title: String`. The backend:

1. Validates `new_title` is non-empty and contains no path separators
2. Constructs `new_filename` by replacing only the final path component of `old_filename` with `new_title + ".md"` (preserving any subfolder prefix, e.g. `"sub/tasks.md"` → `"sub/new-name.md"`)
3. Calls `fs::rename` on the full paths

Passing `new_title` rather than `new_filename` keeps the `.md` extension enforcement on the server side and avoids the frontend needing to re-add it.

**Alternative considered**: Pass `new_filename` directly from the frontend. Rejected — the frontend would need to reconstruct the subfolder prefix and append `.md`, duplicating the path logic already in Rust.

## Risks / Trade-offs

- **Filename collision** → If `new_title + ".md"` already exists in the same directory, `fs::rename` will silently overwrite on most platforms. Mitigation: the backend SHALL check for an existing file at `new_filename` and return `VaultError::InvalidInput` if it already exists (excluding the case where `old_filename == new_filename`).
- **DateTree shows stale name** → After renaming, the tree still shows the old note name until the user triggers a refresh. This is acceptable for v1; the tree can be refreshed in a follow-up.
- **title prop synchronisation** → After `rename_note` succeeds, the `title` prop in `NotePanel` still reflects the old value (it came from `parseFilePath` at selection time). Since `titleValue` is local state and was already updated by the user's typing, this is fine — but if the user switches away and back, the new filename will be computed from `parseFilePath` at re-select time. No stale state issue.
