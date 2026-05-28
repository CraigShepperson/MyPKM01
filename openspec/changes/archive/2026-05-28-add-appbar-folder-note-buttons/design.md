## Context

The current "add subfolder / note" action lives entirely inside `DateTree` as a hover-triggered `+` button on each `EntryItem` row. Clicking it opens an inline two-option `AddMenu`, which then transitions to an inline `AddInput` for naming. This pattern is self-contained but invisible until hover, and tightly couples the creation trigger to the tree row.

The new design moves the trigger to two persistent AppBar icon buttons while keeping the inline `AddInput` name-entry UX inside `DateTree` (where the tree context already exists). This requires a small amount of cross-component coordination: `App` tracks which tree item is focused and tells `DateTree` when to open an inline input.

## Goals / Non-Goals

**Goals:**
- Two icon buttons (`FolderPlus`, `FilePlus`) always visible in the AppBar
- Buttons reflect valid actions for the currently focused tree item (disabled when no focus, "Add Subfolder" disabled when a subfolder is focused)
- Clicking a button creates the item at the focused location via the existing Tauri commands
- No new Tauri commands or backend changes
- Focused item is set by clicking any entry row or subfolder header

**Non-Goals:**
- Nested subfolders (not supported by the backend)
- Visual "focus ring" highlight on the focused tree row (deferred)
- Keyboard shortcuts for the AppBar buttons (deferred)
- Changing the modal-based entry creation flow (`CreateEntryModal`)

## Decisions

### 1. Focused item as lifted state in App

The focused tree item is stored as state in `App`, not inside `DateTree`. `DateTree` fires an `onFocusItem(item: FocusedItem | null)` callback whenever the user clicks an entry row or a subfolder header. `App` holds `focusedItem` in state and passes button-disabled logic and a `pendingAdd` prop back down.

**Why over internal DateTree state + imperative ref:** The AppBar buttons live in `App`. Lifting the focused item to `App` keeps the data flow unidirectional and avoids `useImperativeHandle` / `forwardRef` complexity. The focused item is small (`{ type, entryId, date, subfolderName? }`) so lifting it is cheap.

### 2. `pendingAdd` prop drives inline AddInput

`App` passes a `pendingAdd: 'folder' | 'note' | null` prop to `DateTree`. When `pendingAdd` changes to a non-null value, `DateTree` opens the inline `AddInput` at the focused item's location (same flow as today, just triggered from outside). `DateTree` calls `onPendingAddDone()` when the input is confirmed or cancelled, letting `App` clear `pendingAdd`.

**Why over lifting AddInput to a modal in App:** The inline input is positioned visually inside the tree next to the target item, giving clear spatial context. A modal would lose that spatial coupling and require duplicating the indent/placement logic. The existing `AddInput` component is reused unchanged.

### 3. Remove hover `+` from EntryItem and SubfolderNode

The hover `+` button on `EntryItem` and the hover `+` button on `SubfolderNode` are removed. The AppBar buttons are the sole creation trigger.

**Why:** Two parallel creation paths (hover button + AppBar button) would be confusing and inconsistent. The AppBar buttons are more discoverable and work for all focus states.

### 4. Clicking entry sets both selectedFilePath and focusedItem

The existing `onSelect` handler already navigates to the entry. Clicking an entry row now also fires `onFocusItem` with that entry. No second click needed — selecting and focusing are the same action.

For subfolders: clicking the subfolder header (expand/collapse) also fires `onFocusItem` with that subfolder. This is the only way to focus a subfolder.

### 5. FocusedItem type

```ts
type FocusedItem =
  | { type: 'entry';     entryId: string; date: string }
  | { type: 'subfolder'; entryId: string; date: string; subfolderName: string };
```

Stored in `App` state, serialised as plain object (no class). Nulled out only on full tree refresh (to avoid stale references after a refetch).

## Risks / Trade-offs

- **Stale focus after refetch** → `focusedItem` is cleared when `fetchTree` runs in `DateTree` (via `onFocusItem(null)` call from DateTree's fetch effect). This means the AppBar buttons temporarily disable after a refresh. Acceptable — the user can click any item again.
- **No visual focus indicator** → Users must remember which item was last clicked. Deferred; can be added later as a subtle background highlight without spec changes.
- **Subfolder focus only via header click** → Clicking a note inside a subfolder does NOT move focus to the subfolder. Acceptable for now; the common case is clicking the subfolder itself before adding a note to it.

## Migration Plan

Pure frontend change. No migrations, feature flags, or backend deployments needed. The existing `AddMenu` component becomes unused and can be deleted.
