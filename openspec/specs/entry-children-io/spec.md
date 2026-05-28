## Purpose

Tauri IPC commands for reading entry children (notes and sub-folders) and creating notes and sub-folders within an entry folder.

## Requirements

### Requirement: EntryNote, EntrySubfolder, and EntryChildrenListing types are defined
The backend SHALL define serialisable structs `EntryNote { name: String, filename: String }`, `EntrySubfolder { name: String, notes: Vec<EntryNote> }`, and `EntryChildrenListing { notes: Vec<EntryNote>, subfolders: Vec<EntrySubfolder> }`. All three SHALL derive `serde::Serialize` so they can be returned over the Tauri IPC bridge. `EntryNote.name` is the display name (filename without extension). `EntryNote.filename` is the full filename including extension (e.g. `"meeting-notes.md"`).

#### Scenario: Structs serialise to expected JSON shape
- **WHEN** an `EntryChildrenListing` with one direct note and one sub-folder (containing one note) is serialised to JSON
- **THEN** the result contains `"notes"`, `"subfolders"` keys; each `EntryNote` has `"name"` and `"filename"` keys; each `EntrySubfolder` has `"name"` and `"notes"` keys

---

### Requirement: list_entry_children returns notes and sub-folders within an entry folder
The `list_entry_children` Tauri command SHALL accept `date: String` and `entry_id: String`. It SHALL read `timeline/{date}/{entry_id}/` relative to the vault root and return an `EntryChildrenListing`. `notes` SHALL contain all `.md` files directly inside the entry folder whose names do NOT begin with `_`. `subfolders` SHALL contain all immediate sub-directories within the entry folder. For each sub-folder, its `notes` SHALL contain all `.md` files inside that sub-directory whose names do NOT begin with `_`. Files with names beginning with `_` (such as `_config.md`) SHALL be excluded from all listings. Non-`.md` files SHALL be silently ignored. Results SHALL be sorted alphabetically by name.

#### Scenario: Entry with direct notes and a sub-folder
- **WHEN** `list_entry_children` is called for an entry containing `meeting-notes.md`, `_config.md`, and a sub-folder `action-items/` with `task-1.md`
- **THEN** the response has `notes: [{ name: "meeting-notes", filename: "meeting-notes.md" }]` and `subfolders: [{ name: "action-items", notes: [{ name: "task-1", filename: "task-1.md" }] }]`

#### Scenario: Underscore files are excluded
- **WHEN** the entry folder contains only `_config.md` and `_default.md`
- **THEN** `notes` is an empty array and `subfolders` is an empty array

#### Scenario: Entry with no children returns empty listing
- **WHEN** the entry folder contains no sub-directories and no non-underscore `.md` files
- **THEN** `list_entry_children` returns `{ notes: [], subfolders: [] }` without error

#### Scenario: Entry folder not found returns IoError
- **WHEN** `list_entry_children` is called with a `date` and `entry_id` that do not correspond to an existing folder
- **THEN** a `VaultError::IoError` is returned

---

### Requirement: create_entry_subfolder creates a named sub-folder inside an entry
The `create_entry_subfolder` Tauri command SHALL accept `date: String`, `entry_id: String`, and `name: String`. It SHALL create a directory at `timeline/{date}/{entry_id}/{name}/` relative to the vault root. The `name` SHALL be validated: it MUST NOT be empty, MUST NOT contain path separators (`/`, `\`), and MUST NOT begin with `_`. If validation fails the command SHALL return a `VaultError::InvalidInput`. If the sub-folder already exists the command SHALL return `Ok(())` (idempotent). If the parent entry folder does not exist the command SHALL return a `VaultError::IoError`.

#### Scenario: Creates sub-folder at correct path
- **WHEN** `create_entry_subfolder` is called with `date: "2025-05-28"`, `entry_id: "entry-123"`, `name: "research"`
- **THEN** a directory exists at `timeline/2025-05-28/entry-123/research/`

#### Scenario: Idempotent when sub-folder already exists
- **WHEN** `create_entry_subfolder` is called for a sub-folder that already exists
- **THEN** the command returns `Ok(())` without error

#### Scenario: Name with path separator is rejected
- **WHEN** `create_entry_subfolder` is called with `name: "foo/bar"`
- **THEN** a `VaultError::InvalidInput` is returned and no directory is created

#### Scenario: Name beginning with underscore is rejected
- **WHEN** `create_entry_subfolder` is called with `name: "_private"`
- **THEN** a `VaultError::InvalidInput` is returned

#### Scenario: Parent entry not found returns IoError
- **WHEN** `create_entry_subfolder` is called with a `date` and `entry_id` that do not exist on disk
- **THEN** a `VaultError::IoError` is returned

---

### Requirement: create_entry_note creates a markdown note inside an entry or sub-folder
The `create_entry_note` Tauri command SHALL accept `date: String`, `entry_id: String`, `filename: String`, and `subfolder: Option<String>`. When `subfolder` is `None`, it SHALL create an empty file at `timeline/{date}/{entry_id}/{filename}`. When `subfolder` is `Some(name)`, it SHALL create an empty file at `timeline/{date}/{entry_id}/{name}/{filename}`. The `filename` MUST end with `.md`, MUST NOT begin with `_`, and MUST NOT contain path separators. If validation fails the command SHALL return `VaultError::InvalidInput`. If the target file already exists the command SHALL return `VaultError::InvalidInput` (notes are not overwritten on creation). If the parent folder (entry or sub-folder) does not exist the command SHALL return `VaultError::IoError`.

#### Scenario: Creates note directly in entry folder
- **WHEN** `create_entry_note` is called with `date: "2025-05-28"`, `entry_id: "entry-123"`, `filename: "notes.md"`, `subfolder: None`
- **THEN** an empty file exists at `timeline/2025-05-28/entry-123/notes.md`

#### Scenario: Creates note inside a sub-folder
- **WHEN** `create_entry_note` is called with `filename: "tasks.md"`, `subfolder: Some("action-items")`
- **THEN** an empty file exists at `timeline/{date}/{entry_id}/action-items/tasks.md`

#### Scenario: Filename not ending in .md is rejected
- **WHEN** `create_entry_note` is called with `filename: "notes.txt"`
- **THEN** a `VaultError::InvalidInput` is returned and no file is created

#### Scenario: Duplicate filename is rejected
- **WHEN** `create_entry_note` is called and the target file already exists
- **THEN** a `VaultError::InvalidInput` is returned and the existing file is not modified

#### Scenario: Sub-folder not found returns IoError
- **WHEN** `create_entry_note` is called with `subfolder: Some("nonexistent")`
- **THEN** a `VaultError::IoError` is returned
