## ADDED Requirements

### Requirement: DateTree accepts onFocusItem callback and fires it on row interactions
The `DateTree` component SHALL accept an `onFocusItem: (item: FocusedItem | null) => void` prop. Clicking an entry row (the title/select button) SHALL call `onFocusItem` with `{ type: 'entry', entryId, date }`. Clicking a subfolder header SHALL call `onFocusItem` with `{ type: 'subfolder', entryId, date, subfolderName }`. After a full tree refetch completes, `DateTree` SHALL call `onFocusItem(null)` to clear any stale focused item reference.

#### Scenario: Clicking an entry fires onFocusItem with entry data
- **WHEN** the user clicks an entry row in the tree
- **THEN** `onFocusItem` is called with `{ type: 'entry', entryId: <id>, date: <date> }` for that entry

#### Scenario: Clicking a subfolder header fires onFocusItem with subfolder data
- **WHEN** the user clicks a subfolder header row
- **THEN** `onFocusItem` is called with `{ type: 'subfolder', entryId: <parent-id>, date: <date>, subfolderName: <name> }`

#### Scenario: Tree refetch clears focused item
- **WHEN** `DateTree` completes a full `list_timeline` refetch
- **THEN** `onFocusItem(null)` is called to signal that any previously focused item reference may be stale

#### Scenario: onFocusItem omitted does not break component
- **WHEN** `DateTree` is rendered without an `onFocusItem` prop
- **THEN** the component behaves normally with no errors

---

### Requirement: DateTree accepts pendingAdd prop and shows inline AddInput at the focused location
The `DateTree` component SHALL accept a `pendingAdd: 'folder' | 'note' | null` prop and an `onPendingAddDone: () => void` prop. When `pendingAdd` changes from `null` to a non-null value and a focused item is tracked internally, `DateTree` SHALL open the inline `AddInput` at the focused item's location (entry child level for `type: 'entry'`; inside the subfolder for `type: 'subfolder'`). The entry SHALL be expanded if not already. After the inline input is confirmed or cancelled, `DateTree` SHALL call `onPendingAddDone()`.

#### Scenario: pendingAdd 'folder' opens AddInput at focused entry
- **WHEN** `pendingAdd` changes to `'folder'` and the focused item is an entry
- **THEN** the inline AddInput appears at that entry's child level with placeholder "folder name", and the entry is expanded

#### Scenario: pendingAdd 'note' opens AddInput at focused entry root
- **WHEN** `pendingAdd` changes to `'note'` and the focused item is an entry
- **THEN** the inline AddInput appears at that entry's child level with placeholder "note name"

#### Scenario: pendingAdd 'note' opens AddInput inside focused subfolder
- **WHEN** `pendingAdd` changes to `'note'` and the focused item is a subfolder
- **THEN** the inline AddInput appears inside that subfolder with placeholder "note name"

#### Scenario: Confirming AddInput calls onPendingAddDone
- **WHEN** the user confirms the inline input triggered by pendingAdd
- **THEN** `onPendingAddDone` is called after the create command completes or fails

#### Scenario: Cancelling AddInput calls onPendingAddDone
- **WHEN** the user cancels or blurs the inline input with no text
- **THEN** `onPendingAddDone` is called so the parent can clear pendingAdd

## REMOVED Requirements

### Requirement: Hover + button opens AddMenu on EntryItem
**Reason:** Replaced by the AppBar Add Subfolder and Add Note buttons. The inline creation trigger is now always visible in the AppBar rather than hidden behind a hover state.
**Migration:** Use the Add Subfolder or Add Note AppBar buttons after clicking the target entry or subfolder to focus it.
