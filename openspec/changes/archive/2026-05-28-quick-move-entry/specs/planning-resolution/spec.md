## MODIFIED Requirements

### Requirement: Entry context menu exposes "Edit date" for all resolutions
The `DateTree` component SHALL render a context menu when the user right-clicks any entry item, regardless of the entry's current resolution. The context menu SHALL include three quick-move actions — **Move to Today**, **Move to Tomorrow**, and **Move to Next Monday** — followed by a **Move To…** action that opens the `ResolutionDatePicker` modal. Each quick-move action SHALL compute its target date in the user's local timezone using native `Date` arithmetic and invoke `move_entry` immediately without opening any modal. "Move to Next Monday" SHALL resolve to the Monday of the next calendar week and SHALL always be at least one day in the future (if today is Monday, it targets the following Monday). After any successful `move_entry`, the tree SHALL refetch from `list_timeline`. The "Move To…" action SHALL continue to open the `ResolutionDatePicker` modal pre-filled with the entry's current date string.

#### Scenario: Right-click on any entry shows context menu
- **WHEN** the user right-clicks an entry item at any resolution (year, month, or day)
- **THEN** a context menu appears containing "Move to Today", "Move to Tomorrow", "Move to Next Monday", and "Move To…" actions

#### Scenario: Move to Today fires move_entry with today's date
- **WHEN** the user selects "Move to Today" from the context menu and today's local date is `"2026-05-28"`
- **THEN** `move_entry` is invoked with the entry's id, `from_date` equal to the entry's current date, and `to_date: "2026-05-28"`, and the tree re-fetches on success

#### Scenario: Move to Tomorrow fires move_entry with tomorrow's date
- **WHEN** the user selects "Move to Tomorrow" from the context menu and today's local date is `"2026-05-28"`
- **THEN** `move_entry` is invoked with `to_date: "2026-05-29"` and the tree re-fetches on success

#### Scenario: Move to Next Monday targets next week's Monday
- **WHEN** the user selects "Move to Next Monday" and today is Thursday `"2026-05-28"`
- **THEN** `move_entry` is invoked with `to_date: "2026-06-01"` (the Monday of the following week)

#### Scenario: Move to Next Monday on a Monday targets the following Monday
- **WHEN** the user selects "Move to Next Monday" and today is Monday `"2026-06-01"`
- **THEN** `move_entry` is invoked with `to_date: "2026-06-08"` (the Monday one week later, not today)

#### Scenario: Move To… opens pre-filled modal
- **WHEN** the user selects "Move To…" from the context menu of an entry with date `"2027-03"`
- **THEN** the ResolutionDatePicker modal opens with `Year: 2027` and `Month: 3` pre-filled

#### Scenario: Confirming Move To… calls move_entry and refreshes tree
- **WHEN** the user confirms the modal with a new date `"2027-06"`
- **THEN** `move_entry` is invoked with the entry's id, `from_date: "2027-03"`, `to_date: "2027-06"`, and the tree re-fetches on success

#### Scenario: Cancelling Move To… makes no changes
- **WHEN** the user opens the "Move To…" modal and then cancels
- **THEN** `move_entry` is not called and the tree is unchanged
