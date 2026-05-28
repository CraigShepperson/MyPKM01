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
