import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BlockNoteEditor } from "./BlockNoteEditor";
import { NoteTitle } from "./NoteTitle";
import { parseFilePath } from "./editorUtils";

interface NotePanelProps {
  filePath: string;
  title: string;
}

export function NotePanel({ filePath, title }: NotePanelProps) {
  const [titleValue, setTitleValue] = useState(title);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync title when the selected entry changes.
  useEffect(() => {
    setTitleValue(title);
  }, [title]);

  // Cancel pending rename when filePath changes or component unmounts.
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filePath]);

  const handleTitleChange = (value: string) => {
    setTitleValue(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      const trimmed = value.trim();
      if (!trimmed) return;

      const parsed = parseFilePath(filePath);
      if (!parsed) return;

      try {
        await invoke("rename_entry", { date: parsed.date, entryId: parsed.entryId, title: trimmed });
      } catch (err) {
        console.error("[NotePanel] rename_entry failed:", err);
      }
    }, 500);
  };

  const focusEditor = () => {
    editorRef.current?.querySelector<HTMLElement>("[contenteditable]")?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      <NoteTitle value={titleValue} onChange={handleTitleChange} onEnter={focusEditor} />
      <div ref={editorRef} className="flex-1 overflow-auto">
        <BlockNoteEditor filePath={filePath} />
      </div>
    </div>
  );
}
