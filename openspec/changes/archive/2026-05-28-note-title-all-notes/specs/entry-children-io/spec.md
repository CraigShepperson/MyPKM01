## ADDED Requirements

### Requirement: rename_note Tauri command renames a note file within an entry directory
A `rename_note` Tauri command SHALL be registered, accepting `date: String`, `entry_id: String`, `old_filename: String`, and `new_title: String`. It SHALL construct `new_filename` by replacing the final path segment of `old_filename` with `new_title.trim() + ".md"` (preserving any subfolder prefix, e.g. `"sub/old.md"` → `"sub/new-name.md"`). It SHALL then rename the file at `timeline/{date}/{entry_id}/{old_filename}` to `timeline/{date}/{entry_id}/{new_filename}`. `new_title` MUST NOT be empty after trimming, MUST NOT contain path separators (`/`, `\`), and the resulting `new_filename` MUST NOT already exist on disk (unless `new_filename == old_filename`, which is a no-op returning `Ok(())`). Validation failures SHALL return `VaultError::InvalidInput`. Missing source file or entry directory SHALL return `VaultError::IoError`.

#### Scenario: Direct note is renamed
- **WHEN** `rename_note` is called with `old_filename: "meeting-notes.md"` and `new_title: "standup-notes"`
- **THEN** the file previously at `timeline/{date}/{entry_id}/meeting-notes.md` now exists at `timeline/{date}/{entry_id}/standup-notes.md` and the old path no longer exists

#### Scenario: Sub-folder note is renamed preserving subfolder prefix
- **WHEN** `rename_note` is called with `old_filename: "research/tasks.md"` and `new_title: "action-items"`
- **THEN** the file is renamed to `timeline/{date}/{entry_id}/research/action-items.md` and the subfolder is unchanged

#### Scenario: Rename to same name is a no-op
- **WHEN** `rename_note` is called with `new_title` that produces the same filename as `old_filename`
- **THEN** the command returns `Ok(())` without modifying any file

#### Scenario: Collision with existing file returns InvalidInput
- **WHEN** `rename_note` is called and a file already exists at the target path
- **THEN** a `VaultError::InvalidInput` is returned and neither file is modified

#### Scenario: Empty new_title returns InvalidInput
- **WHEN** `rename_note` is called with `new_title: ""`
- **THEN** a `VaultError::InvalidInput` is returned

#### Scenario: new_title with path separator returns InvalidInput
- **WHEN** `rename_note` is called with `new_title: "foo/bar"`
- **THEN** a `VaultError::InvalidInput` is returned and no file is modified

#### Scenario: Missing source file returns IoError
- **WHEN** `rename_note` is called for a filename that does not exist on disk
- **THEN** a `VaultError::IoError` is returned
