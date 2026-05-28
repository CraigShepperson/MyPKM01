## 1. Backend: rename_entry Tauri command

- [x] 1.1 Add `rename_entry_impl(vault_root, date, entry_id, title)` to `src-tauri/src/vault/timeline.rs` — reads `_default.md`, replaces the `title:` value in YAML frontmatter while preserving all other keys and the body, then writes the file back
- [x] 1.2 Add `#[tauri::command] pub fn rename_entry(...)` in `src-tauri/src/vault/timeline.rs` that resolves vault root from state and delegates to `rename_entry_impl`
- [x] 1.3 Add `rename_entry` to the `use vault::{ ... }` import list and `invoke_handler` in `src-tauri/src/lib.rs`

## 2. DateTree: onSelect signature update

- [x] 2.1 Change the `onSelect` prop type in `DateTree` from `(filePath: string) => void` to `(payload: { filePath: string; meta: EntryMeta }) => void`
- [x] 2.2 Update `handleEntryClick(date, entryId)` to `handleEntryClick(date, entry: EntryMeta)` and emit `{ filePath, meta: entry }` instead of a bare string
- [x] 2.3 Update `handleNoteClick(date, entryId, filename, subfolder?)` to `handleNoteClick(date, entry: EntryMeta, filename, subfolder?)` and emit `{ filePath, meta: entry }`
- [x] 2.4 Update the `renderEntry` call site (`onSelect={() => handleEntryClick(date, entry.id)}` → `handleEntryClick(date, entry)`) and the two `handleNoteClick` call sites inside `renderEntryChildren` to pass the `entry` argument

## 3. App.tsx: selectedEntry state

- [x] 3.1 Add `selectedEntry: EntryMeta | null` state (import `EntryMeta` from `./lib/timeline`) and update the `onSelect` handler on `DateTree` to destructure `{ filePath, meta }` and set both `selectedFilePath` and `selectedEntry`
- [x] 3.2 Reset `selectedEntry` to `null` wherever `selectedFilePath` is reset to `null` (e.g. on vault change or unmount)

## 4. NoteTitle component

- [x] 4.1 Create `src/components/editor/NoteTitle.tsx` — a controlled `<input type="text">` with no default input styling, Tailwind classes `text-[2em] font-bold leading-[1.3] w-full outline-none bg-transparent px-[54px] pt-8 pb-2`, accepting `value`, `onChange`, and `onEnter` (callback to focus editor) props

## 5. NotePanel component

- [x] 5.1 Create `src/components/editor/NotePanel.tsx` accepting `filePath: string` and `title: string` props; render `<NoteTitle>` above `<BlockNoteEditor>` in a `flex flex-col h-full` container
- [x] 5.2 Parse `date` and `entryId` from `filePath` using the existing `parseFilePath` helper (move or re-export it from `BlockNoteEditor.tsx` so `NotePanel` can call it)
- [x] 5.3 Maintain local `titleValue` state initialised from the `title` prop; reset it when `title` prop changes to a new value (entry switch)
- [x] 5.4 On `titleValue` change, debounce 500 ms then call `invoke('rename_entry', { date, entryId, title: titleValue.trim() })`, skipping the call if the trimmed value is empty
- [x] 5.5 Cancel the pending debounce timer on `filePath` change and on component unmount

## 6. App.tsx: wire NotePanel into the right panel

- [x] 6.1 Replace the `<BlockNoteEditor filePath={selectedFilePath} />` render in `App.tsx` with `<NotePanel filePath={selectedFilePath} title={selectedEntry?.title ?? ""} />` and update the import
