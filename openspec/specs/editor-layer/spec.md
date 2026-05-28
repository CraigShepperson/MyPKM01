## ADDED Requirements

### Requirement: BlockNote editor mounts in the right panel
The `@blocknote/react` and `@blocknote/core` packages (v0.46.2) and `@blocknote/code-block` (v0.46.2) SHALL be installed. A `BlockNoteEditor` instance SHALL mount inside the right panel placeholder without runtime errors. The editor may be seeded with empty initial content for the scaffold.

#### Scenario: BlockNote mounts without crashing
- **WHEN** the right panel renders its editor placeholder
- **THEN** a BlockNote editor is visible in the DOM and accepts keyboard input without throwing errors

#### Scenario: Code block support is present
- **WHEN** a code block is inserted into the BlockNote editor
- **THEN** the block renders with syntax highlighting via `@blocknote/code-block` (the language label is visible)

---

### Requirement: CodeMirror 6 is installed and importable
The `codemirror` package and at minimum the `@codemirror/state`, `@codemirror/view`, and `@codemirror/lang-markdown` packages SHALL be installed. A `EditorView` SHALL be importable without build errors. CodeMirror does NOT need to be rendered in the scaffold UI — installation and import verification is sufficient.

#### Scenario: CodeMirror imports resolve
- **WHEN** TypeScript resolves `import { EditorView } from '@codemirror/view'`
- **THEN** no type error is produced and the symbol is defined at runtime

---

### Requirement: Mermaid is installed and lazily importable
`mermaid@11.14.0` SHALL be installed. It SHALL be importable via a dynamic `import('mermaid')` call — never at module top-level. A `MermaidBlock` placeholder component SHALL exist in the codebase that performs the dynamic import and calls `mermaid.initialize()` on mount.

#### Scenario: Dynamic import succeeds
- **WHEN** the `MermaidBlock` component mounts
- **THEN** `mermaid.initialize({ startOnLoad: false })` is called without throwing and no console errors appear

#### Scenario: No top-level mermaid import
- **WHEN** all source files are scanned
- **THEN** no file contains a static `import mermaid from 'mermaid'` at module top-level

---

### Requirement: tldraw is installed and lazily mounted
`tldraw@4.5.10` SHALL be installed. A `WhiteboardPane` component SHALL exist that wraps the tldraw `<Tldraw />` component inside `React.lazy` + `React.Suspense`. The component SHALL render without crashing when shown. Peer dependency conflicts with React 19 SHALL be documented and resolved via `--legacy-peer-deps` if necessary.

#### Scenario: WhiteboardPane renders without crashing
- **WHEN** the `WhiteboardPane` component is rendered in a React tree with a Suspense boundary
- **THEN** the tldraw canvas appears in the DOM and no uncaught errors are thrown

#### Scenario: Lazy boundary isolates failures
- **WHEN** tldraw fails to load (e.g., network error in a test environment)
- **THEN** the Suspense fallback is shown and the rest of the app continues to function

---

### Requirement: BlockNoteEditor accepts a filePath prop and loads file content
The `BlockNoteEditor` component SHALL accept an optional `filePath: string | null` prop. When `filePath` is a non-null string, the component SHALL call `invoke('read_entry_file', { date, entryId, filename })` — with parameters derived by parsing the `filePath` — and populate the editor with the returned content. The content SHALL be converted from markdown to BlockNote block format using `editor.tryParseMarkdownToBlocks(content)` and loaded via `editor.replaceBlocks(editor.document, blocks)`. This load SHALL occur on mount when `filePath` is set, and SHALL re-trigger whenever `filePath` changes to a new value. The `BlockNoteEditor` component SHALL NOT be mounted when `filePath` is `null` or `undefined`; the application SHALL render a placeholder in the right panel instead.

#### Scenario: Editor loads content when filePath is set
- **WHEN** `BlockNoteEditor` is rendered with a valid `filePath` pointing to an existing `_config.md`
- **THEN** the editor displays the markdown body content of that file

#### Scenario: Editor reloads when filePath changes
- **WHEN** the user selects a different entry and `filePath` prop changes to a new path
- **THEN** the editor clears its previous content and displays the content of the new file

#### Scenario: Placeholder shown when no entry is selected
- **WHEN** no entry has been selected (`filePath` is null)
- **THEN** the right panel renders a placeholder element and `BlockNoteEditor` is NOT present in the DOM

#### Scenario: Editor handles read failure gracefully
- **WHEN** `invoke('read_entry_file', ...)` rejects (e.g. file deleted between selection and load)
- **THEN** the editor does not crash; it retains its current content or renders empty

---

### Requirement: BlockNoteEditor auto-saves document changes to disk
When `filePath` is set, `BlockNoteEditor` SHALL subscribe to document change events. After each change, it SHALL debounce for 1000ms and then serialize the current document to markdown using `editor.blocksToMarkdownLossy(editor.document)` and persist it by calling `invoke('write_entry_file', { date, entryId, filename, content })` with the parameters derived from `filePath`. The auto-save SHALL be suppressed during the initial content load and during any subsequent entry switch (i.e. changes triggered by `editor.replaceBlocks` SHALL NOT cause a write). The pending save timer SHALL be cancelled when the component unmounts or `filePath` changes, preventing stale writes.

#### Scenario: User edit triggers a save after debounce
- **WHEN** the user types in the editor and stops for 1 second
- **THEN** `write_entry_file` is called with the current markdown content of the document

#### Scenario: Rapid edits are coalesced into a single save
- **WHEN** the user types continuously without pausing for 1 second
- **THEN** `write_entry_file` is called once after the final keystroke's 1-second debounce, not once per keystroke

#### Scenario: Load does not trigger a save
- **WHEN** `BlockNoteEditor` loads content into the editor via `replaceBlocks` on mount or on `filePath` change
- **THEN** `write_entry_file` is NOT called as a result of that load

#### Scenario: Pending save is cancelled on entry switch
- **WHEN** the user switches to a different entry before the debounce timer fires
- **THEN** the pending write for the previous entry is cancelled and no stale content is written

---

### Requirement: Right panel renders NotePanel as the top-level editor element
When an entry is selected, `App.tsx` SHALL render `<NotePanel filePath={...} title={...} />` (wrapped in `EditorBoundary`) as the right panel content. `BlockNoteEditor` SHALL NOT be rendered directly as the immediate child of `EditorBoundary`; it SHALL be an internal implementation detail of `NotePanel`.

#### Scenario: NotePanel is the direct child of EditorBoundary
- **WHEN** an entry is selected and the right panel renders
- **THEN** `NotePanel` is the component directly inside `EditorBoundary`, not `BlockNoteEditor`

#### Scenario: Placeholder is still shown when no entry is selected
- **WHEN** no entry has been selected (`selectedFilePath` is null)
- **THEN** the right panel renders the "Select an entry to begin editing" placeholder and neither `NotePanel` nor `BlockNoteEditor` is present in the DOM

---

### Requirement: write_entry_file preserves existing YAML frontmatter when overwriting _default.md
When `write_entry_file` is called with `filename = "_default.md"`, the command SHALL read the existing file from disk, extract its YAML frontmatter block (the `---\n…\n---\n` header), and prepend it to the incoming body content before writing to disk. If the existing file has no frontmatter, or if the file cannot be read, the incoming content SHALL be written as-is without error. Files with a filename other than `_default.md` SHALL be written verbatim without frontmatter handling.

#### Scenario: Frontmatter is preserved after a body-only write
- **WHEN** `write_entry_file` is called for `_default.md` with content that contains no frontmatter
- **THEN** the saved file contains the original frontmatter block followed by the new body content

#### Scenario: File with no frontmatter is written unchanged
- **WHEN** `write_entry_file` is called for a `_default.md` that has no existing frontmatter
- **THEN** the incoming content is written to disk verbatim

#### Scenario: Non-default-md files are written verbatim
- **WHEN** `write_entry_file` is called with a filename other than `_default.md`
- **THEN** the content is written to disk without any frontmatter handling

#### Scenario: Unreadable existing file does not block the write
- **WHEN** the existing `_default.md` cannot be read (e.g. it does not yet exist)
- **THEN** the incoming content is written to disk as-is and no error is returned
