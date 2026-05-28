## 1. DateTree — add focusTodayKey prop

- [x] 1.1 Add `focusTodayKey?: number` to `DateTreeProps` in `src/components/DateTree.tsx`
- [x] 1.2 Extract the expand-to-nearest-future-date logic from the initial-load `useEffect` into a named inner function `expandToToday(tree: TreeYear[])` that calls `setExpandedKeys` with the computed set
- [x] 1.3 Update the initial-load `useEffect` to call `expandToToday(tree)` instead of inlining the logic (behaviour unchanged)
- [x] 1.4 Add a `useEffect` that fires when `focusTodayKey` changes (skip initial render via `isFirstRender` ref or a dedicated ref), resets `hasSetInitialExpansion.current = false`, then calls `expandToToday(tree)`

## 2. App — add focusTodayKey state and Today button

- [x] 2.1 Add `focusTodayKey` state (`useState<number>(0)`) to `App.tsx`
- [x] 2.2 Import `CalendarBlank` from `@phosphor-icons/react` in `App.tsx`
- [x] 2.3 Replace the single `+` button node passed to `topbarContent` with a `<div className="flex items-center gap-2">` wrapping both a "Today" calendar button and the existing `+` button; the Today button calls `setFocusTodayKey(k => k + 1)` on click, has `title="Jump to today"`, and uses the same ghost styling as the `+` button (`w-5 h-5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors`)
- [x] 2.4 Pass `focusTodayKey={focusTodayKey}` to `<DateTree>`
