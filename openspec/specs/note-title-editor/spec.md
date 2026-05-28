## Purpose

Defines the `NotePanel` component that renders an editable title field above the BlockNote editor, along with the `rename_entry` Tauri command that persists title changes to disk.

## Requirements

### Requirement: NotePanel renders an editable title field above the BlockNote editor
A `NotePanel` component SHALL accept `filePath: string` and `title: string` props. It SHALL render a single-line editable title field directly above the `BlockNoteEditor`. The title field SHALL use font-size `2em`, font-weight `700`, and line-height `1.3` to match BlockNote's H1 heading style. `NotePanel` SHALL replace `BlockNoteEditor` as the direct top-level editor element rendered in `App.tsx`.

#### Scenario: Title field appears above editor content
- **WHEN** a note is selected and `NotePanel` renders
- **THEN** a styled title input is visible above the BlockNote editor area and contains the entry's title text

#### Scenario: Title style matches H1 in the BlockNote editor
- **WHEN** the title field is visually compared to an H1 heading block inside the BlockNote editor
- **THEN** both share the same font-size, font-weight, and line-height

#### Scenario: Title field is a single input line
- **WHEN** the user presses Enter in the title field
- **THEN** focus moves to the BlockNote editor and no newline is inserted in the title

---

### Requirement: Title field reflects the selected entry's title at load time
When `NotePanel` mounts or `filePath` changes to a new value, the title field SHALL display the `title` prop value at that moment. While the user is actively editing the title of the current note, the title field SHALL NOT be reset by subsequent changes to the `title` prop for the same `filePath`. When a different entry is selected and `filePath` updates, the title field SHALL update to display the new entry's title. `App.tsx` is responsible for computing the correct title before passing it as a prop: when `selectedFilePath` resolves to `filename === "_default.md"`, the title SHALL be `selectedEntry.title`; when `selectedFilePath` resolves to any other filename, the title SHALL be the last path segment of that filename with the `.md` extension stripped (e.g. `"meeting-notes.md"` → `"meeting-notes"`, `"sub/tasks.md"` → `"tasks"`).

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

### Requirement: rename_entry Tauri command updates the title in frontmatter
A `rename_entry` Tauri command SHALL be registered, accepting `date: String`, `entry_id: String`, and `title: String`. It SHALL read `_default.md` for the given entry, replace the `title` field in the YAML frontmatter with the new value while preserving all other frontmatter keys and the markdown body, and write the file back to disk.

#### Scenario: Title field is updated while other frontmatter keys are preserved
- **WHEN** `rename_entry` is called with a new title on an entry whose `_default.md` has `type` and `source` frontmatter fields
- **THEN** `_default.md` contains the new title value and the `type` and `source` fields are unchanged

#### Scenario: Markdown body content is preserved
- **WHEN** `rename_entry` is called
- **THEN** the markdown body of `_default.md` (the content below the frontmatter block) is identical to its content before the call

---

### Requirement: DateTree onSelect emits EntryMeta alongside filePath
The `DateTree` `onSelect` callback SHALL emit `{ filePath: string; meta: EntryMeta }` instead of a plain `string`. `App.tsx` SHALL maintain `selectedEntry: EntryMeta | null` state alongside `selectedFilePath`. When computing the `title` prop for `NotePanel`, `App.tsx` SHALL use `selectedEntry.title` for `_default.md` files and SHALL derive the title from the filename for all other files.

#### Scenario: Title is available at selection time without an extra IPC call
- **WHEN** the user clicks an entry in the DateTree
- **THEN** `App.tsx` receives both `filePath` and `EntryMeta` (including `title`) in a single callback invocation, with no additional Tauri command invoked to fetch the title

#### Scenario: Entry note title comes from EntryMeta
- **WHEN** the user selects an entry node (opening `_default.md`) in the DateTree
- **THEN** `App.tsx` passes `selectedEntry.title` as the `title` prop to `NotePanel`

#### Scenario: Sub-note title is derived from the filename, not EntryMeta
- **WHEN** the user selects a sub-note (not `_default.md`) in the DateTree
- **THEN** `App.tsx` passes the filename-derived title (last segment without `.md`) to `NotePanel`, not `selectedEntry.title`
