## Why

There is currently no way to remove an entry from the vault — only move it to another date. Deletion is a basic data management operation needed to keep the timeline clean.

## What Changes

- Add a `delete_entry` Tauri command (Rust) that removes an entry directory (`{vaultRoot}/timeline/{date}/{entry_id}/`) from disk and cleans up the empty date directory if no other entries remain
- Add a "Delete" option to the existing right-click context menu in `DateTree`
- Show a native confirmation dialog before deletion (using `@tauri-apps/plugin-dialog`, already a dependency) so the user cannot accidentally delete an entry
- Refresh the `DateTree` after successful deletion

## Capabilities

### New Capabilities

- `entry-deletion`: Backend command and frontend context menu action to permanently delete a timeline entry

### Modified Capabilities

_(none — the context menu is implementation detail, not currently in the date-tree spec)_

## Impact

- `src-tauri/src/vault/timeline.rs` — new `delete_entry_impl` function and `delete_entry` Tauri command
- `src-tauri/src/lib.rs` — register `delete_entry` in `invoke_handler`
- `src/components/DateTree.tsx` — add "Delete" item to context menu; call `invoke("delete_entry", ...)` with confirmation gate
