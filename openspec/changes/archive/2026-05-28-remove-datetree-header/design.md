## Context

`DateTree` currently owns three things that belong elsewhere:

1. A header bar (`div` with "Timeline" label, border-b, and `+` button) that occupies ~38px of left-panel height
2. `createModalOpen` state and the `CreateEntryModal` render — modal state lives in the wrong component because the trigger is moving to the topbar
3. A fetch loop (`fetchTree`) that needs to be callable from outside the component when the modal closes successfully

`AppShell` has a 44px topbar that is currently empty. The topbar already spans full width per the unified-topbar spec. The `+` button should live there as the primary creation action.

## Goals / Non-Goals

**Goals:**
- Remove the header section from `DateTree` entirely (no label, no border, no button)
- Surface a `+` icon button in the `AppShell` topbar that opens `CreateEntryModal`
- Keep `CreateEntryModal` wired correctly: on success the `DateTree` re-fetches its data

**Non-Goals:**
- Redesigning the topbar layout beyond adding the `+` button
- Changing `CreateEntryModal` internals
- Adding any other topbar actions

## Decisions

### 1. Lift modal state to `App.tsx`, not `AppShell`

**Decision:** `createModalOpen` state and `CreateEntryModal` render move to `App.tsx`.

`AppShell` is a pure layout shell — it should not own application state. `App.tsx` already owns `vaultPath` and `selectedFilePath`; modal state fits naturally there. `AppShell` receives a `topbarContent?: ReactNode` prop and renders whatever is passed in.

*Alternative considered:* Move modal into `AppShell` directly. Rejected — couples layout to domain logic.

### 2. `refreshKey` counter prop to trigger `DateTree` re-fetch

**Decision:** `DateTree` gains an optional `refreshKey?: number` prop. When the value changes, `DateTree` re-runs `fetchTree`.

This is a well-understood React pattern for imperatively triggering a side-effect without refs or callbacks. `App.tsx` increments `refreshKey` in the `CreateEntryModal` `onSuccess` handler.

*Alternative considered:* `forwardRef` + `useImperativeHandle` to expose `refresh()`. More boilerplate, harder to test, and breaks the unidirectional data flow convention already used in the component.

*Alternative considered:* Global event bus / context. Overkill for two components.

### 3. `+` button rendered in `App.tsx`, passed via `topbarContent`

**Decision:** `App.tsx` renders the `Plus` icon button inline and passes it to `AppShell` as `topbarContent`. Styling matches the existing ghost-button pattern used in the old header (`w-5 h-5 rounded hover:bg-muted/60`).

`AppShell` renders `topbarContent` in a `flex items-center gap-2` container on the right side of the topbar.

## Risks / Trade-offs

- **`refreshKey` counter is a blunt instrument** → if multiple independent refresh triggers are added later, callers must coordinate increment. Acceptable for now; a dedicated context/store can replace it without changing the prop interface.
- **`DateTree` loses its own `+` affordance** → users who discover the tree first may not see the topbar button. Mitigated by consistent topbar placement (standard desktop convention).

## Migration Plan

1. Add `topbarContent?: ReactNode` to `AppShellProps` and render it in the topbar
2. Add `refreshKey?: number` prop to `DateTreeProps`; add a `useEffect` that calls `fetchTree()` when `refreshKey` changes (skip on mount since the existing mount effect already fetches)
3. Remove the header block from `DateTree` render; remove `createModalOpen` state and `CreateEntryModal` render from `DateTree`
4. In `App.tsx`: add `createModalOpen` + `refreshKey` state; render `CreateEntryModal`; pass `+` button to `AppShell`; pass `refreshKey` to `DateTree`

No data migrations or rollback concerns — this is a pure UI refactor.
