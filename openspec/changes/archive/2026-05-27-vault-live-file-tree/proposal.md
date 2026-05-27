## Why

The app shell and vault onboarding are in place, but the main window is entirely static — the date tree shows placeholder data and the editor ignores the vault. Users cannot yet interact with their actual notes; real vault data must flow from disk into the UI before the app is usable.

## What Changes

- New backend Tauri commands to traverse `timeline/` and return the structured listing of dates, entries, and their metadata.
- Each date in `timeline/` is a folder (`YYYY-MM-DD/`). Inside each date folder are one or more entry subfolders, each identified by a unique ID. Each entry folder holds a `_config.md` (metadata: type, title, etc.) and zero or more related files.
- The left-panel date tree is replaced with a live component that renders the vault structure as a collapsible **year → month → day → entries** hierarchy. Each entry is labelled from its `_config.md` metadata and badged by type (meeting / event / task).
- The editor is wired to the selection state: clicking an entry in the tree loads its `_config.md` content into the BlockNote editor.
- A "folder created on disk → appears in tree" loop is proven manually (a refetch on window focus is sufficient; the `notify` watcher is in `Cargo.toml` but reserved for a future change).

## Capabilities

### New Capabilities
- `timeline-io`: Tauri commands to list all date folders and their entry subfolders under `timeline/`, and to read/write the content of a file within an entry folder (initially `_config.md`). Vault structure: `timeline/YYYY-MM-DD/<unique-id>/_config.md`.
- `date-tree`: Frontend date-tree component that fetches the timeline listing from the backend, maps the flat `YYYY-MM-DD` folder names to a grouped display structure (year number → month name → day number), renders a collapsible **year → month → day → entries** hierarchy (entries labelled and typed from `_config.md` metadata), and emits a selection event when an entry is clicked. The mapping layer is a pure function so it can be unit-tested independently of the tree UI.

### Modified Capabilities
- `editor-layer`: The editor now accepts a file path and loads the markdown content of the selected entry's `_config.md` on mount and on path change; previously the editor was seeded with empty content only.

## Impact

- **Backend**: `src-tauri/src/` — new command handlers for `list_timeline`, `read_entry_file`, `write_entry_file`; registered in `tauri::Builder`. Uses `walkdir` (already declared).
- **Frontend**: left-panel component replaced or extended; new `DateTree` component; a `mapTimelineToTree` pure function transforms the flat `YYYY-MM-DD` vault format into the grouped year/month/day display structure; `App` or layout component wires selection state between tree and editor.
- **Editor**: `editor-layer` spec gains a requirement for file-path-driven content loading.
- **No new dependencies** expected — `walkdir` is already declared in `Cargo.toml`; BlockNote already mounted.
