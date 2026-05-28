## Why

Entries currently hold a single document (`_config.md`). Users need to organise related notes and group them into sub-folders within an entry — enabling richer, hierarchical knowledge management without having to create separate top-level entries.

## What Changes

- Users can create sub-folders inside an existing entry folder
- Users can create notes (markdown files) inside an entry or one of its sub-folders
- The DateTree sidebar expands entries to reveal their sub-folders and notes
- Clicking a note in the tree opens it in the editor
- New Tauri IPC commands handle creating sub-folders and notes under an entry
- `list_timeline` (or a new sibling command) returns entry children so the tree can render them

## Capabilities

### New Capabilities
- `entry-children-io`: Tauri IPC commands for listing, creating, and managing sub-folders and notes inside an entry folder
- `entry-children-ui`: UI interactions for adding sub-folders and notes under an entry (context menu or inline button), and the updated DateTree rendering of entry children

### Modified Capabilities
- `date-tree`: The DateTree component must expand entries to show child sub-folders and notes; entry items become collapsible nodes, not leaf items
- `timeline-io`: `list_timeline` response (or a new `list_entry_children` command) must surface the sub-folder/note structure inside each entry

## Impact

- `src-tauri/src/` — new Tauri commands (`create_entry_subfolder`, `create_entry_note`, `list_entry_children`)
- `src/lib/timeline.ts` — tree types (`EntryMeta`, `TreeDay`, etc.) must accommodate child nodes
- `src/components/DateTree` — entry items become expandable, new sub-folder/note item components added
- `openspec/specs/date-tree/spec.md` — new requirements for entry-level collapse/expand and child rendering
- `openspec/specs/timeline-io/spec.md` — new requirements for `list_entry_children`, `create_entry_subfolder`, `create_entry_note`
