## 1. Gate the editor in App.tsx

- [x] 1.1 In `src/App.tsx`, replace the unconditional `<EditorBoundary><BlockNoteEditor filePath={selectedFilePath} /></EditorBoundary>` passed to `rightPanel` with a conditional: when `selectedFilePath` is non-null render the editor, otherwise render a placeholder `<div>` with centred hint text (e.g. "Select an entry to begin editing") styled `flex items-center justify-center h-full text-xs text-muted-foreground`
