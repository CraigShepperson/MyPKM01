import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CalendarBlank, Plus } from "@phosphor-icons/react";
import { AppShell } from "./components/AppShell";
import { BlockNoteEditor } from "./components/editor/BlockNoteEditor";
import { EditorBoundary } from "./components/editor/EditorBoundary";
import { Onboarding } from "./components/Onboarding";
import { DateTree } from "./components/DateTree";
import { CreateEntryModal } from "./components/CreateEntryModal";

function App() {
  // undefined  → IPC call in flight (blank screen)
  // null       → no vault configured → show Onboarding
  // string     → vault path → show main window
  const [vaultPath, setVaultPath] = useState<string | null | undefined>(
    undefined,
  );

  // null → no entry selected; string → absolute path to _default.md
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [focusTodayKey, setFocusTodayKey] = useState(0);

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
    <>
      <AppShell
        topbarContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusTodayKey((k) => k + 1)}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              title="Jump to today"
            >
              <CalendarBlank size={14} />
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              title="New entry"
            >
              <Plus size={12} weight="bold" />
            </button>
          </div>
        }
        leftPanel={
          <DateTree
            vaultRoot={vaultPath}
            onSelect={setSelectedFilePath}
            refreshKey={refreshKey}
            focusTodayKey={focusTodayKey}
          />
        }
        rightPanel={
          <EditorBoundary>
            <BlockNoteEditor filePath={selectedFilePath} />
          </EditorBoundary>
        }
      />
      <CreateEntryModal
        open={createModalOpen}
        onSuccess={() => { setCreateModalOpen(false); setRefreshKey((k) => k + 1); }}
        onCancel={() => setCreateModalOpen(false)}
      />
    </>
  );
}

export default App;
