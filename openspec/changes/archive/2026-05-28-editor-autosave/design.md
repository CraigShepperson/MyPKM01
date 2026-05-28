## Context

`BlockNoteEditor` loads content by calling `editor.replaceBlocks(editor.document, blocks)` inside a `useEffect` that fires on `filePath` changes. `BlockNoteViewRaw` exposes an `onChange` prop that fires on every document mutation. `write_entry_file` is already a registered Tauri command.

The main implementation challenge is suppressing saves during the load phase: `replaceBlocks` triggers `onChange`, which would immediately write the just-loaded content back to disk — a harmless no-op but a wasted IPC call, and potentially a race if the read and write overlap.

## Goals / Non-Goals

**Goals:**
- Save document content to disk ~1 second after the user stops typing
- Never write during the initial content load or when switching entries
- Use the existing `write_entry_file` command — no backend changes

**Non-Goals:**
- Save indicator / "saved" status in the UI
- Conflict resolution or collaborative editing
- Configurable debounce interval

## Decisions

### 1. Debounce via `useRef` + `setTimeout` — no external library

A `debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)` is sufficient. In the `onChange` handler: clear the previous timer and schedule a new one for 1000ms. On unmount (or `filePath` change), clear the timer in the `useEffect` cleanup. This is idiomatic React and avoids a dependency.

*Alternative considered:* `useDebouncedCallback` from `use-debounce`. Adds a dependency for trivial functionality.

### 2. Guard saves with `isSavingEnabled` ref

A `isSavingEnabled = useRef(false)` flag prevents saves during load:

1. On `filePath` change: set `isSavingEnabled.current = false` before calling `replaceBlocks`
2. After `replaceBlocks` resolves: schedule `setTimeout(() => { isSavingEnabled.current = true; }, 0)` to re-enable saving after the current microtask queue drains (i.e., after `onChange` has fired for the load)
3. In the `onChange` handler: if `!isSavingEnabled.current`, return immediately — no save scheduled

This cleanly suppresses the load-triggered `onChange` without needing to count or track individual block mutations.

*Alternative considered:* Cancel the debounced save if it fires while a load is in progress. Less precise — the load and save can race if the user types immediately after selecting an entry.

### 3. Serialize with `editor.blocksToMarkdownLossy(editor.document)`

Matches the inverse of the existing load path (`editor.tryParseMarkdownToBlocks`). "Lossy" is acceptable — the vault format is markdown and BlockNote's custom block types (if any) degrade gracefully.

### 4. Re-use parsed `filePath` for the write call

The `parseFilePath` helper already runs in the load effect. Extract its result to a variable accessible by the `onChange` handler (both live in the same component scope). No new parsing logic needed.

## Risks / Trade-offs

- **1-second debounce means up to 1 second of data loss on crash** — acceptable for a local desktop app; the alternative (save on every keystroke) is worse for performance.
- **`blocksToMarkdownLossy` may reformat the file** — whitespace and some markdown constructs may change on first save of an existing file. One-time, deterministic — not a problem in practice.
- **Unmount before debounce fires** — mitigated by clearing the timer in the `useEffect` cleanup. The `useEffect` that owns the debounce timer cleans up when `filePath` changes or the component unmounts.
