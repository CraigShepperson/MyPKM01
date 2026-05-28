## MODIFIED Requirements

### Requirement: New note option creates a note immediately with an auto-generated name
When the user selects **New note** from the add-child menu on an entry item, the UI SHALL NOT show an inline text input. Instead it SHALL immediately compute the first available filename in the sequence `untitled.md`, `untitled-1.md`, `untitled-2.md`, … by checking the entry's already-loaded children list. It SHALL then call `invoke('create_entry_note', { date, entryId, filename, subfolder: null })` with that filename. If `create_entry_note` returns an error (e.g. due to a race-condition collision), the UI SHALL retry with the next filename in the sequence up to a limit of 20 attempts before surfacing an error. On success the entry SHALL re-fetch its children, expand to show the new note, and the new note SHALL be auto-selected and opened in the editor. When **New note** is triggered from a sub-folder's own add menu, `subfolder` SHALL be set to the sub-folder's name and the collision check SHALL be scoped to that sub-folder's notes.

#### Scenario: New note is created immediately without a text input
- **WHEN** the user selects "New note" from an entry's add-child menu
- **THEN** no inline text input is shown and a note file is created immediately

#### Scenario: First note in an entry is named untitled.md
- **WHEN** the user selects "New note" and the entry has no existing notes
- **THEN** `create_entry_note` is called with `filename: "untitled.md"`

#### Scenario: Second note increments to untitled-1.md
- **WHEN** the user selects "New note" and `untitled.md` already exists in the entry
- **THEN** `create_entry_note` is called with `filename: "untitled-1.md"`

#### Scenario: Sequence continues incrementing for further collisions
- **WHEN** the user selects "New note" and both `untitled.md` and `untitled-1.md` exist
- **THEN** `create_entry_note` is called with `filename: "untitled-2.md"`

#### Scenario: New note is auto-selected in the editor after creation
- **WHEN** a new note is created successfully
- **THEN** the note is immediately opened in the editor panel and the entry's children are refreshed

#### Scenario: New note in subfolder is scoped to that subfolder
- **WHEN** the user triggers "New note" from a sub-folder's add menu
- **THEN** `create_entry_note` is called with the auto-generated filename and `subfolder` set to that sub-folder's name

---

### Requirement: Sub-folder nodes are rendered under expanded entries
When an entry is expanded and `EntryChildrenListing.subfolders` is non-empty, the `DateTree` SHALL render a sub-folder node for each sub-folder. Each sub-folder node SHALL display the sub-folder name. Sub-folder nodes SHALL be independently collapsible. When expanded, a sub-folder SHALL render its notes as child items. Sub-folder nodes SHALL also display a `+` icon on hover that offers only a **New note** option (scoped to that sub-folder). Activating **New note** from a sub-folder SHALL follow the same immediate auto-named creation behaviour as the entry-level "New note" — no inline text input SHALL be shown.

#### Scenario: Sub-folders appear under an expanded entry
- **WHEN** an entry is expanded and its children include a sub-folder named "research"
- **THEN** a "research" sub-folder node is rendered as a direct child of the entry item

#### Scenario: Sub-folder is collapsible
- **WHEN** the user clicks a sub-folder node header
- **THEN** the sub-folder toggles between expanded and collapsed states

#### Scenario: Sub-folder add menu only offers New note
- **WHEN** the user hovers a sub-folder node and activates its `+` trigger
- **THEN** only "New note" is shown (not "New folder")

#### Scenario: Sub-folder New note creates immediately without a text input
- **WHEN** the user selects "New note" from a sub-folder's `+` menu
- **THEN** no inline text input is shown and a note is created immediately with an auto-generated name scoped to that sub-folder
