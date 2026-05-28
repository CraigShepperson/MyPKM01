## 1. Thread selectedFilePath through DateTree

- [x] 1.1 Add `selectedFilePath?: string` to the `DateTreeProps` interface in `src/components/DateTree.tsx`
- [x] 1.2 In `App.tsx`, pass `selectedFilePath={selectedFilePath}` to the `DateTree` component

## 2. Highlight entry rows

- [x] 2.1 In the entry row render block in `DateTree.tsx`, compute the entry's `_default.md` path (same formula used for `onSelect`) and compare it to `selectedFilePath` (both normalised to forward slashes)
- [x] 2.2 Apply `bg-muted` class to the entry row button when the paths match, replacing the default `hover:bg-muted/60` only style

## 3. Highlight note items

- [x] 3.1 Add `isSelected: boolean` prop to the `NoteItem` component
- [x] 3.2 In `NoteItem`, apply `bg-muted` class when `isSelected` is true (in addition to or replacing `hover:bg-muted/60`)
- [x] 3.3 Pass `selectedFilePath` into `SubfolderNode` so it can compute `isSelected` for each note it renders
- [x] 3.4 When rendering direct note items under an entry, compute each note's path and pass `isSelected={normalised path === normalised selectedFilePath}` to `NoteItem`
- [x] 3.5 When rendering sub-folder note items inside `SubfolderNode`, do the same path comparison and pass `isSelected` to `NoteItem`

## 4. Update specs

- [x] 4.1 In `openspec/specs/date-tree/spec.md`, add the "DateTree accepts selectedFilePath prop and highlights the active entry row" requirement
- [x] 4.2 In `openspec/specs/entry-children-ui/spec.md`, add the "Note items highlight when their path matches selectedFilePath" requirement

## 5. Verify

- [x] 5.1 Open an entry note and confirm the entry row in the DateTree is highlighted
- [x] 5.2 Open a sub-note and confirm that note's row is highlighted (not the parent entry row)
- [x] 5.3 Open a note inside a sub-folder and confirm the correct sub-folder note row is highlighted
- [x] 5.4 Switch between notes and confirm the highlight moves to the newly selected row
