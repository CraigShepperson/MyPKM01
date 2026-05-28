## Context

`DateTree` already runs expand-to-nearest-future-date logic once on initial load via a `hasSetInitialExpansion` ref guard. The guard prevents re-expansion when the tree data refreshes (which would reset the user's manual collapse/expand state). The "Today" button needs to bypass this guard on demand.

The `AppShell` topbar already has a `topbarContent?: ReactNode` slot. Currently `App.tsx` passes a single `+` button node. Adding a "Today" button means wrapping both buttons in a flex container.

The established pattern for external triggers on `DateTree` is the `refreshKey` counter prop — incrementing it causes a side effect without exposing imperative refs.

## Goals / Non-Goals

**Goals:**
- "Today" button in the topbar that re-expands the tree to the nearest future date on click
- All other year/month/day nodes collapse when the button is clicked
- Button is always visible and always responds (even if today is already in view)

**Non-Goals:**
- Scroll the left panel to the expanded node (out of scope for this change)
- Highlight or animate the today node
- Keyboard shortcut for the same action

## Decisions

### 1. `focusTodayKey` counter prop on `DateTree` — same pattern as `refreshKey`

Incrementing a counter from the parent triggers a `useEffect` in `DateTree`. The effect resets `hasSetInitialExpansion.current = false` and re-runs the expansion logic against the current `tree` state.

*Alternative considered:* `useImperativeHandle` + `forwardRef` to expose a `focusToday()` method. More boilerplate, breaks the top-down data flow convention already established by `refreshKey`.

*Alternative considered:* A shared context or global store. Overkill for two components.

### 2. Extract `expandToToday(tree)` as a reusable function inside `DateTree`

Rather than duplicating the expansion logic, extract it into a named inner function `expandToToday` that both the initial-load effect and the `focusTodayKey` effect can call. This keeps the logic in one place.

### 3. Wrap topbar buttons in a `<div className="flex items-center gap-2">` in `App.tsx`

`topbarContent` is `ReactNode`, so any wrapper is valid. A flex container with `gap-2` keeps the spacing consistent with the existing button style. The "Today" button is placed to the left of the `+` button (the primary create action stays rightmost).

### 4. "Today" button uses a calendar icon from `@phosphor-icons/react`

A `CalendarBlank` (or `CalendarDots`) icon from Phosphor matches the icon library already used throughout the app (e.g. `Plus`, `CaretDown`). Styled the same as the `+` button: `w-5 h-5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors`, with `title="Jump to today"` for tooltip accessibility. Size `14` at `regular` weight gives good visual balance next to the `+` button.

## Risks / Trade-offs

- **`focusTodayKey` collapses user's manual expansions** — intentional; the button's contract is "reset to today's view." If the user had manually expanded other nodes, those are lost. Acceptable for a "jump to today" action.
- **Effect fires on mount if `focusTodayKey` is initialized to a non-zero value** — avoided by initialising to `0` in `App.tsx` and using the existing `isFirstRender` ref guard pattern already on `DateTree`.

## Migration Plan

Pure UI addition. No data migration, no rollback concerns.
