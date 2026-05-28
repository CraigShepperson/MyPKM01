## MODIFIED Requirements

### Requirement: Title field reflects the selected entry's title at load time
When `NotePanel` mounts or the `title` prop changes to a new value, the title field SHALL display that value. When a different entry is selected and the `title` prop updates, the title field SHALL update to display the new entry's title. `App.tsx` is responsible for computing the correct title before passing it as a prop: when `selectedFilePath` resolves to `filename === "_default.md"`, the title SHALL be `selectedEntry.title`; when `selectedFilePath` resolves to any other filename, the title SHALL be the last path segment of that filename with the `.md` extension stripped (e.g. `"meeting-notes.md"` → `"meeting-notes"`, `"sub/tasks.md"` → `"tasks"`).

#### Scenario: Title initialises from prop on mount
- **WHEN** `NotePanel` mounts with `title="Stand-up"`
- **THEN** the title field displays "Stand-up"

#### Scenario: Title updates when a different entry is selected
- **WHEN** the user selects a different entry and the `title` prop changes to a new value
- **THEN** the title field displays the new entry's title and not the previous entry's title

#### Scenario: Sub-note title is derived from its filename
- **WHEN** the user selects a sub-note with filename `"meeting-notes.md"`
- **THEN** `App.tsx` passes `title="meeting-notes"` to `NotePanel` and the title field displays "meeting-notes"

#### Scenario: Sub-folder note title uses only the filename segment
- **WHEN** the user selects a note at `"research/tasks.md"` inside an entry
- **THEN** `App.tsx` passes `title="tasks"` to `NotePanel` and the title field displays "tasks"

---

### Requirement: Editing the title persists to disk via the appropriate command
When the user edits the title field, `NotePanel` SHALL debounce for 500 ms and then persist the change using a strategy determined by the current `filePath`. If `parsed.filename === "_default.md"`, it SHALL call `rename_entry` with `date`, `entryId`, and the trimmed new title. Otherwise it SHALL call `rename_note` with `date`, `entryId`, `oldFilename`, and the trimmed new title. If the trimmed value is an empty string neither command SHALL be called.

#### Scenario: Entry note edit calls rename_entry
- **WHEN** the user edits the title of an entry (`_default.md`) and stops typing for 500 ms
- **THEN** `rename_entry` is called with the updated trimmed title and `rename_note` is NOT called

#### Scenario: Sub-note edit calls rename_note
- **WHEN** the user edits the title of a sub-note (e.g. `meeting-notes.md`) and stops typing for 500 ms
- **THEN** `rename_note` is called with `oldFilename: "meeting-notes.md"` and the new trimmed title, and `rename_entry` is NOT called

#### Scenario: Rapid typing coalesces into a single call
- **WHEN** the user types continuously without pausing for 500 ms
- **THEN** the persist command is called once after the final keystroke's debounce period expires

#### Scenario: Empty title does not trigger any command
- **WHEN** the user clears the title field so it contains only whitespace or is empty
- **THEN** neither `rename_entry` nor `rename_note` is called

#### Scenario: Pending save is cancelled when a different note is selected
- **WHEN** the user switches to a different note before the 500 ms debounce fires
- **THEN** the pending command call for the previous note is cancelled

---

### Requirement: DateTree onSelect emits EntryMeta alongside filePath
The `DateTree` `onSelect` callback SHALL emit `{ filePath: string; meta: EntryMeta }` instead of a plain `string`. `App.tsx` SHALL maintain `selectedEntry: EntryMeta | null` state alongside `selectedFilePath`. When computing the `title` prop for `NotePanel`, `App.tsx` SHALL use `selectedEntry.title` for `_default.md` files and SHALL derive the title from the filename for all other files.

#### Scenario: Entry note title comes from EntryMeta
- **WHEN** the user selects an entry node (opening `_default.md`) in the DateTree
- **THEN** `App.tsx` passes `selectedEntry.title` as the `title` prop to `NotePanel`

#### Scenario: Sub-note title is derived from the filename, not EntryMeta
- **WHEN** the user selects a sub-note (not `_default.md`) in the DateTree
- **THEN** `App.tsx` passes the filename-derived title (last segment without `.md`) to `NotePanel`, not `selectedEntry.title`
