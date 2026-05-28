## Context

Entries currently live at `timeline/{date}/{entry_id}/` and hold a single `_config.md` (body) alongside a `_default.md` (frontmatter). The DateTree renders entry items as leaves — clicking one opens `_config.md` in the editor. There is no mechanism to store multiple notes or organise content within an entry.

This change adds sub-folder and note nodes below entries in the tree, backed by new Tauri IPC commands and lazy child-loading in the DateTree component.

Relevant existing code:
- `src-tauri/src/commands/` — Tauri command handlers
- `src/components/DateTree` — tree component that drives the sidebar
- `src/lib/timeline.ts` — pure mapping functions (`mapTimelineToTree`, etc.)
- `src/components/BlockNoteEditor` — editor that accepts a `filePath` prop

## Goals / Non-Goals

**Goals:**
- Users can create named sub-folders inside any entry
- Users can create named markdown notes directly inside an entry or inside one of its sub-folders
- The DateTree shows sub-folders and notes as child nodes under entries
- Clicking a note opens it in the existing BlockNote editor
- `list_timeline` surfaces `has_children` so the tree can show expand toggles without eagerly loading children

**Non-Goals:**
- Nesting sub-folders more than one level deep (sub-folders inside sub-folders are out of scope)
- Renaming or deleting sub-folders or notes (a separate change)
- Full-text search across notes
- Syncing `has_children` in real time without a window-focus refetch

## Decisions

### 1. Lazy loading of entry children
Children (notes + sub-folders) are fetched only when the user expands an entry, not upfront as part of `list_timeline`.

**Why:** `list_timeline` is called on every window focus. Fetching all children of all entries on every focus would scale poorly for vaults with many entries. Lazy loading keeps `list_timeline` fast and the children payload small.

**Alternative considered:** Embed full child listings in `list_timeline`. Rejected: payload grows unboundedly and the editor only ever shows one entry at a time.

**Cache strategy:** DateTree stores loaded children in a `Map<entryId, EntryChildrenListing>` in component state. The cache is cleared whenever `list_timeline` is re-invoked (window focus, `refreshKey` change) so stale children don't persist after a rename or external file change.

---

### 2. `has_children` computed inline in `list_timeline`
`EntryMeta` gains a `has_children: bool` field, populated by the existing `list_timeline` command while it is already walking each entry folder.

**Why:** The tree needs to know whether to show an expand arrow before the user opens an entry. A second IPC call per entry would mean N+1 requests on every load. Since `list_timeline` already reads each entry folder to parse `_config.md`, the marginal cost of also checking for non-underscore files and sub-directories is minimal.

**Alternative considered:** A separate `batch_has_children` command. Rejected: adds latency and a second network hop with no benefit.

**Implementation note:** In the `list_timeline` Rust handler, after collecting `EntryMeta` from an entry folder, read the directory once more and set `has_children = true` if any entry is a non-underscore `.md` file or a sub-directory.

---

### 3. `read_entry_file` / `write_entry_file` handle sub-path filenames without change
Both commands accept `filename: String` and join it to `vault_root/timeline/{date}/{entry_id}/{filename}`. When `filename` is `"research/notes.md"` the OS path join produces the correct sub-folder path.

**Why:** No command changes needed for read/write of notes — the existing commands are already general enough. This keeps the diff small.

**Risk:** A malicious `filename` containing `../` could escape the entry folder. Mitigation: add a path-traversal guard in `create_entry_note` (validates no path separator in the final `filename` segment) and rely on the existing entry folder structure for read/write.

---

### 4. `BlockNoteEditor` filePath parsing extended to support sub-folder notes
The editor currently parses `filePath` as `{vaultRoot}/timeline/{date}/{entryId}/_config.md` by splitting on the vault root prefix. To open sub-folder notes, parsing is extended: after stripping `{vaultRoot}/timeline/`, the first path segment is `date`, the second is `entryId`, and everything after `{entryId}/` is treated as `filename` (which may be `"note.md"` or `"subfolder/note.md"`). No new IPC commands are needed for reading and writing notes.

---

### 5. Inline text input for naming new folders and notes (no modal)
New folder and note names are entered via an inline text field that appears directly inside the tree (below the entry row) rather than a dialog.

**Why:** Modals interrupt flow and feel heavy for a quick naming action. An inline field keeps the user in the sidebar context and matches how modern file-tree editors (VS Code, Obsidian) behave.

**Alternative considered:** A named prompt in the existing `CreateEntryModal`. Rejected: that modal is for creating entries at the date level, not children within an entry.

---

### 6. Sub-folder nesting capped at one level
Sub-folders can contain notes but not further sub-folders.

**Why:** Unlimited nesting adds recursive UI complexity (indefinite tree depth), recursive Tauri listing, and recursive `EntryChildrenListing` types. One level of nesting covers the primary use case (grouping notes within an entry) without those costs.

## Risks / Trade-offs

- **`list_timeline` latency increase** — each entry folder is now read twice (once for `_config.md` frontmatter, once for `has_children`). For vaults with hundreds of entries, this could add tens of milliseconds. Mitigation: combine both reads into a single `read_dir` pass per entry folder; the OS page cache makes repeated reads cheap.

- **Stale children cache** — if the user adds a note externally (outside the app) and the window never loses focus, the cached children won't update. Mitigation: the window-focus refetch re-invokes `list_timeline` and clears the children cache; `list_entry_children` is re-called on next expand.

- **Path-parsing fragility in BlockNoteEditor** — if the vault root path itself contains `timeline/` as a substring the parser could mis-identify the split point. Mitigation: strip the vaultRoot prefix first (known at runtime), then split the remainder on `/` to extract date and entryId segments.

## Migration Plan

No data migration required. Existing entry folders remain valid — `has_children` will be `false` for all entries until the user adds notes or sub-folders. The new fields are additive to the serialised JSON.

## Open Questions

- Should `list_entry_children` also return notes inside sub-sub-folders if a user manually created deeper nesting outside the app? Current design silently ignores them. Needs a decision before implementing `list_entry_children`.
- What happens when a note filename collides with an existing note after an external rename? `create_entry_note` returns `InvalidInput` on conflict, but the error UI (toast vs inline message) is not yet specified.
