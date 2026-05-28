## Purpose

UI components and interactions for creating new timeline entries from the DateTree sidebar.

## Requirements

### Requirement: CreateEntryModal collects title, type, and date from the user
The `CreateEntryModal` component SHALL render a form containing a text input for the entry title, a type selector with options `meeting`, `event`, and `task` defaulting to `"event"`, and a date picker. The Save button SHALL be disabled when the title field is empty or contains only whitespace. The Cancel button SHALL close the modal without invoking any Tauri command.

#### Scenario: Save is disabled when title is empty
- **WHEN** the modal is open and the title input contains no text
- **THEN** the Save button is rendered in a disabled state and cannot be activated

#### Scenario: Save is disabled when title is whitespace only
- **WHEN** the title input contains only space characters
- **THEN** the Save button remains disabled

#### Scenario: Save is enabled when title has content
- **WHEN** the title input contains at least one non-whitespace character
- **THEN** the Save button becomes active

#### Scenario: Type selector defaults to event
- **WHEN** the modal opens for a new entry
- **THEN** the type selector shows `event` as the selected value

#### Scenario: Cancel closes the modal without creating an entry
- **WHEN** the user activates the Cancel button
- **THEN** the modal closes and no `create_entry` Tauri command is invoked

---

### Requirement: Submitting the form creates an entry and refreshes the tree
On Save, the modal SHALL invoke the `create_entry` Tauri command with the `date`, `title` (trimmed), and `entry_type` values collected from the form. On success the modal SHALL close and the DateTree SHALL refresh to show the new entry. On command failure the modal SHALL remain open.

#### Scenario: Successful save closes modal and refreshes tree
- **WHEN** the user fills in a title, selects a type, picks a date, and activates Save
- **THEN** `create_entry` is called with those values, the modal closes, and the tree reloads

#### Scenario: Failed save keeps modal open
- **WHEN** the `create_entry` command returns an error
- **THEN** the modal remains visible and the tree is not refreshed

---

### Requirement: The + button in the DateTree header opens the CreateEntryModal
The `+` button in the DateTree sidebar header SHALL open `CreateEntryModal`. It SHALL NOT open `ResolutionDatePicker` directly.

#### Scenario: Clicking + opens the creation modal
- **WHEN** the user clicks the `+` button in the DateTree header
- **THEN** `CreateEntryModal` becomes visible with an empty title, type defaulting to `event`, and no pre-selected date
