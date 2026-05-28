## 1. Types and shared state

- [x] 1.1 Add `FocusedItem` discriminated union type to `src/lib/timeline.ts` — `{ type: 'entry'; entryId: string; date: string } | { type: 'subfolder'; entryId: string; date: string; subfolderName: string }`
- [x] 1.2 Add `focusedItem` state (`FocusedItem | null`) and `pendingAdd` state (`'folder' | 'note' | null`) to `App`

## 2. DateTree — focused item tracking

- [x] 2.1 Add `onFocusItem?: (item: FocusedItem | null) => void` prop to `DateTreeProps`
- [x] 2.2 Add internal `focusedItem` ref (mirrors prop callback target) so DateTree knows which item to open the input at when `pendingAdd` arrives
- [x] 2.3 Call `onFocusItem({ type: 'entry', entryId, date })` inside `handleEntryClick` (entry row click)
- [x] 2.4 Call `onFocusItem({ type: 'subfolder', entryId, date, subfolderName })` inside `toggleSubfolder` (subfolder header click)
- [x] 2.5 Call `onFocusItem(null)` after `setTree` inside `fetchTree` to clear stale focus on refetch

## 3. DateTree — pendingAdd prop

- [x] 3.1 Add `pendingAdd?: 'folder' | 'note' | null` and `onPendingAddDone?: () => void` props to `DateTreeProps`
- [x] 3.2 Add `useEffect` that watches `pendingAdd`: when it changes to non-null, open the inline `AddInput` at the focused item's location (call `openAddMenu` equivalent with the internally tracked focused item) and ensure the entry is expanded
- [x] 3.3 Call `onPendingAddDone()` at the end of `confirmAdd` (after success or error) and inside the `AddInput` `onCancel` handler

## 4. DateTree — remove hover + button

- [x] 4.1 Remove the hover `+` button JSX and `hovered` state from `EntryItem`
- [x] 4.2 Remove the `onAddChild` prop from `EntryItem` and all call sites
- [x] 4.3 Remove the hover `+` button JSX and `hovered` state from `SubfolderNode`
- [x] 4.4 Remove the `onAddNote` prop from `SubfolderNode` and all call sites
- [x] 4.5 Delete the `AddMenu` component (no longer used)

## 5. App — AppBar buttons

- [x] 5.1 Import `FolderPlus` and `FilePlus` from `@phosphor-icons/react` in `App.tsx`
- [x] 5.2 Add `handleFocusItem` callback that sets `focusedItem` state; pass as `onFocusItem` to `DateTree`
- [x] 5.3 Add `handlePendingAddDone` callback that clears `pendingAdd`; pass as `onPendingAddDone` to `DateTree`
- [x] 5.4 Pass `pendingAdd` and `onPendingAddDone` props to `DateTree`
- [x] 5.5 Render Add Subfolder button in `topbarContent`: `FolderPlus` icon, `title="Add subfolder"`, disabled when `focusedItem === null || focusedItem.type === 'subfolder'`, `onClick` sets `pendingAdd` to `'folder'`
- [x] 5.6 Render Add Note button in `topbarContent`: `FilePlus` icon, `title="Add note"`, disabled when `focusedItem === null`, `onClick` sets `pendingAdd` to `'note'`
- [x] 5.7 Apply consistent disabled styling to both buttons (match existing AppBar button style; muted + `cursor-not-allowed` when disabled)
