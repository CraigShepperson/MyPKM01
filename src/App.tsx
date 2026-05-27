import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppShell } from "./components/AppShell";
import { BlockNoteEditor } from "./components/editor/BlockNoteEditor";
import { EditorBoundary } from "./components/editor/EditorBoundary";
import { Onboarding } from "./components/Onboarding";
import { DateTree } from "./components/DateTree";

function App() {
  // undefined  → IPC call in flight (blank screen)
  // null       → no vault configured → show Onboarding
  // string     → vault path → show main window
  const [vaultPath, setVaultPath] = useState<string | null | undefined>(
    undefined,
  );

  // null → no entry selected; string → absolute path to _config.md
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  useEffect(() => {
    invoke<string | null>("get_vault_path").then(setVaultPath);
  }, []);

  // Loading — IPC call hasn't returned yet
  if (vaultPath === undefined) {
    return null;
  }

  // First run — no vault configured
  if (vaultPath === null) {
    return <Onboarding onSuccess={setVaultPath} />;
  }

  // Vault configured — show the main window
  return (
    <AppShell
      leftPanel={
        <DateTree
          vaultRoot={vaultPath}
          onSelect={setSelectedFilePath}
        />
      }
      rightPanel={
        <EditorBoundary>
          <BlockNoteEditor filePath={selectedFilePath} />
        </EditorBoundary>
      }
    />
  );
}

export default App;
