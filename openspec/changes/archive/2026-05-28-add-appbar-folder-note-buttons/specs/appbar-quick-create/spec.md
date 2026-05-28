## Purpose

Two persistent icon buttons in the AppBar topbar that create a subfolder or note at the currently focused tree item. Buttons are disabled when no valid target is focused.

## ADDED Requirements

### Requirement: AppBar renders Add Subfolder and Add Note icon buttons
The AppBar topbar SHALL render two icon buttons — Add Subfolder (`FolderPlus` icon) and Add Note (`FilePlus` icon) — alongside the existing CalendarBlank and Plus buttons. Both buttons SHALL have accessible `title` attributes describing their action.

#### Scenario: Buttons are present on initial render
- **WHEN** the app shell renders with a vault configured
- **THEN** both the Add Subfolder and Add Note icon buttons are visible in the topbar

---

### Requirement: Add Subfolder button is disabled when no entry is focused
The Add Subfolder button SHALL be disabled and visually muted when `focusedItem` is `null` or when `focusedItem.type === 'subfolder'`. It SHALL only be enabled when `focusedItem.type === 'entry'`.

#### Scenario: Disabled with no focused item
- **WHEN** no tree item has been focused (initial state or after tree refresh)
- **THEN** the Add Subfolder button is rendered in a disabled state and cannot be activated

#### Scenario: Disabled when a subfolder is focused
- **WHEN** the focused item is a subfolder row
- **THEN** the Add Subfolder button is rendered in a disabled state (subfolders do not nest)

#### Scenario: Enabled when an entry is focused
- **WHEN** the focused item is a timeline entry row
- **THEN** the Add Subfolder button is rendered in an enabled state and can be activated

---

### Requirement: Add Note button is disabled when no item is focused
The Add Note button SHALL be disabled and visually muted when `focusedItem` is `null`. It SHALL be enabled when `focusedItem` is either an entry or a subfolder.

#### Scenario: Disabled with no focused item
- **WHEN** no tree item has been focused
- **THEN** the Add Note button is rendered in a disabled state and cannot be activated

#### Scenario: Enabled when an entry is focused
- **WHEN** the focused item is a timeline entry
- **THEN** the Add Note button is enabled and can be activated

#### Scenario: Enabled when a subfolder is focused
- **WHEN** the focused item is a subfolder
- **THEN** the Add Note button is enabled and can be activated (note will be created inside that subfolder)

---

### Requirement: Clicking Add Subfolder triggers inline subfolder creation at the focused entry
When the Add Subfolder button is activated, `App` SHALL set `pendingAdd` to `'folder'`, which causes `DateTree` to open the inline `AddInput` at the focused entry's location. On confirmation, `create_entry_subfolder` SHALL be invoked with the focused entry's `date` and `entryId` and the user-supplied name. On cancellation or completion, `pendingAdd` SHALL be cleared.

#### Scenario: Activation opens inline input at the focused entry
- **WHEN** the user activates the Add Subfolder button while an entry is focused
- **THEN** an inline text input appears inside the tree at that entry's child level with placeholder "folder name"

#### Scenario: Confirming the input creates the subfolder
- **WHEN** the user types a name and confirms the inline input
- **THEN** `create_entry_subfolder` is invoked with the focused entry's date, entryId, and the trimmed name, and the entry's children are refreshed

#### Scenario: Cancelling the input does nothing
- **WHEN** the user cancels or blurs the inline input with no text
- **THEN** no Tauri command is invoked and the input is dismissed

---

### Requirement: Clicking Add Note triggers inline note creation at the focused location
When the Add Note button is activated, `App` SHALL set `pendingAdd` to `'note'`, which causes `DateTree` to open the inline `AddInput` at the focused item's location. If the focused item is an entry, the note is created in the entry root; if it is a subfolder, the note is created inside that subfolder. On confirmation, `create_entry_note` SHALL be invoked. On cancellation or completion, `pendingAdd` SHALL be cleared.

#### Scenario: Activation opens inline input at a focused entry
- **WHEN** the user activates the Add Note button while an entry is focused
- **THEN** an inline text input appears at that entry's child level with placeholder "note name"

#### Scenario: Activation opens inline input inside a focused subfolder
- **WHEN** the user activates the Add Note button while a subfolder is focused
- **THEN** an inline text input appears inside that subfolder's row with placeholder "note name"

#### Scenario: Confirming creates the note and refreshes children
- **WHEN** the user types a name and confirms
- **THEN** `create_entry_note` is invoked with the correct date, entryId, filename (`.md` appended if absent), and subfolder (null for entry-root notes), and the entry's children are refreshed
