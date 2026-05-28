## Context

The editor panel currently renders `BlockNoteEditor` with a `filePath` prop pointing to a note's `_default.md`. When that file is read, the backend (`read_entry_file`) strips YAML frontmatter and returns only the body. The entry title lives exclusively in frontmatter (`title: <value>`) and is never surfaced in the editor panel. `App.tsx` holds `selectedFilePath: string | null` but no title state. The `DateTree` component has `EntryMeta` objects (which include `title`) at selection time but currently only emits a `filePath` string via `onSelect`.

There is no existing `rename_entry` Tauri command. Title writes would need to mutate frontmatter in `_default.md` — a pattern already handled server-side in `write_entry_file_impl`.

## Goals / Non-Goals

**Goals:**
- Display the selected entry's title in an editable field above the BlockNote editor
- Style the title field to visually match BlockNote's H1 heading (font-size, weight, line-height)
- Persist title edits back to `_default.md` frontmatter via a new Tauri command
- Hide the title field when no entry is selected (mirrors existing placeholder behaviour)

**Non-Goals:**
- Renaming the entry folder on disk (entry IDs are immutable directory names)
- Updating the title in the DateTree sidebar in real-time as the user types (refresh on blur/save is sufficient)
- Title validation or length limits beyond basic empty-string guarding

## Decisions

### 1. Title data flow: pass title alongside filePath from DateTree

The `DateTree` `onSelect` callback currently emits only a `filePath` string. At selection time, `DateTree` already has the full `EntryMeta` (including `title`). The cleanest change is to add a parallel `selectedEntry: EntryMeta | null` state in `App.tsx` and update `DateTree`'s `onSelect` to emit `{ filePath: string; meta: EntryMeta }`.

**Alternative considered**: Read `_default.md` again in the editor to extract the title. Rejected — it duplicates the read the editor body load already performs, and adds latency.

**Alternative considered**: Add a `get_entry_meta` Tauri command. Rejected — the data is already available on the frontend at selection time; no round-trip needed.

### 2. Title persistence: new `rename_entry` Tauri command

Title changes must update the YAML frontmatter `title` field in `_default.md`. The backend already has `extract_frontmatter` / `strip_frontmatter` helpers in `timeline.rs`. A new `rename_entry(date, entry_id, title)` command will read `_default.md`, replace the frontmatter title field, and write it back. This keeps frontmatter mutation server-side where the parsing logic already lives.

**Alternative considered**: Perform frontmatter replacement on the frontend (string manipulation). Rejected — fragile; duplicates parsing logic; frontmatter handling belongs in Rust.

Debounce the rename call on the frontend (500ms after last keystroke) to avoid rapid IPC calls while typing.

### 3. H1 style matching: use BlockNote CSS custom properties directly

BlockNote's H1 content block (`[data-content-type="heading"][data-level="1"]`) renders at `font-size: 2em; font-weight: 700; line-height: 1.3` using its own stylesheet (`@blocknote/react/style.css`). The title `<div contenteditable>` (or `<textarea>`) will use inline Tailwind classes that mirror these values: `text-[2em] font-bold leading-[1.3]`. Because the editor uses `theme="light"`, we can also read the `--bn-*` CSS variables if needed for color. Using a single-line `<input type="text">` is acceptable since titles are one line.

**Alternative considered**: Wrap the title in a dummy BlockNote heading block. Rejected — unnecessary complexity; we do not want BlockNote's toolbar/side-menu appearing on the title.

### 4. Component structure: new `NotePanel` wrapper component

Extract the title + editor pair into a `NotePanel` component (`src/components/editor/NotePanel.tsx`). It accepts `filePath: string` and `title: string` and renders:
```
<div className="flex flex-col h-full">
  <NoteTitle … />
  <BlockNoteEditor … />
</div>
```
`App.tsx` renders `<NotePanel>` only when `selectedFilePath` is non-null, keeping the null-guard logic in one place.

## Risks / Trade-offs

- **Frontmatter mutation bug** → The new `rename_entry` command must preserve all existing frontmatter keys (type, source, etc.); a naive regex replace risks corrupting them. Mitigation: parse the YAML fully using the existing `gray_matter`/`matter` approach, replace the title key only, and re-serialise.
- **H1 style drift** → BlockNote upgrades may change H1 dimensions. Mitigation: the title's Tailwind classes are a one-line change; accept the drift risk given the low upgrade frequency.
- **DateTree refresh lag** → The sidebar still shows the old title until the tree is refreshed (which currently requires a full `refreshKey` bump). Mitigation: this is acceptable for v1; a live sidebar update can be addressed in a follow-up.
- **`onSelect` signature change** → Changing `DateTree`'s `onSelect` from `(filePath: string) => void` to `(payload: { filePath: string; meta: EntryMeta }) => void` is a breaking change to that component's contract. Impact is limited to `App.tsx` (the only caller); no external consumers.
