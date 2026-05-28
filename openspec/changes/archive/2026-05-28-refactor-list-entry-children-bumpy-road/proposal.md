## Why

`list_entry_children_impl` has a Bumpy Road code smell: two separate chunks of nested conditional logic inside a single function, flagged by CodeScene. Extracting the subfolder-reading logic into a named helper reduces cognitive load and makes each piece independently testable.

## What Changes

- Extract a private helper function `read_subfolder_notes(dir: &Path) -> Result<Vec<EntryNote>, VaultError>` from `list_entry_children_impl`
- `list_entry_children_impl` calls the helper instead of inlining the subfolder traversal
- No behavioural or API changes — inputs, outputs, and error cases remain identical

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirements in `entry-children-io` are unchanged; only the internal implementation structure changes.

## Impact

- `src-tauri/src/vault/timeline.rs` — only file touched
- No IPC API changes, no frontend changes, no test scenario changes
