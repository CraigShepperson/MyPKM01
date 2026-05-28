## Why

The editor currently loads file content but has no save mechanism — any edits the user makes are lost on navigation or app close. Auto-saving on change eliminates the need for an explicit save action and keeps the vault files in sync with the editor at all times.

## What Changes

- `BlockNoteEditor` subscribes to BlockNote's `onChange` event
- On each change, it debounces for ~1 second then serializes the current document to markdown using `editor.blocksToMarkdownLossy()` and calls `invoke('write_entry_file', { date, entryId, filename, content })`
- The `filePath` already parsed into `{ date, entryId, filename }` is reused for the write call
- Save is skipped during the initial content load (to avoid writing back immediately after reading)
- The `write_entry_file` Tauri command is already registered — no backend changes needed

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `editor-layer`: `BlockNoteEditor` now auto-saves document changes to disk with a debounce; the write uses the existing `write_entry_file` command

## Impact

- `src/components/editor/BlockNoteEditor.tsx` — add debounced `onChange` handler that serializes to markdown and calls `write_entry_file`; guard against writing during the initial load
