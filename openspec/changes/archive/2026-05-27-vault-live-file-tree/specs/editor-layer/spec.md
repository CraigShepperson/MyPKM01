## ADDED Requirements

### Requirement: BlockNoteEditor accepts a filePath prop and loads file content
The `BlockNoteEditor` component SHALL accept an optional `filePath: string | null` prop. When `filePath` is a non-null string, the component SHALL call `invoke('read_entry_file', { date, entryId, filename })` — with parameters derived by parsing the `filePath` — and populate the editor with the returned content. The content SHALL be converted from markdown to BlockNote block format using `editor.tryParseMarkdownToBlocks(content)` and loaded via `editor.replaceBlocks(editor.document, blocks)`. This load SHALL occur on mount when `filePath` is set, and SHALL re-trigger whenever `filePath` changes to a new value. When `filePath` is `null` or `undefined`, the editor SHALL render with empty content as before.

#### Scenario: Editor loads content when filePath is set
- **WHEN** `BlockNoteEditor` is rendered with a valid `filePath` pointing to an existing `_config.md`
- **THEN** the editor displays the markdown body content of that file

#### Scenario: Editor reloads when filePath changes
- **WHEN** the user selects a different entry and `filePath` prop changes to a new path
- **THEN** the editor clears its previous content and displays the content of the new file

#### Scenario: Editor renders empty when filePath is null
- **WHEN** `BlockNoteEditor` is rendered with `filePath` set to `null`
- **THEN** the editor mounts with an empty document, matching prior behaviour

#### Scenario: Editor handles read failure gracefully
- **WHEN** `invoke('read_entry_file', ...)` rejects (e.g. file deleted between selection and load)
- **THEN** the editor does not crash; it retains its current content or renders empty
