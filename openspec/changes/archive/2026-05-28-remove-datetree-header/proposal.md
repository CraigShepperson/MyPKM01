## Why

The `DateTree` left panel has a "Timeline" header bar (label + `+` button) that consumes vertical space and duplicates UI chrome that belongs in the app topbar. Moving the `+` button to the unified topbar centralises primary creation actions in one consistent location, and removing the header gives the tree more vertical room.

## What Changes

- Remove the header `div` from `DateTree` (the "Timeline" label, border-b, and `+` button)
- Add a `+` (new entry) icon button to the right side of the `AppShell` topbar
- Lift `createModalOpen` state and `CreateEntryModal` rendering out of `DateTree` — the modal needs to be accessible from the topbar and must trigger a `DateTree` refresh on success
- `AppShell` gains a `topbarContent` prop (or equivalent) so `App.tsx` can inject the `+` button
- `DateTree` gains an `onRefresh`-style callback or exposes refresh via prop so the topbar-owned modal can trigger a re-fetch after entry creation

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `app-shell`: Topbar now contains a primary action button (`+`) that opens the new-entry modal; `AppShell` needs a content slot for topbar items
- `date-tree`: Header section (section label + `+` button + `border-b`) is removed; `DateTree` no longer owns `CreateEntryModal` state

## Impact

- `src/components/DateTree.tsx` — remove header block, remove `createModalOpen` state, remove `CreateEntryModal` render; accept a `fetchKey` or `onRefresh` prop for external refresh triggering
- `src/components/AppShell.tsx` — add `topbarContent?: ReactNode` prop; render it in the topbar `div`
- `src/App.tsx` — lift `createModalOpen` state here; render `CreateEntryModal` at app level; pass `+` button to `AppShell` via `topbarContent`; wire `onSuccess` to a callback that `DateTree` can react to (e.g. a `refreshKey` counter prop)
