## 1. Backend: Timeline module scaffold

- [x] 1.1 Create `src-tauri/src/vault/timeline.rs` and declare it in `vault/mod.rs`
- [x] 1.2 Define `EntryMeta` struct with fields `id: String`, `title: String`, `entry_type: String` — derive `Serialize`, `Clone`, `Debug`
- [x] 1.3 Define `DayListing` struct with fields `date: String`, `entries: Vec<EntryMeta>` — derive `Serialize`, `Clone`, `Debug`

## 2. Backend: list_timeline command

- [x] 2.1 Implement helper `parse_entry_meta(entry_dir: &Path) -> EntryMeta` that reads `_config.md`, extracts `title` and `type` from YAML frontmatter via `gray_matter`, and falls back to folder name / `"unknown"` on any failure
- [x] 2.2 Implement `list_timeline` Tauri command: reads vault root from `VaultState`, returns `VaultError` if no vault configured
- [x] 2.3 Walk `timeline/` with `walkdir` (depth 1 for date folders, depth 1 within each for entry folders); build and return `Vec<DayListing>`
- [x] 2.4 Write unit tests: populated timeline returns correct listings; missing `_config.md` falls back gracefully; malformed frontmatter falls back gracefully; empty timeline returns empty vec

## 3. Backend: read_entry_file command

- [x] 3.1 Implement `strip_frontmatter(content: &str) -> String` helper that removes the leading `---`…`---` YAML block and returns only the markdown body
- [x] 3.2 Implement `read_entry_file` Tauri command: accepts `date`, `entry_id`, `filename`; constructs path `timeline/<date>/<entry_id>/<filename>`; calls `strip_frontmatter` when `filename == "_config.md"`; returns `VaultError::IoError` on missing file
- [x] 3.3 Write unit tests: reading `_config.md` returns body only; reading another file returns full content; missing file returns error

## 4. Backend: write_entry_file command and registration

- [x] 4.1 Implement `write_entry_file` Tauri command: accepts `date`, `entry_id`, `filename`, `content`; writes to `timeline/<date>/<entry_id>/<filename>`; returns `VaultError::IoError` if parent folder does not exist
- [x] 4.2 Register `list_timeline`, `read_entry_file`, `write_entry_file` in `tauri::generate_handler!` in `lib.rs`
- [x] 4.3 Export new commands from `vault/mod.rs`

## 5. Frontend: types and mapTimelineToTree

- [x] 5.1 Create `src/lib/timeline.ts` and define TypeScript types: `EntryMeta`, `DayListing`, `TreeDay`, `TreeMonth`, `TreeYear`
- [x] 5.2 Implement `mapTimelineToTree(days: DayListing[]): TreeYear[]` — parse `YYYY-MM-DD` date strings, group by year → month → day, sort all levels descending (newest first), use English full month names
- [x] 5.3 Write Vitest unit tests for `mapTimelineToTree`: multiple dates group correctly; empty input returns empty array; years sorted descending; months sorted descending within a year

## 6. Frontend: DateTree component

- [x] 6.1 Create `src/components/DateTree.tsx` accepting props `vaultRoot: string`, `onSelect: (filePath: string) => void`
- [x] 6.2 On mount call `invoke<DayListing[]>('list_timeline')`, pass result through `mapTimelineToTree`, store in component state
- [x] 6.3 Render collapsible year nodes; auto-expand the most recent year on initial render
- [x] 6.4 Render collapsible month nodes within each year; auto-expand the most recent month within the most recent year on initial render
- [x] 6.5 Render collapsible day nodes within each month; all days start collapsed
- [x] 6.6 Render entry items within each day: show `title` and a type badge for `entry_type`
- [x] 6.7 On entry click, call `onSelect` with `{vaultRoot}/timeline/{date}/{entry_id}/_config.md`
- [x] 6.8 Register `window.addEventListener('focus', refetch)` on mount; remove it on unmount; refetch calls `invoke('list_timeline')` and updates tree state
- [x] 6.9 Render an empty-state message when `list_timeline` returns an empty array

## 7. Frontend: App wiring

- [x] 7.1 Add `selectedFilePath: string | null` state to `App.tsx` (initialise to `null`)
- [x] 7.2 Pass `<DateTree vaultRoot={vaultPath} onSelect={setSelectedFilePath} />` as the `leftPanel` prop to `AppShell`
- [x] 7.3 Pass `selectedFilePath` as a prop down to `BlockNoteEditor`

## 8. Frontend: BlockNoteEditor file loading

- [x] 8.1 Add `filePath: string | null` prop to `BlockNoteEditor`
- [x] 8.2 Parse `filePath` into `{ date, entryId, filename }` (split on path separator, extract last three segments)
- [x] 8.3 On mount and whenever `filePath` changes (use `useEffect` with `filePath` dependency): if `filePath` is non-null, call `invoke<string>('read_entry_file', { date, entryId, filename })`
- [x] 8.4 Convert returned content with `await editor.tryParseMarkdownToBlocks(content)` then load via `editor.replaceBlocks(editor.document, blocks)`
- [x] 8.5 Handle `invoke` rejection gracefully — log the error, do not crash; leave editor content unchanged

## 9. Smoke test

- [x] 9.1 Run the app with a configured vault; confirm the left panel shows the date tree (or empty state if timeline is empty)
- [x] 9.2 Manually create `timeline/YYYY-MM-DD/<unique-id>/_config.md` in the vault with `title` and `type` frontmatter fields; alt-tab back to the app; confirm the entry appears in the tree without a restart
- [x] 9.3 Click the entry in the tree; confirm its `_config.md` body content loads in the BlockNote editor
