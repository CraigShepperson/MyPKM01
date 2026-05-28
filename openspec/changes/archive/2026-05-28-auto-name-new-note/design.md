## Context

"New note" creation currently flows through `setAddInput` (which shows the `AddInput` inline text component), then `confirmAdd` (which reads the user's input and calls `create_entry_note`). This is the same code path used for "New folder". The `pendingAdd` effect in `DateTree` already loads `entryChildren` for the target entry before showing the input, so when the note type path runs, the current children list is already available.

The `AddInput` component and the `addInput` state are also used by `SubfolderNode` for its own "New note" trigger.

## Goals / Non-Goals

**Goals:**
- "New note" creates a file immediately without any text input
- Auto-generates the filename: `untitled.md`, falling back to `untitled-1.md`, `untitled-2.md`, etc.
- The newly created note is auto-selected and opened in the editor
- "New folder" retains its existing inline-input behaviour unchanged

**Non-Goals:**
- Changing the folder creation flow
- Adding any undo/undo capability for accidental note creation
- Backend changes — all logic is handled client-side

## Decisions

### 1. Auto-name resolution: client-side from loaded children

The `pendingAdd` effect already ensures `entryChildren` is populated before proceeding. Given the children list is available, the frontend can compute the first free name without any extra IPC:

```
candidates = ["untitled.md", "untitled-1.md", "untitled-2.md", ...]
existing   = Set of filenames from entryChildren (direct notes + subfolder notes)
pick first candidate not in existing
```

For subfolder notes, the same logic runs against `subfolder.notes`.

**Alternative considered**: Retry loop against the backend (call `create_entry_note`, catch `InvalidInput`, increment counter). Rejected — requires multiple round trips when collisions exist; the children list is already in memory.

### 2. Code path: branch on `type` inside the `pendingAdd` effect

Rather than routing through `confirmAdd` (which expects a user-typed string), the `pendingAdd` effect branches:

- `type === "folder"` → existing `setAddInput` path, no change
- `type === "note"` → compute auto-name, call `create_entry_note` directly, refresh children, auto-select the note

This keeps `AddInput` and `confirmAdd` untouched for folders. The `AddInput` component is no longer rendered for notes.

### 3. SubfolderNode: same branch, different children source

`SubfolderNode`'s "New note" trigger currently calls `onAddNoteConfirm` (which is `confirmAdd`). The subfolder case needs the same auto-name treatment. The subfolder's own `notes` array (already rendered as children) is used to find collisions.

The cleanest approach: add an `onAddNoteAuto` prop to `SubfolderNode` (distinct from `onAddNoteConfirm`) that accepts no argument and triggers the auto-create path.

### 4. Auto-select after creation: call handleNoteClick equivalent

After `create_entry_note` succeeds, call the existing `handleNoteClick(date, entry, filename, subfolder?)` to fire `onSelect` with the new file's absolute path. This opens the note in the editor and sets the title to `"untitled"` immediately.

## Risks / Trade-offs

- **Race condition if children are stale**: If another client creates `untitled.md` between the children load and the `create_entry_note` call, the backend returns `InvalidInput`. Mitigation: fall back to a sequential retry (try `untitled-1.md`, `untitled-2.md`, etc.) up to a reasonable limit (e.g. 20).
- **`addInput` still rendered for notes**: The `renderEntryChildren` template currently renders `<AddInput>` when `addInput?.type` is either folder or note. After this change, `addInput` will never be set for notes, so the render guard effectively becomes dead code for notes — no regression, but the `addInput.type === "folder"` check should be explicit to avoid confusion.
