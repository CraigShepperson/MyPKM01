## Why

The current "add subfolder / note" action is a tiny `+` hover button on each entry row, which is hard to discover and awkward to use — users must hover precisely over an entry to reveal it, then navigate a two-option inline menu. Replacing this with two dedicated, always-visible AppBar buttons ("Add Subfolder" and "Add Note") makes the most common authoring actions immediately accessible and supports operating on nested locations (subfolders within entries).

## What Changes

- Add two icon buttons to the AppBar topbar: **Add Subfolder** (`FolderPlus`) and **Add Note** (`FilePlus`)
- Introduce a **focused tree item** concept in `DateTree`: the last-clicked entry or subfolder row becomes the focused location
- When an AppBar button is clicked, the corresponding item is created at the focused location:
  - Focused on an entry → subfolder created inside the entry / note created in the entry root
  - Focused on a subfolder → subfolder creation is disabled (no nested subfolders) / note created inside that subfolder
- The AppBar buttons are disabled (visually muted, non-interactive) when no tree item is focused
- The existing hover `+` button on `EntryItem` rows is removed (replaced by the AppBar buttons)
- `DateTree` exposes a `focusedItem` state upward so `App` can pass the focused location to the AppBar button handlers

## Capabilities

### New Capabilities

- `appbar-quick-create`: Two AppBar buttons (Add Subfolder, Add Note) that create a child item at the currently focused tree location. Covers button rendering, enabled/disabled states, and wiring to the create Tauri commands.

### Modified Capabilities

- `date-tree`: Add a "focused tree item" concept — clicking an entry or subfolder row sets it as the focused item. Expose the focused item to the parent via a callback prop. Remove the inline hover `+` button from `EntryItem`. The inline `AddMenu` / `AddInput` flow triggered from the AppBar replaces the hover flow.

## Impact

- `src/App.tsx` — adds two AppBar buttons and manages focused-item state fed from `DateTree`
- `src/components/DateTree.tsx` — adds focused-item tracking, new `onFocusItem` prop, removes hover `+` button on `EntryItem`
- `src/components/AppShell.tsx` — no structural changes; new buttons injected via existing `topbarContent` prop
- No backend changes — existing `create_entry_subfolder` and `create_entry_note` Tauri commands are reused
