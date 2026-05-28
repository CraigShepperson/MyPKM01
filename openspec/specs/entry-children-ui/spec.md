## Purpose

Frontend UI components and interactions for creating and navigating entry children (notes and sub-folders) within the DateTree.

## Requirements

### Requirement: Entry items in DateTree show an add-child menu
Each entry item in the `DateTree` SHALL display an add-child trigger (a `+` icon button) that appears on hover. Activating the trigger SHALL open an inline menu with two options: **New folder** and **New note**. The trigger SHALL NOT be visible when the entry item does not have focus or hover. The trigger SHALL be rendered within the entry item row, not as a separate row.

#### Scenario: Add trigger appears on hover
- **WHEN** the user hovers over an entry item in the tree
- **THEN** a `+` icon button becomes visible within that entry row

#### Scenario: Add trigger is hidden when not hovered
- **WHEN** the user is not hovering over an entry item
- **THEN** the `+` icon button is not visible

#### Scenario: Activating add trigger opens menu
- **WHEN** the user clicks the `+` icon button on an entry item
- **THEN** a dropdown or inline menu appears with "New folder" and "New note" options

---

### Requirement: New folder option prompts for a name and creates the sub-folder
When the user selects **New folder** from the add-child menu, the UI SHALL render an inline text input within the entry's child list (or directly under the entry row if no children exist yet). The input SHALL be focused automatically. Confirming the input (pressing Enter or clicking away while non-empty) SHALL call `invoke('create_entry_subfolder', { date, entryId, name })`. On success the entry SHALL re-fetch its children via `list_entry_children` and expand to show the new sub-folder. Pressing Escape SHALL cancel without calling the command.

#### Scenario: Inline input appears under the entry
- **WHEN** the user selects "New folder"
- **THEN** a text input field appears below the entry row and receives focus

#### Scenario: Confirming creates sub-folder and refreshes children
- **WHEN** the user types "research" and presses Enter
- **THEN** `create_entry_subfolder` is called with `name: "research"`, the entry's children are re-fetched, and the new sub-folder appears in the tree

#### Scenario: Empty name does not create sub-folder
- **WHEN** the user confirms the input while it is empty or whitespace-only
- **THEN** `create_entry_subfolder` is NOT called and the inline input is dismissed

#### Scenario: Escape cancels creation
- **WHEN** the user presses Escape while the inline input is focused
- **THEN** the input is dismissed and no command is invoked

---

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

---

### Requirement: Note items in the tree call onSelect with the note's file path
Note items rendered under an entry or sub-folder SHALL be clickable. Clicking a note item SHALL call the `DateTree`'s `onSelect` prop with the absolute path `{vaultRoot}/timeline/{date}/{entry_id}/{filename}` for direct notes, and `{vaultRoot}/timeline/{date}/{entry_id}/{subfolder}/{filename}` for notes inside a sub-folder.

#### Scenario: Clicking a direct note fires onSelect with correct path
- **WHEN** the user clicks a note item named `meeting-notes.md` directly under entry `entry-123` at date `2025-05-28` in vault at `/Users/alice/vault`
- **THEN** `onSelect` is called with `/Users/alice/vault/timeline/2025-05-28/entry-123/meeting-notes.md`

#### Scenario: Clicking a sub-folder note fires onSelect with subfolder in path
- **WHEN** the user clicks a note `tasks.md` inside sub-folder `action-items` under the same entry
- **THEN** `onSelect` is called with `/Users/alice/vault/timeline/2025-05-28/entry-123/action-items/tasks.md`

---

### Requirement: Note items highlight when their path matches selectedFilePath
Note items rendered under an entry or sub-folder SHALL receive the `selectedFilePath` value threaded down from the parent `DateTree`. A note item SHALL display a persistent background highlight when its own file path matches `selectedFilePath`, compared after normalising both values to forward slashes. Direct notes and sub-folder notes SHALL both participate in this highlight. The highlight SHALL remain visible regardless of hover state.

#### Scenario: Direct note item is highlighted when selected
- **WHEN** `selectedFilePath` matches a direct note item's file path
- **THEN** that note item displays the active background highlight

#### Scenario: Sub-folder note item is highlighted when selected
- **WHEN** `selectedFilePath` matches a note inside a sub-folder
- **THEN** that note item displays the active background highlight

#### Scenario: Non-matching note items show no highlight
- **WHEN** `selectedFilePath` matches one note item
- **THEN** all other note items do not display the active highlight

#### Scenario: Undefined selectedFilePath shows no highlight on note items
- **WHEN** `selectedFilePath` is not provided to `DateTree`
- **THEN** no note items display an active highlight
