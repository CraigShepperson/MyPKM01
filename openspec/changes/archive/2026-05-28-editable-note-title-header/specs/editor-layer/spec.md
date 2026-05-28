## ADDED Requirements

### Requirement: Right panel renders NotePanel as the top-level editor element
When an entry is selected, `App.tsx` SHALL render `<NotePanel filePath={...} title={...} />` (wrapped in `EditorBoundary`) as the right panel content. `BlockNoteEditor` SHALL NOT be rendered directly as the immediate child of `EditorBoundary`; it SHALL be an internal implementation detail of `NotePanel`.

#### Scenario: NotePanel is the direct child of EditorBoundary
- **WHEN** an entry is selected and the right panel renders
- **THEN** `NotePanel` is the component directly inside `EditorBoundary`, not `BlockNoteEditor`

#### Scenario: Placeholder is still shown when no entry is selected
- **WHEN** no entry has been selected (`selectedFilePath` is null)
- **THEN** the right panel renders the "Select an entry to begin editing" placeholder and neither `NotePanel` nor `BlockNoteEditor` is present in the DOM
