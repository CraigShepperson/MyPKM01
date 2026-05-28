## 1. Fix NotePanel title sync

- [x] 1.1 In `src/components/editor/NotePanel.tsx`, change the `useEffect` that calls `setTitleValue(title)` to depend on `[filePath]` instead of `[title]`

## 2. Update spec

- [x] 2.1 In `openspec/specs/note-title-editor/spec.md`, update the "Title field reflects the selected entry's title at load time" requirement to state that sync occurs on `filePath` change, not on every `title` prop change, and add the "Title is not reset while the user is editing" scenario

## 3. Verify

- [x] 3.1 Open a note, type slowly (pause >500 ms mid-word), confirm the title field retains all typed characters and does not reset
- [x] 3.2 Switch to a different note and confirm the title field updates to the new note's title
