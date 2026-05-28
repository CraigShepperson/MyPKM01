## ADDED Requirements

### Requirement: delete_entry command removes an entry directory from disk
A Tauri command `delete_entry` SHALL be registered and callable from the frontend. It SHALL accept `entry_id: String` and `date: String` parameters. It SHALL remove the directory at `{vaultRoot}/timeline/{date}/{entry_id}/` and all its contents. If the date directory becomes empty after deletion, it SHALL be removed as well (best-effort; failure to remove the date directory SHALL NOT cause the command to return an error). If the entry directory does not exist, the command SHALL return an error. If `vaultRoot` is not configured, the command SHALL return an error.

#### Scenario: Entry directory is deleted
- **WHEN** `delete_entry` is invoked with a valid `entry_id` and `date` for an existing entry
- **THEN** the directory `{vaultRoot}/timeline/{date}/{entry_id}/` no longer exists on disk and the command returns success

#### Scenario: Empty date directory is cleaned up
- **WHEN** `delete_entry` removes the last entry in a date directory
- **THEN** the date directory itself is also removed from disk

#### Scenario: Non-empty date directory is preserved
- **WHEN** `delete_entry` removes an entry but other entries remain in the same date directory
- **THEN** the date directory remains on disk with the remaining entries intact

#### Scenario: Missing entry returns error
- **WHEN** `delete_entry` is invoked with an `entry_id` that does not exist under the given `date`
- **THEN** the command returns an error and no files are modified

#### Scenario: No vault configured returns error
- **WHEN** `delete_entry` is invoked before a vault has been initialised
- **THEN** the command returns an error

---

### Requirement: User must confirm before an entry is deleted
Before invoking `delete_entry`, the frontend SHALL display a native confirmation dialog naming the entry title and warning that the action cannot be undone. The deletion SHALL only proceed if the user confirms. If the user cancels, no IPC call is made and the tree remains unchanged.

#### Scenario: User confirms deletion
- **WHEN** the user selects "Delete" from the context menu and confirms in the dialog
- **THEN** `delete_entry` is invoked and the entry is removed from the tree after success

#### Scenario: User cancels deletion
- **WHEN** the user selects "Delete" from the context menu and dismisses the dialog
- **THEN** `delete_entry` is NOT invoked and the entry remains in the tree

---

### Requirement: DateTree context menu exposes a Delete action
The right-click context menu on an entry item in `DateTree` SHALL include a "Delete" menu item, visually separated from the move actions (e.g. below a divider). Selecting it SHALL trigger the confirmation flow described above.

#### Scenario: Delete appears in context menu
- **WHEN** the user right-clicks an entry item in the tree
- **THEN** a "Delete" option is visible in the context menu

#### Scenario: Tree refreshes after successful deletion
- **WHEN** `delete_entry` returns successfully
- **THEN** `DateTree` re-fetches `list_timeline` and the deleted entry no longer appears in the tree
