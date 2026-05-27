## Purpose

Tauri IPC commands for reading and writing timeline entry data from the vault filesystem.

## Requirements

### Requirement: DayListing and EntryMeta types are defined
The backend SHALL define serialisable structs `EntryMeta { id: String, title: String, entry_type: String }` and `DayListing { date: String, entries: Vec<EntryMeta> }`. Both SHALL derive `serde::Serialize` so they can be returned over the Tauri IPC bridge.

#### Scenario: Structs serialise to expected JSON shape
- **WHEN** a `DayListing` with one `EntryMeta` is serialised to JSON
- **THEN** the result contains `"date"`, `"entries"`, `"id"`, `"title"`, and `"entry_type"` keys with their correct values

---

### Requirement: list_timeline returns all date entries from the vault
The `list_timeline` Tauri command SHALL read the vault root from `VaultState`, walk the `timeline/` subdirectory, and return a `Vec<DayListing>`. Each `DayListing` SHALL correspond to one `YYYY-MM-DD` folder in `timeline/`. Each entry subfolder within a date folder SHALL be represented as an `EntryMeta`. The `title` and `entry_type` fields SHALL be parsed from the YAML frontmatter of `_config.md` inside the entry folder using `gray_matter`. If `_config.md` is absent or its frontmatter cannot be parsed, the entry SHALL still be included with `title` set to the entry folder name and `entry_type` set to `"unknown"`.

#### Scenario: Timeline with two dates and multiple entries
- **WHEN** `list_timeline` is called and `timeline/` contains `2025-05-27/abc123/_config.md` (title: "Standup", type: "meeting") and `2025-05-26/def456/_config.md` (title: "Review PR", type: "task")
- **THEN** the command returns two `DayListing` values with the correct dates and parsed `EntryMeta` fields

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
