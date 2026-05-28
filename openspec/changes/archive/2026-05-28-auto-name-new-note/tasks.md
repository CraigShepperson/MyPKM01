## 1. Helper function

- [x] 1.1 Add a `pickUntitledName(existingFilenames: string[]): string` function in `src/components/DateTree.tsx` that returns the first name from `["untitled.md", "untitled-1.md", "untitled-2.md", ..., "untitled-19.md"]` that is NOT present in `existingFilenames`

## 2. Auto-create note in pendingAdd effect

- [x] 2.1 In the `openInput` async function inside the `pendingAdd` `useEffect`, add a branch for `pendingAdd === "note"`: collect existing filenames from the loaded `entryChildren` (direct notes plus any note within the target subfolder, if focused on a subfolder); call `pickUntitledName` on those filenames; call `invoke('create_entry_note', { date, entryId, filename, subfolder: subfolder ?? null })`; call `refreshEntryChildren(date, entryId)`; call `handleNoteClick(date, entry, filename, subfolder)` to auto-select the new note; call `onPendingAddDoneRef.current?.()`; and `return` without calling `setAddInput`

## 3. SubfolderNode: remove dead add-note props

- [x] 3.1 Remove `addInput: boolean`, `onAddNoteConfirm`, and `onAddCancel` from `SubfolderNode`'s props interface and destructuring, and remove the `{addInput && <AddInput … />}` render inside the component body
- [x] 3.2 In `renderEntryChildren`, remove the `sfAddInputOpen` variable and the `addInput`, `onAddNoteConfirm`, and `onAddCancel` props from the `<SubfolderNode>` JSX

## 4. Entry-level AddInput: simplify placeholder

- [x] 4.1 In `renderEntryChildren`, replace the `addInput.type === "folder" ? "folder name" : "note name"` ternary with the literal `"folder name"` (the note branch is now unreachable)
