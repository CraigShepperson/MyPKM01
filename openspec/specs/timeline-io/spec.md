## Purpose

Tauri IPC commands for reading and writing timeline entry data from the vault filesystem.

## Requirements

### Requirement: DayListing and EntryMeta types are defined
The backend SHALL define serialisable structs `EntryMeta { id: String, title: String, entry_type: String, has_children: bool }` and `DayListing { date: String, entries: Vec<EntryMeta> }`. Both SHALL derive `serde::Serialize` so they can be returned over the Tauri IPC bridge. The `has_children` field SHALL be `true` when the entry folder contains at least one direct non-underscore `.md` file or at least one sub-directory; it SHALL be `false` otherwise.

#### Scenario: Structs serialise to expected JSON shape
- **WHEN** a `DayListing` with one `EntryMeta` is serialised to JSON
- **THEN** the result contains `"date"`, `"entries"`, `"id"`, `"title"`, `"entry_type"`, and `"has_children"` keys with their correct values

#### Scenario: has_children is true when entry has a direct note
- **WHEN** `list_timeline` is called and an entry folder contains `meeting-notes.md` alongside `_config.md`
- **THEN** the corresponding `EntryMeta` has `has_children: true`

#### Scenario: has_children is true when entry has a sub-folder
- **WHEN** an entry folder contains a sub-directory named `research/`
- **THEN** the corresponding `EntryMeta` has `has_children: true`

#### Scenario: has_children is false when entry has only underscore files
- **WHEN** an entry folder contains only `_config.md` and no sub-directories
- **THEN** the corresponding `EntryMeta` has `has_children: false`

---

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

### Requirement: read_entry_file returns the body of a file within an entry folder
The `read_entry_file` Tauri command SHALL accept `date: String`, `entry_id: String`, and `filename: String`. It SHALL read `timeline/<date>/<entry_id>/<filename>` relative to the vault root and return the file contents as a UTF-8 string. When `filename` is `_config.md`, the command SHALL strip the YAML frontmatter block (the `---` delimited header) and return only the markdown body. If the file does not exist the command SHALL return a `VaultError::IoError`.

#### Scenario: Reading _config.md returns body only
- **WHEN** `read_entry_file` is called with `filename: "_config.md"` and the file contains a YAML frontmatter block followed by markdown body text
- **THEN** only the markdown body (below the closing `---`) is returned; the frontmatter delimiters and YAML content are not included

#### Scenario: Reading a non-config file returns full content
- **WHEN** `read_entry_file` is called with a filename other than `_config.md`
- **THEN** the full file contents are returned unchanged

#### Scenario: File not found returns IoError
- **WHEN** `read_entry_file` is called with a path that does not exist on disk
- **THEN** a `VaultError::IoError` is returned

---

### Requirement: write_entry_file writes content to a file within an entry folder
The `write_entry_file` Tauri command SHALL accept `date: String`, `entry_id: String`, `filename: String`, and `content: String`. It SHALL write `content` to `timeline/<date>/<entry_id>/<filename>` relative to the vault root, creating the file if it does not exist and overwriting it if it does. It SHALL NOT create the date or entry folder — the folder must already exist.

#### Scenario: Writing to an existing entry folder succeeds
- **WHEN** `write_entry_file` is called with a valid path to an existing entry folder and new content
- **THEN** the file at that path contains the new content after the command returns

#### Scenario: Writing to a non-existent entry folder returns IoError
- **WHEN** `write_entry_file` is called with a date or entry_id that does not exist on disk
- **THEN** a `VaultError::IoError` is returned and no file is created

---

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

---

### Requirement: create_entry creates a timestamped entry folder with _default.md
The `create_entry` Tauri command SHALL accept `date: String`, `title: String`, and `entry_type: String`. It SHALL create a subfolder named `entry-{unix_millis}` under `timeline/{date}/` relative to the vault root, creating intermediate directories as needed. Within that folder it SHALL write `_default.md` with a YAML frontmatter block containing `title`, `type`, and `source: internal`. The command SHALL return the generated entry ID as a `String`.

#### Scenario: Entry folder is created at the correct path
- **WHEN** `create_entry` is called with `date: "2025-05-28"`, `title: "Standup"`, `entry_type: "meeting"`
- **THEN** a folder matching `timeline/2025-05-28/entry-*/` exists under the vault root

#### Scenario: _default.md contains title, type, and source frontmatter
- **WHEN** `create_entry` is called with `title: "Standup"` and `entry_type: "meeting"`
- **THEN** the `_default.md` written inside the entry folder contains frontmatter with `title: Standup`, `type: meeting`, and `source: internal`

#### Scenario: Command returns the generated entry ID
- **WHEN** `create_entry` completes successfully
- **THEN** the returned string matches the folder name created (e.g. `entry-1748390400000`)

#### Scenario: Year-resolution date is accepted
- **WHEN** `create_entry` is called with `date: "2027"`
- **THEN** the entry folder is created under `timeline/2027/`

#### Scenario: Month-resolution date is accepted
- **WHEN** `create_entry` is called with `date: "2027-06"`
- **THEN** the entry folder is created under `timeline/2027-06/`
