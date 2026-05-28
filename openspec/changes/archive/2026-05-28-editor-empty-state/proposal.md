## Why

The editor currently mounts unconditionally — even when no entry is selected, a blank BlockNote editor sits in the right panel. This wastes resources and is visually confusing. The right panel should show a neutral placeholder until the user selects an entry.

## What Changes

- When no entry is selected (`selectedFilePath` is null), the right panel displays a placeholder ("Select an entry to start editing" or similar) instead of mounting the editor
- `BlockNoteEditor` is only rendered when `selectedFilePath` is a non-null string
- The gating logic lives in `App.tsx` — the right panel prop receives either the editor or the placeholder based on `selectedFilePath`

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `editor-layer`: The scenario "Editor renders empty when filePath is null" changes — the editor SHALL NOT mount when `filePath` is null; instead a placeholder is shown in the right panel

## Impact

- `src/App.tsx` — conditionally pass `<EditorBoundary><BlockNoteEditor /></EditorBoundary>` or a placeholder `<div>` to `AppShell`'s `rightPanel` prop based on `selectedFilePath`
