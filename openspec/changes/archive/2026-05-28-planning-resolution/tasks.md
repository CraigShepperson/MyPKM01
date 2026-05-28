## 1. Backend — list_timeline update

- [x] 1.1 Update `list_timeline` folder name matching to accept `YYYY`, `YYYY-MM`, and `YYYY-MM-DD` patterns (skip non-matching names silently)
- [x] 1.2 Add scenarios to the `list_timeline` tests for year-resolution and month-resolution folders
- [x] 1.3 Verify existing day-resolution tests still pass

## 2. Backend — move_entry command

- [x] 2.1 Implement `move_entry` Tauri command accepting `entry_id`, `from_date`, `to_date`
- [x] 2.2 Add no-op guard: return `Ok(())` immediately when `from_date == to_date`
- [x] 2.3 Create `timeline/{to_date}/` directory if it does not exist before renaming
- [x] 2.4 Rename `timeline/{from_date}/{entry_id}` to `timeline/{to_date}/{entry_id}` using `std::fs::rename`
- [x] 2.5 After rename, remove `timeline/{from_date}/` if it is empty
- [x] 2.6 Register `move_entry` in the Tauri command handler list
- [x] 2.7 Write tests: move year→month, month→day, non-empty parent not removed, missing source returns IoError, no-op case

## 3. Frontend — data model

- [x] 3.1 Extend `TreeYear` type to include `entries: EntryMeta[]`
- [x] 3.2 Extend `TreeMonth` type to include `entries: EntryMeta[]`
- [x] 3.3 Update `mapTimelineToTree` to classify date strings by shape and route year-level listings to `TreeYear.entries`, month-level to `TreeMonth.entries`, day-level to `TreeDay.entries`
- [x] 3.4 Update `mapTimelineToTree` unit tests to cover year-resolution, month-resolution, and mixed-resolution inputs

## 4. Frontend — ResolutionDatePicker modal

- [x] 4.1 Create `ResolutionDatePicker` component with `Year` (required), `Month` (optional), and `Day` (optional) inputs
- [x] 4.2 Implement validation: block submit if Year is empty or non-numeric; block submit if Day is set without Month
- [x] 4.3 Implement `onConfirm(date: string)` callback that formats the confirmed value as `"YYYY"`, `"YYYY-MM"`, or `"YYYY-MM-DD"`
- [x] 4.4 Accept `initialDate?: string` prop and pre-fill fields by parsing the string on mount
- [x] 4.5 Accept `onCancel` prop and wire up cancel/close action

## 5. Frontend — DateTree rendering of coarse entries

- [x] 5.1 Render `TreeYear.entries` as entry items directly below the year node header (above month list)
- [x] 5.2 Render `TreeMonth.entries` as entry items directly below the month node header (above day list)
- [x] 5.3 Verify existing day-level entry rendering is unchanged

## 6. Frontend — right-click "Edit date" context menu

- [x] 6.1 Add right-click context menu to entry items in `DateTree`, with a single "Edit date" action
- [x] 6.2 On "Edit date" selected, open `ResolutionDatePicker` modal pre-filled with the entry's current `date` string
- [x] 6.3 On modal confirm, invoke `move_entry` with the entry's `id`, `from_date`, and new `to_date`
- [x] 6.4 On successful `move_entry`, re-invoke `list_timeline` and refresh the tree
- [x] 6.5 On modal cancel, close the modal without any side effects

## 7. Frontend — creation flow

- [x] 7.1 Wire `ResolutionDatePicker` into the entry creation flow as the date input (replacing any existing date input)
- [x] 7.2 Verify creating a year-resolution entry produces a `timeline/YYYY/{entry_id}/` folder
- [x] 7.3 Verify creating a month-resolution entry produces a `timeline/YYYY-MM/{entry_id}/` folder
- [x] 7.4 Verify creating a day-resolution entry produces a `timeline/YYYY-MM-DD/{entry_id}/` folder
