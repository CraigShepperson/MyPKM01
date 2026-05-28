## ADDED Requirements

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
When `NotePanel` mounts or the `title` prop changes to a new value, the title field SHALL display that value. When a different entry is selected and the `title` prop updates, the title field SHALL update to display the new entry's title.

#### Scenario: Title initialises from prop on mount
- **WHEN** `NotePanel` mounts with `title="Stand-up"`
- **THEN** the title field displays "Stand-up"

#### Scenario: Title updates when a different entry is selected
- **WHEN** the user selects a different entry and the `title` prop changes to a new value
- **THEN** the title field displays the new entry's title and not the previous entry's title

---

### Requirement: Editing the title persists to disk via rename_entry
When the user edits the title field, `NotePanel` SHALL debounce for 500 ms and then call the `rename_entry` Tauri command with the `date`, `entryId`, and the trimmed new title value. If the trimmed title is an empty string the rename call SHALL be skipped.

#### Scenario: Non-empty edit triggers rename after debounce
- **WHEN** the user types a new title and stops typing for 500 ms
- **THEN** `rename_entry` is called once with the updated trimmed title

#### Scenario: Rapid typing coalesces into a single call
- **WHEN** the user types continuously without pausing for 500 ms
- **THEN** `rename_entry` is called once after the final keystroke's debounce period expires, not once per keystroke

#### Scenario: Empty title does not trigger rename
- **WHEN** the user clears the title field so it contains only whitespace or is empty
- **THEN** `rename_entry` is NOT called

#### Scenario: Pending rename is cancelled when a different entry is selected
- **WHEN** the user switches to a different entry before the 500 ms debounce fires
- **THEN** the pending `rename_entry` call for the previous entry is cancelled

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
The `DateTree` `onSelect` callback SHALL emit `{ filePath: string; meta: EntryMeta }` instead of a plain `string`. `App.tsx` SHALL maintain `selectedEntry: EntryMeta | null` state alongside `selectedFilePath` and pass `selectedEntry.title` as the `title` prop to `NotePanel`.

#### Scenario: Title is available at selection time without an extra IPC call
- **WHEN** the user clicks an entry in the DateTree
- **THEN** `App.tsx` receives both `filePath` and `EntryMeta` (including `title`) in a single callback invocation, with no additional Tauri command invoked to fetch the title
