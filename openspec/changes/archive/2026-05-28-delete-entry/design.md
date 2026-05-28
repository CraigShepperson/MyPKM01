## Context

Entries live on disk at `{vaultRoot}/timeline/{date}/{entry_id}/`. The existing `move_entry_impl` shows the established pattern: operate on the directory, then best-effort remove the now-empty date directory. Delete follows the same shape but uses `fs::remove_dir_all` instead of `fs::rename`.

The frontend context menu already exists in `DateTree` and handles async Tauri `invoke` calls for move operations. The `@tauri-apps/plugin-dialog` plugin is already registered (`tauri_plugin_dialog::init()` in `lib.rs`) and available for showing a native confirm dialog.

## Goals / Non-Goals

**Goals:**
- Permanently remove an entry directory from disk
- Clean up the date directory if it becomes empty after deletion
- Require explicit user confirmation before deletion (native dialog)
- Refresh `DateTree` after successful deletion

**Non-Goals:**
- Soft delete / recycle bin / undo
- Batch deletion of multiple entries
- Deleting from anywhere other than the context menu

## Decisions

### 1. `fs::remove_dir_all` for deletion, same cleanup pattern as `move_entry_impl`

The entry directory contains only `_default.md` (and potentially other files). `remove_dir_all` handles this cleanly. After deletion the date directory is cleaned up with the same best-effort `remove_dir` logic already used by `move_entry_impl`.

*Alternative considered:* Removing only `_default.md` and leaving the directory. Rejected — orphan directories would pollute `list_timeline` results.

### 2. Native confirm dialog via `@tauri-apps/plugin-dialog` on the frontend

The dialog plugin is already initialised. Calling `confirm("Delete \"<title>\"? This cannot be undone.")` from the frontend before invoking `delete_entry` keeps the Rust command simple (no dialog logic in Rust) and matches the pattern for other destructive confirmation flows in desktop apps.

*Alternative considered:* Custom React modal (like `CreateEntryModal`). Rejected — a native dialog is faster to implement, requires no UI state, and is harder to accidentally dismiss.

### 3. `delete_entry(state, entry_id, date)` — same signature shape as `move_entry`

Consistent with the existing command API. The frontend already passes `entry_id` and `date` from `contextMenu` state.

## Risks / Trade-offs

- **Deletion is permanent** — no undo once `remove_dir_all` runs. Mitigated by the confirmation dialog; out of scope for this change to add undo.
- **Race condition: entry modified between confirm and delete** — acceptable; the vault is single-user.
- **`remove_dir_all` fails silently on partial delete** — the Rust command returns an error to the frontend, which should surface it (console.error, same pattern as move). A partial delete leaving a corrupted entry directory is theoretically possible but unlikely with a single `_default.md` file.

## Migration Plan

No data migration. Pure addition of a new Rust command and a new context menu item. Rollback = revert the two files.
