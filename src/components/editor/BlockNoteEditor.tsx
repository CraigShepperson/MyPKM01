import { useEffect, useRef } from "react";
import { useCreateBlockNote, BlockNoteViewRaw } from "@blocknote/react";
import "@blocknote/react/style.css";
import { invoke } from "@tauri-apps/api/core";
import { parseFilePath } from "./editorUtils";

// ── Props ─────────────────────────────────────────────────────────────────────

interface BlockNoteEditorProps {
  filePath?: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * BlockNote editor. When `filePath` is provided the editor loads and displays
 * the content of that file via the `read_entry_file` Tauri command.
 *
 * Uses BlockNoteViewRaw (0.46.x base component) with all overlay UI disabled
 * until a theme adapter is wired in a follow-up change.
 */
export function BlockNoteEditor({ filePath }: BlockNoteEditorProps) {
  const editor = useCreateBlockNote();
  const isSavingEnabled = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!filePath) return;

    const parsed = parseFilePath(filePath);
    if (!parsed) return;

    // Cancel any pending save from the previous entry before loading new content.
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    isSavingEnabled.current = false;

    (async () => {
      try {
        const content = await invoke<string>("read_entry_file", parsed);
        const blocks = await editor.tryParseMarkdownToBlocks(content);
        editor.replaceBlocks(editor.document, blocks);
        // Re-enable saving after the load-triggered onChange has fired.
        setTimeout(() => { isSavingEnabled.current = true; }, 0);
      } catch (err) {
        console.error("[BlockNoteEditor] Failed to load file:", err);
        isSavingEnabled.current = true;
      }
    })();

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filePath]); // editor is stable (useCreateBlockNote), safe to omit from deps

  const handleChange = () => {
    if (!isSavingEnabled.current || !filePath) return;
    const parsed = parseFilePath(filePath);
    if (!parsed) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const content = await editor.blocksToMarkdownLossy(editor.document);
        await invoke("write_entry_file", { ...parsed, content });
      } catch (err) {
        console.error("[BlockNoteEditor] Auto-save failed:", err);
      }
    }, 1000);
  };

  return (
    <div className="h-full w-full overflow-auto">
      <BlockNoteViewRaw
        editor={editor}
        theme="light"
        onChange={handleChange}
        // Disable all overlay UI that needs a theme adapter's element renderer
        formattingToolbar={false}
        linkToolbar={false}
        slashMenu={false}
        sideMenu={false}
        filePanel={false}
        tableHandles={false}
        emojiPicker={false}
      />
    </div>
  );
}
