## 1. Implement auto-save in BlockNoteEditor

- [x] 1.1 Add `isSavingEnabled = useRef(false)` and `debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)` to `BlockNoteEditor` in `src/components/editor/BlockNoteEditor.tsx`
- [x] 1.2 In the existing `filePath` load `useEffect`: set `isSavingEnabled.current = false` before calling `replaceBlocks`, then schedule `setTimeout(() => { isSavingEnabled.current = true; }, 0)` after it to re-enable saving once the load-triggered `onChange` has fired; also clear `debounceTimer.current` at the top of the effect and return a cleanup that clears it too
- [x] 1.3 Add an `onChange` handler passed to `BlockNoteViewRaw`: if `!isSavingEnabled.current` return early; otherwise clear any pending `debounceTimer` and set a new one for 1000ms that serializes the document with `editor.blocksToMarkdownLossy(editor.document)` and calls `invoke('write_entry_file', parsed)` with the parsed filePath params; log errors to `console.error`
