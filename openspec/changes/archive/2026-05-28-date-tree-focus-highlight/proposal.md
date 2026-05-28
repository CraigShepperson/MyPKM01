## Why

The DateTree has no visual indication of which item is currently open in the editor, making it hard to orient yourself in the hierarchy — especially after navigating programmatically (e.g., "new note" auto-select) or when the tree has many nested entries.

## What Changes

- Add a `selectedFilePath?: string` prop to `DateTree` and thread it down to all clickable rows.
- Entry rows highlight when their `_default.md` path matches `selectedFilePath`.
- Direct note items and sub-folder note items highlight when their file path matches `selectedFilePath`.
- Pass `selectedFilePath={selectedFilePath}` from `App.tsx` to `DateTree`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `date-tree`: Add `selectedFilePath` prop requirement; entry rows SHALL visually indicate the active/selected state when their file path matches.
- `entry-children-ui`: Note item rows SHALL visually indicate the active/selected state when their file path matches `selectedFilePath`.

## Impact

- `src/components/DateTree.tsx` — `DateTreeProps` interface, entry row rendering, `NoteItem` component, `SubfolderNode` component
- `src/App.tsx` — pass `selectedFilePath` to `DateTree`
