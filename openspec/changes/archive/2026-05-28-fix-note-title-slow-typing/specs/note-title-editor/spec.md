## MODIFIED Requirements

### Requirement: Title field reflects the selected entry's title at load time
When `NotePanel` mounts or `filePath` changes to a new value, the title field SHALL display the `title` prop value at that moment. While the user is actively editing the title of the current note, the title field SHALL NOT be reset by subsequent changes to the `title` prop for the same `filePath`. When a different entry is selected and `filePath` updates, the title field SHALL update to display the new entry's title.

#### Scenario: Title initialises from prop on mount
- **WHEN** `NotePanel` mounts with `title="Stand-up"`
- **THEN** the title field displays "Stand-up"

#### Scenario: Title updates when a different entry is selected
- **WHEN** the user selects a different entry and `filePath` changes
- **THEN** the title field displays the new entry's title and not the previous entry's title

#### Scenario: Title is not reset while the user is editing
- **WHEN** the user has been typing in the title field and a debounced save fires and causes the parent to re-render with an updated `title` prop for the same `filePath`
- **THEN** the title field retains the value the user has typed and is NOT overwritten by the incoming prop

#### Scenario: Sub-note title is derived from its filename
- **WHEN** the user selects a sub-note with filename `"meeting-notes.md"`
- **THEN** `App.tsx` passes `title="meeting-notes"` to `NotePanel` and the title field displays "meeting-notes"

#### Scenario: Sub-folder note title uses only the filename segment
- **WHEN** the user selects a note at `"research/tasks.md"` inside an entry
- **THEN** `App.tsx` passes `title="tasks"` to `NotePanel` and the title field displays "tasks"
