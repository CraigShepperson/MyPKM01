## Why

The editor panel currently shows note content with no visible title, leaving users without a clear heading for the note they are editing. Surfacing the title as an editable H1-styled field above the editor gives users immediate context and a natural way to rename notes without leaving the editor.

## What Changes

- Add an editable title field rendered above the `BlockNoteEditor` component
- Style the title input to match the H1 heading style used inside the BlockNote editor (font size, weight, and color)
- The field reads the entry title from the loaded note's frontmatter/metadata
- Editing the field writes the updated title back to the entry (via the same persistence mechanism used by the editor)
- The title field is only shown when an entry is selected (mirrors the existing placeholder behaviour for `filePath === null`)

## Capabilities

### New Capabilities
- `note-title-editor`: Editable title field displayed above the note body, styled as H1, reading from and writing to the entry title

### Modified Capabilities
- `editor-layer`: The editor panel layout changes to include the title field above the BlockNote editor area

## Impact

- `src/components/BlockNoteEditor.tsx` (or equivalent editor panel component) — layout addition
- Tauri commands: likely `rename_entry` or equivalent to persist title changes; may require investigation
- Existing `editor-layer` spec gains a new layout requirement
