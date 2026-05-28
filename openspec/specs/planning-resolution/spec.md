## Purpose

A segmented date picker modal that captures a date at year, month, or day resolution. Used for both creating new timeline entries and editing the date of existing ones.

## Requirements

### Requirement: ResolutionDatePicker modal accepts year, optional month, and optional day
A `ResolutionDatePicker` modal component SHALL render three inputs: `Year` (required), `Month` (optional), and `Day` (optional). Submitting with only `Year` filled SHALL produce the string `"YYYY"`. Submitting with `Year` and `Month` SHALL produce `"YYYY-MM"`. Submitting with all three SHALL produce `"YYYY-MM-DD"`. The component SHALL prevent submission if `Year` is empty or contains a non-numeric value. The component SHALL prevent submission if `Day` is provided without `Month`.

#### Scenario: Year only produces year-resolution string
- **WHEN** the user fills in `Year: 2027` and leaves `Month` and `Day` blank, then confirms
- **THEN** the modal calls its `onConfirm` callback with `"2027"`

#### Scenario: Year and month produces month-resolution string
- **WHEN** the user fills in `Year: 2027`, `Month: 3`, and leaves `Day` blank, then confirms
- **THEN** the modal calls its `onConfirm` callback with `"2027-03"`

#### Scenario: Year, month, and day produces day-resolution string
- **WHEN** the user fills in `Year: 2027`, `Month: 3`, `Day: 15`, then confirms
- **THEN** the modal calls its `onConfirm` callback with `"2027-03-15"`

#### Scenario: Empty year blocks submission
- **WHEN** the user leaves `Year` empty and attempts to confirm
- **THEN** the modal does not call `onConfirm` and displays a validation error on the `Year` field

#### Scenario: Day without month blocks submission
- **WHEN** the user fills `Year` and `Day` but leaves `Month` blank, then attempts to confirm
- **THEN** the modal does not call `onConfirm` and displays a validation error

#### Scenario: Modal pre-fills from existing date string
- **WHEN** the modal is opened with an `initialDate` prop of `"2027-03"`
- **THEN** `Year` is pre-filled with `2027`, `Month` is pre-filled with `3`, and `Day` is empty

---

### Requirement: Entry context menu exposes "Edit date" for all resolutions
The `DateTree` component SHALL render a context menu when the user right-clicks any entry item, regardless of the entry's current resolution. The context menu SHALL include an "Edit date" action. Selecting "Edit date" SHALL open the `ResolutionDatePicker` modal pre-filled with the entry's current date string. Confirming the modal SHALL invoke `move_entry` with the entry's `id`, `from_date`, and the new `to_date`. After a successful `move_entry` the tree SHALL refetch from `list_timeline`.

#### Scenario: Right-click on any entry shows context menu
- **WHEN** the user right-clicks an entry item at any resolution (year, month, or day)
- **THEN** a context menu appears containing an "Edit date" option

#### Scenario: Edit date opens pre-filled modal
- **WHEN** the user selects "Edit date" from the context menu of an entry with date `"2027-03"`
- **THEN** the ResolutionDatePicker modal opens with `Year: 2027` and `Month: 3` pre-filled

#### Scenario: Confirming edit calls move_entry and refreshes tree
- **WHEN** the user confirms the modal with a new date `"2027-06"`
- **THEN** `move_entry` is invoked with the entry's id, `from_date: "2027-03"`, `to_date: "2027-06"`, and the tree re-fetches on success

#### Scenario: Cancelling edit makes no changes
- **WHEN** the user opens the "Edit date" modal and then cancels
- **THEN** `move_entry` is not called and the tree is unchanged
