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

### Requirement: New note option prompts for a name and creates the note
When the user selects **New note** from the add-child menu on an entry item, the UI SHALL render an inline text input within the entry's direct notes list. The input SHALL be focused automatically. Confirming SHALL append `.md` to the entered name if not already present, then call `invoke('create_entry_note', { date, entryId, filename, subfolder: null })`. On success the entry SHALL re-fetch its children and expand to show the new note. When **New note** is triggered from a sub-folder's own add menu (see sub-folder add requirement), `subfolder` SHALL be set to the sub-folder's name.

#### Scenario: Confirming note name calls create_entry_note
- **WHEN** the user types "meeting-notes" and confirms
- **THEN** `create_entry_note` is called with `filename: "meeting-notes.md"` and `subfolder: null`

#### Scenario: Name already ending in .md is not doubled
- **WHEN** the user types "notes.md" and confirms
- **THEN** `create_entry_note` is called with `filename: "notes.md"` (not `"notes.md.md"`)

#### Scenario: Escape cancels note creation
- **WHEN** the user presses Escape while the inline input is focused
- **THEN** no command is invoked and the input is dismissed

---

### Requirement: Sub-folder nodes are rendered under expanded entries
When an entry is expanded and `EntryChildrenListing.subfolders` is non-empty, the `DateTree` SHALL render a sub-folder node for each sub-folder. Each sub-folder node SHALL display the sub-folder name. Sub-folder nodes SHALL be independently collapsible. When expanded, a sub-folder SHALL render its notes as child items. Sub-folder nodes SHALL also display a `+` icon on hover that offers only a **New note** option (scoped to that sub-folder).

#### Scenario: Sub-folders appear under an expanded entry
- **WHEN** an entry is expanded and its children include a sub-folder named "research"
- **THEN** a "research" sub-folder node is rendered as a direct child of the entry item

#### Scenario: Sub-folder is collapsible
- **WHEN** the user clicks a sub-folder node header
- **THEN** the sub-folder toggles between expanded and collapsed states

#### Scenario: Sub-folder add menu only offers New note
- **WHEN** the user hovers a sub-folder node and activates its `+` trigger
- **THEN** only "New note" is shown (not "New folder")

---

### Requirement: Note items in the tree call onSelect with the note's file path
Note items rendered under an entry or sub-folder SHALL be clickable. Clicking a note item SHALL call the `DateTree`'s `onSelect` prop with the absolute path `{vaultRoot}/timeline/{date}/{entry_id}/{filename}` for direct notes, and `{vaultRoot}/timeline/{date}/{entry_id}/{subfolder}/{filename}` for notes inside a sub-folder.

#### Scenario: Clicking a direct note fires onSelect with correct path
- **WHEN** the user clicks a note item named `meeting-notes.md` directly under entry `entry-123` at date `2025-05-28` in vault at `/Users/alice/vault`
- **THEN** `onSelect` is called with `/Users/alice/vault/timeline/2025-05-28/entry-123/meeting-notes.md`

#### Scenario: Clicking a sub-folder note fires onSelect with subfolder in path
- **WHEN** the user clicks a note `tasks.md` inside sub-folder `action-items` under the same entry
- **THEN** `onSelect` is called with `/Users/alice/vault/timeline/2025-05-28/entry-123/action-items/tasks.md`
