## Context

`App.tsx` passes the right panel to `AppShell` as a `rightPanel` prop. Currently it always passes `<EditorBoundary><BlockNoteEditor filePath={selectedFilePath} /></EditorBoundary>`. The `BlockNoteEditor` component then handles the null case by rendering an empty editor. The change moves the gate one level up so the editor is never mounted at all when nothing is selected.

## Goals / Non-Goals

**Goals:**
- Right panel shows a neutral placeholder when no entry is selected
- `BlockNoteEditor` never mounts until `selectedFilePath` is non-null

**Non-Goals:**
- Animated transition between placeholder and editor
- Persisting editor state across selection changes

## Decisions

### Gate in `App.tsx`, not inside `BlockNoteEditor`

The `rightPanel` prop already accepts any `ReactNode`. Swapping it based on `selectedFilePath` in `App.tsx` keeps `BlockNoteEditor` focused on editing and avoids mixing placeholder UI into the editor component.

The placeholder is a simple centred `div` with a short hint text, styled to match the existing empty-state pattern used in the left panel (`text-xs text-muted-foreground`).

## Risks / Trade-offs

- Unmounting `BlockNoteEditor` on deselection discards any unsaved editor state. Acceptable — entry content is loaded fresh on each selection and there is currently no auto-save.
