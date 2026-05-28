## ADDED Requirements

### Requirement: BlockNoteEditor auto-saves document changes to disk
When `filePath` is set, `BlockNoteEditor` SHALL subscribe to document change events. After each change, it SHALL debounce for 1000ms and then serialize the current document to markdown using `editor.blocksToMarkdownLossy(editor.document)` and persist it by calling `invoke('write_entry_file', { date, entryId, filename, content })` with the parameters derived from `filePath`. The auto-save SHALL be suppressed during the initial content load and during any subsequent entry switch (i.e. changes triggered by `editor.replaceBlocks` SHALL NOT cause a write). The pending save timer SHALL be cancelled when the component unmounts or `filePath` changes, preventing stale writes.

#### Scenario: User edit triggers a save after debounce
- **WHEN** the user types in the editor and stops for 1 second
- **THEN** `write_entry_file` is called with the current markdown content of the document

#### Scenario: Rapid edits are coalesced into a single save
- **WHEN** the user types continuously without pausing for 1 second
- **THEN** `write_entry_file` is called once after the final keystroke's 1-second debounce, not once per keystroke

#### Scenario: Load does not trigger a save
- **WHEN** `BlockNoteEditor` loads content into the editor via `replaceBlocks` on mount or on `filePath` change
- **THEN** `write_entry_file` is NOT called as a result of that load

#### Scenario: Pending save is cancelled on entry switch
- **WHEN** the user switches to a different entry before the debounce timer fires
- **THEN** the pending write for the previous entry is cancelled and no stale content is written
