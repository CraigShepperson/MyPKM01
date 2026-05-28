# MyPKM

MyPKM is a personal knowledge base built on a single organising principle: time. Not as a metaphor — as the actual architecture. Every note, every document, every decision is anchored to the moment it belongs to. The calendar is not a feature. It is the structure.

> In plotting all of life's happenings on a timeline, you get to line your doing and productivity up with life itself — and as a side effect, most organisational dilemmas are dispensed with.

Notes are stored as plain markdown files in a local vault directory — no cloud, no proprietary format, no lock-in.

## What it does

MyPKM organises notes on a timeline. Each entry lives under a date (year, month, or day resolution) and can contain sub-folders and sub-notes. You open a vault folder on your machine, and the app reads and writes markdown files directly inside it.

**Core features:**

- **Vault management** — choose any local folder as your vault; the app scaffolds a `timeline/` directory and initialises a git repo inside it on first run
- **Timeline tree** — collapsible year/month/day sidebar showing all entries, auto-expanded to the nearest upcoming date
- **Entry CRUD** — create, rename, and delete entries at any planning resolution (day, month, or year)
- **Sub-folders and notes** — nest folders and notes inside any entry
- **BlockNote editor** — rich-text markdown editor with code block syntax highlighting, Mermaid diagram support, and a tldraw whiteboard pane
- **Auto-save** — edits are debounced and persisted to disk after 1 second of inactivity; YAML frontmatter is preserved on every save
- **Editable note titles** — inline H1-style title field above the editor, synced to the file on disk via a `rename_entry` Tauri command
- **Focus today** — one-click button to scroll and expand the timeline to today's date

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri v2 |
| Frontend | React 19, TypeScript, Vite |
| Editor | BlockNote v0.46, CodeMirror 6, tldraw 4 |
| Backend | Rust (serde, walkdir, gray_matter, notify, thiserror) |
| Package manager | pnpm |
| Testing | Vitest, MSW |

## Project structure

```
src/                  React frontend
  components/
    AppShell.tsx      Top-level layout (topbar + left/right panels)
    DateTree.tsx      Timeline sidebar
    editor/           NotePanel, BlockNoteEditor, EditorBoundary
  lib/
    timeline.ts       Pure tree-mapping and date utilities
src-tauri/            Rust backend
  src/
    vault/            VaultManager, vault_init, file-watch IPC
    entries/          Entry CRUD commands
    editor/           read_entry_file, write_entry_file, rename_entry
openspec/             Design specs and archived change history
  specs/              Living specs per capability
  changes/archive/    Completed change proposals and tasks
```

## Getting started

**Prerequisites:** Node.js, pnpm, Rust toolchain, Tauri v2 CLI

```bash
pnpm install
pnpm tauri dev
```

To build a production binary:

```bash
pnpm tauri build
```

On first launch the app will prompt you to choose a vault folder. All notes are stored as plain `.md` files inside `<vault>/timeline/` and can be edited in any text editor alongside the app.
