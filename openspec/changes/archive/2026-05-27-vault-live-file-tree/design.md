## Context

The app shell, vault onboarding, and editor scaffold are all in place. `App.tsx` already holds `vaultPath` state and passes panel slots to `AppShell`. `BlockNoteEditor` mounts with empty content and no file-loading mechanism. The backend has `VaultManager` with `VaultState` managed state, `walkdir` and `gray_matter` in `Cargo.toml`, and no commands for reading vault content yet.

The vault stores entries as:
```
timeline/
  YYYY-MM-DD/
    <unique-id>/
      _config.md    ← YAML frontmatter: title, type (meeting|event|task)
      <other files>
```

The tree must display: **year → month → day → entries**. The vault format (flat `YYYY-MM-DD` folder names) must be mapped to this grouped display structure.

## Goals / Non-Goals

**Goals:**
- Backend commands to traverse `timeline/` and return structured entry listings
- Parse `_config.md` frontmatter in Rust to extract `title` and `type` per entry
- Frontend `mapTimelineToTree` pure function that groups `YYYY-MM-DD` dates into year/month/day display nodes
- `DateTree` component rendering collapsible year → month → day → entries hierarchy
- Selection state wired from `DateTree` through `App` to `BlockNoteEditor`
- Editor loads `_config.md` content when an entry is selected
- Refetch on window focus so manually-created folders appear without a restart

**Non-Goals:**
- File-system watcher (`notify`) — deferred to a future change
- In-editor saving / write-back — `write_entry_file` is scaffolded but not triggered by the editor yet
- Browsing files within an entry folder — only `_config.md` is opened in this change
- Theme adapter / formatting toolbar for BlockNote — separate concern
- Creating new entries from the UI

## Decisions

### 1. Frontmatter parsing happens in Rust, not the frontend
`gray_matter` is already in `Cargo.toml`. Architecture principle: no business logic in the frontend. The backend returns typed `EntryMeta { id, title, entry_type }` structs — the frontend never sees raw YAML.

*Alternatives considered:* Parse frontmatter in TypeScript on the raw file string. Rejected — duplicates logic, puts business logic in the frontend, and requires a JS YAML parser dependency.

### 2. Backend returns a flat `Vec<DayListing>`, frontend groups into the tree
The backend command `list_timeline` returns:
```json
[
  {
    "date": "2025-05-27",
    "entries": [
      { "id": "abc123", "title": "Standup", "entry_type": "meeting" },
      { "id": "def456", "title": "Review PR", "entry_type": "task" }
    ]
  }
]
```
A pure frontend function `mapTimelineToTree` groups this into `{ year, months: [{ month, monthName, days: [{ day, entries }] }] }[]`.

*Alternatives considered:* Return a fully nested tree from the backend. Rejected — the display grouping (year/month labels, sort order, localised month names) is presentation logic. Keeping the backend response flat makes it easier to test and reuse.

### 3. `mapTimelineToTree` is a standalone pure function
Placed in `src/lib/timeline.ts`. Takes `DayListing[]`, returns `TreeYear[]`. No side effects, fully unit-testable with Vitest. Sorts years and months descending (newest first), days descending within a month.

### 4. Selection state lives in `App.tsx`
`App` holds `selectedFilePath: string | null`. `DateTree` calls an `onSelect(path: string)` callback; `BlockNoteEditor` receives `filePath` as a prop. This keeps state co-located at the lowest common ancestor without adding a context or global store.

*Alternatives considered:* React context or Zustand. Rejected — premature for two sibling components sharing one string.

### 5. Editor loads markdown via `tryParseMarkdownToBlocks`
When `filePath` changes, the editor calls `invoke('read_entry_file', ...)`, then uses BlockNote's `editor.tryParseMarkdownToBlocks(content)` followed by `editor.replaceBlocks(editor.document, blocks)` to populate the editor. The `_config.md` body (below frontmatter) is passed as the content string; the backend strips frontmatter before returning, leaving only the markdown body.

*Alternatives considered:* Show raw markdown in a CodeMirror view. Rejected — BlockNote is the designated editor; switching based on content type is a future concern.

### 6. Vault timeline module added to the existing `vault` crate module
New file: `src-tauri/src/vault/timeline.rs`, exported via `vault/mod.rs`. Commands `list_timeline` and `read_entry_file` are added alongside `vault_init` and `get_vault_path` in `lib.rs`.

### 7. Refetch on window `focus` event
`DateTree` subscribes to `window.addEventListener('focus', refetch)` on mount. This covers the acceptance criterion (manually create a folder, alt-tab back, tree updates) without a file watcher.

## Risks / Trade-offs

- **Malformed `_config.md`** — gray_matter parse failure: entry falls back to `{ title: entry_id, entry_type: "unknown" }` rather than crashing. The tree still shows the entry; it just has a generic label.

- **`tryParseMarkdownToBlocks` may not handle all markdown** — BlockNote's markdown import is a best-effort conversion. Frontmatter-stripped `_config.md` files with unusual YAML-adjacent syntax could render oddly. Mitigation: the editor is read-only for this change; visual quirks are acceptable.

- **Large vaults with many entries** — `list_timeline` walks the full tree on every focus. For typical PKM use (hundreds of entries) this is fine. Mitigation: deferred — the `notify` watcher will replace the polling approach in a future change.

- **`entry_type` values not in `{meeting, event, task}`** — display falls back to the raw string. No crash.

## Migration Plan

1. Add `timeline.rs` module to backend; export new commands; register in `tauri::Builder`.
2. Add `src/lib/timeline.ts` with types and `mapTimelineToTree`.
3. Add `DateTree` component; wire into `AppShell` left panel via `App.tsx`.
4. Modify `BlockNoteEditor` to accept and react to `filePath` prop.
5. Smoke-test: create a `YYYY-MM-DD/<id>/` folder with a `_config.md` in the vault, focus the app, confirm the entry appears in the tree and clicking it loads `_config.md` content into the editor.

No migrations, no schema changes, no breaking changes to existing commands.

## Open Questions

- Should `_config.md` frontmatter fields use a fixed schema (enforced by the backend) or be treated as arbitrary YAML? For this change, only `title` and `type` are read; all other keys are ignored.
- Month labels in the tree: English month names hard-coded for now. Full i18n (via the existing `src/lib/i18n.ts` locale system) is deferred.
