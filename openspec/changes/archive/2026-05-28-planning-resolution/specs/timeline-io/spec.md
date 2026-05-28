## MODIFIED Requirements

### Requirement: list_timeline returns all date entries from the vault
The `list_timeline` Tauri command SHALL read the vault root from `VaultState`, walk the `timeline/` subdirectory, and return a `Vec<DayListing>`. Each `DayListing` SHALL correspond to one date folder in `timeline/` whose name matches `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. Folders whose names do not match any of these three patterns SHALL be silently skipped. Each entry subfolder within a date folder SHALL be represented as an `EntryMeta`. The `title` and `entry_type` fields SHALL be parsed from the YAML frontmatter of `_config.md` inside the entry folder using `gray_matter`. If `_config.md` is absent or its frontmatter cannot be parsed, the entry SHALL still be included with `title` set to the entry folder name and `entry_type` set to `"unknown"`.

#### Scenario: Timeline with two dates and multiple entries
- **WHEN** `list_timeline` is called and `timeline/` contains `2025-05-27/abc123/_config.md` (title: "Standup", type: "meeting") and `2025-05-26/def456/_config.md` (title: "Review PR", type: "task")
- **THEN** the command returns two `DayListing` values with the correct dates and parsed `EntryMeta` fields

#### Scenario: Year-resolution folder is included
- **WHEN** `list_timeline` is called and `timeline/` contains a folder named `2027` with one entry subfolder
- **THEN** the command returns a `DayListing` with `date: "2027"` and the entry's `EntryMeta`

#### Scenario: Month-resolution folder is included
- **WHEN** `list_timeline` is called and `timeline/` contains a folder named `2027-06` with one entry subfolder
- **THEN** the command returns a `DayListing` with `date: "2027-06"` and the entry's `EntryMeta`

#### Scenario: Folder with unrecognised name is skipped
- **WHEN** `timeline/` contains a folder named `notes` or `2027-06-15-extra`
- **THEN** that folder is not included in the returned listings and no error is raised

#### Scenario: Entry with missing _config.md falls back gracefully
- **WHEN** an entry subfolder exists but contains no `_config.md`
- **THEN** the entry is included in the listing with `title` equal to the folder name and `entry_type` equal to `"unknown"`

#### Scenario: Entry with unparseable frontmatter falls back gracefully
- **WHEN** `_config.md` exists but its YAML frontmatter is malformed
- **THEN** the entry is included with `title` equal to the folder name and `entry_type` equal to `"unknown"`

#### Scenario: Empty timeline directory returns empty list
- **WHEN** `timeline/` exists but contains no subfolders
- **THEN** `list_timeline` returns an empty array without error

#### Scenario: No vault configured returns error
- **WHEN** `list_timeline` is called before any vault has been initialised
- **THEN** the command returns a `VaultError` indicating no vault is configured

---

## ADDED Requirements

### Requirement: move_entry renames an entry folder to a new date path
The `move_entry` Tauri command SHALL accept `entry_id: String`, `from_date: String`, and `to_date: String`. It SHALL rename `timeline/{from_date}/{entry_id}` to `timeline/{to_date}/{entry_id}` relative to the vault root, creating `timeline/{to_date}/` if it does not already exist. After a successful rename, if `timeline/{from_date}/` is empty it SHALL be removed. If `timeline/{from_date}/{entry_id}` does not exist the command SHALL return a `VaultError::IoError`. If `from_date` equals `to_date` the command SHALL return `Ok(())` without performing any filesystem operations.

#### Scenario: Moving from year to month renames folder and creates parent
- **WHEN** `move_entry` is called with `entry_id: "abc"`, `from_date: "2027"`, `to_date: "2027-06"`, and `timeline/2027/abc/` exists
- **THEN** `timeline/2027-06/abc/` exists and `timeline/2027/` has been removed (it was the only entry)

#### Scenario: Moving from month to day renames folder
- **WHEN** `move_entry` is called with `entry_id: "abc"`, `from_date: "2027-06"`, `to_date: "2027-06-15"`, and `timeline/2027-06/abc/` exists
- **THEN** `timeline/2027-06-15/abc/` exists

#### Scenario: Non-empty from_date directory is not removed
- **WHEN** `move_entry` is called and `timeline/{from_date}/` still contains other entry subfolders after the rename
- **THEN** `timeline/{from_date}/` remains in place

#### Scenario: Source entry not found returns IoError
- **WHEN** `move_entry` is called with a `from_date` and `entry_id` combination that does not exist
- **THEN** a `VaultError::IoError` is returned and no filesystem changes occur

#### Scenario: Same from_date and to_date is a no-op
- **WHEN** `move_entry` is called with `from_date` equal to `to_date`
- **THEN** the command returns `Ok(())` without performing any filesystem operations
