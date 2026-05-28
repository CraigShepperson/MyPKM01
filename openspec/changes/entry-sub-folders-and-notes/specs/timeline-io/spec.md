## MODIFIED Requirements

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
