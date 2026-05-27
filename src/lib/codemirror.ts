/**
 * CodeMirror 6 barrel — verifies all core symbols resolve at build time.
 * The raw editor is not wired to UI in the scaffold; this file is the
 * integration point for future `CodeMirrorRawEditor` component work.
 */
export { EditorView } from "@codemirror/view";
export { EditorState } from "@codemirror/state";
export { markdown } from "@codemirror/lang-markdown";
