import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CalendarBlank, FilePlus, FolderPlus, Plus } from "@phosphor-icons/react";
import { AppShell } from "./components/AppShell";
import { BlockNoteEditor } from "./components/editor/BlockNoteEditor";
import { EditorBoundary } from "./components/editor/EditorBoundary";
import { Onboarding } from "./components/Onboarding";
import { DateTree } from "./components/DateTree";
import { CreateEntryModal } from "./components/CreateEntryModal";
import { type FocusedItem } from "./lib/timeline";

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
  const [focusedItem, setFocusedItem] = useState<FocusedItem | null>(null);
  const [pendingAdd, setPendingAdd] = useState<"folder" | "note" | null>(null);

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
            <button
              onClick={() => setPendingAdd("folder")}
              disabled={!focusedItem || focusedItem.type === "subfolder"}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
              title="Add subfolder"
            >
              <FolderPlus size={14} />
            </button>
            <button
              onClick={() => setPendingAdd("note")}
              disabled={!focusedItem}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
              title="Add note"
            >
              <FilePlus size={14} />
            </button>
          </div>
        }
        leftPanel={
          <DateTree
            vaultRoot={vaultPath}
            onSelect={setSelectedFilePath}
            refreshKey={refreshKey}
            focusTodayKey={focusTodayKey}
            onFocusItem={setFocusedItem}
            pendingAdd={pendingAdd}
            onPendingAddDone={() => setPendingAdd(null)}
          />
        }
        rightPanel={
          selectedFilePath ? (
            <EditorBoundary>
              <BlockNoteEditor filePath={selectedFilePath} />
            </EditorBoundary>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Select an entry to begin editing
            </div>
          )
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
