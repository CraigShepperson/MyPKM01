## Why

The "New note" flow currently shows an inline text input that requires the user to type a name before the note is created. Now that notes can be renamed instantly via the title bar, this extra step is unnecessary friction — the note should appear immediately so the user can start writing.

## What Changes

- Selecting **New note** (from an entry or sub-folder) no longer shows an inline text input
- The note is created immediately with the filename `untitled.md`
- If `untitled.md` already exists in that location, the filename SHALL be `untitled-1.md`, then `untitled-2.md`, and so on until an available name is found
- The newly created note SHALL be selected and opened in the editor automatically after creation
- **New folder** retains its existing inline-input prompt (folder names are not easily changed after creation)

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
- `entry-children-ui`: The "New note" requirement changes — the inline name-input step is removed and replaced with immediate auto-named creation

## Impact

- `src/components/DateTree.tsx` — remove inline input for note creation; add auto-name resolution and immediate `create_entry_note` invocation
- `src/App.tsx` — may need to open the new note in the editor after creation (auto-select)
- No backend changes required — collision detection uses the existing `create_entry_note` `InvalidInput` response as a retry signal
