## 1. AppShell — add topbarContent slot

- [x] 1.1 Add `topbarContent?: ReactNode` to `AppShellProps` in `src/components/AppShell.tsx`
- [x] 1.2 Update the topbar `div` to render `topbarContent` right-aligned and vertically centred (e.g. `flex items-center justify-end px-3`)

## 2. DateTree — add refreshKey prop and remove header

- [x] 2.1 Add `refreshKey?: number` to `DateTreeProps` in `src/components/DateTree.tsx`
- [x] 2.2 Add a `useEffect` that calls `fetchTree()` when `refreshKey` changes, skipping the initial render (use a ref guard or `skipFirst` pattern)
- [x] 2.3 Remove the header `div` block (lines containing "Timeline" label, `+` button, and `border-b`) from the `DateTree` render
- [x] 2.4 Remove `createModalOpen` state, the `setCreateModalOpen` calls, and the `<CreateEntryModal>` render from `DateTree`
- [x] 2.5 Remove the `Plus` import from `@phosphor-icons/react` if no longer used in `DateTree`

## 3. App — lift modal state and wire topbar button

- [x] 3.1 Add `createModalOpen` state (`useState<boolean>(false)`) to `App.tsx`
- [x] 3.2 Add `refreshKey` state (`useState<number>(0)`) to `App.tsx`
- [x] 3.3 Import `CreateEntryModal` and `Plus` (from `@phosphor-icons/react`) in `App.tsx`
- [x] 3.4 Render `<CreateEntryModal>` at the `App` level with `open={createModalOpen}`, `onSuccess={() => { setCreateModalOpen(false); setRefreshKey(k => k + 1); }}`, and `onCancel={() => setCreateModalOpen(false)}`
- [x] 3.5 Build the `+` button node: a `<button>` with the same ghost styling as the old header button (`w-5 h-5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors`) that calls `setCreateModalOpen(true)` on click
- [x] 3.6 Pass the `+` button to `AppShell` via `topbarContent`
- [x] 3.7 Pass `refreshKey={refreshKey}` to `<DateTree>`
