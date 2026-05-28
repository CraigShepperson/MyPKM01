## 1. Rust backend — delete_entry command

- [x] 1.1 Add `delete_entry_impl(vault_root: &Path, entry_id: &str, date: &str) -> Result<(), VaultError>` to `src-tauri/src/vault/timeline.rs` — uses `fs::remove_dir_all` then best-effort `fs::remove_dir` on the date directory if empty
- [x] 1.2 Add `#[tauri::command] pub fn delete_entry(state, entry_id, date) -> Result<(), String>` to `src-tauri/src/vault/timeline.rs` following the same shape as `move_entry`
- [x] 1.3 Register `delete_entry` in `invoke_handler!` in `src-tauri/src/lib.rs` and add it to the `use vault::{...}` import
- [x] 1.4 Add unit tests for `delete_entry_impl` in `timeline.rs`: entry deleted, date dir cleaned up when empty, date dir preserved when non-empty, error on missing entry

## 2. Frontend — context menu Delete action

- [x] 2.1 Import `confirm` from `@tauri-apps/plugin-dialog` in `src/components/DateTree.tsx`
- [x] 2.2 Add `handleDelete` async function: calls `confirm(...)` with the entry title and "This cannot be undone.", then invokes `delete_entry` and calls `fetchTree()` on success; logs errors to `console.error`
- [x] 2.3 Add a "Delete" `<button>` to the context menu in `DateTree`, below a `<div className="my-1 border-t border-border" />` divider, styled with a destructive text colour (e.g. `text-red-500 hover:text-red-600`) to distinguish it from move actions
- [x] 2.4 Wire the Delete button's `onClick` to `handleDelete(contextMenu.entry, contextMenu.date)`
