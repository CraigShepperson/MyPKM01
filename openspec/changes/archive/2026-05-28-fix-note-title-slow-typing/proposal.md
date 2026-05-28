## Why

When a user types slowly or pauses for more than 500 ms while editing a note title, the debounce fires and saves the partial title. The save triggers a parent re-render that passes the freshly-read title back as a prop, which `NotePanel`'s `useEffect([title])` then uses to overwrite the input's live value — effectively resetting the field mid-edit and swallowing any characters typed after the pause.

## What Changes

- Change the `useEffect` dependency in `NotePanel` from `[title]` to `[filePath]` so the title input is only reset when the user navigates to a different note, not when the parent re-derives the title after our own save.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `note-title-editor`: The requirement "When the `title` prop changes to a new value, the title field SHALL display that value" is being tightened — prop-to-state sync SHALL only occur when `filePath` changes (i.e. a different note is selected), not on every prop change.

## Impact

- `src/components/editor/NotePanel.tsx` — one-line dependency array change
- `openspec/specs/note-title-editor/spec.md` — requirement wording update to reflect that sync is gated on `filePath` change
