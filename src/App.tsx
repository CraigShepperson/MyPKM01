import { AppShell } from "./components/AppShell";
import { BlockNoteEditor } from "./components/editor/BlockNoteEditor";
import { EditorBoundary } from "./components/editor/EditorBoundary";

function App() {
  return (
    <AppShell
      rightPanel={
        <EditorBoundary>
          <BlockNoteEditor />
        </EditorBoundary>
      }
    />
  );
}

export default App;
