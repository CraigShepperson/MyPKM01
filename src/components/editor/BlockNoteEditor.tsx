import { useCreateBlockNote, BlockNoteViewRaw } from "@blocknote/react";
import "@blocknote/react/style.css";

/**
 * Scaffold stub: mounts a BlockNote editor with an empty document.
 *
 * Uses BlockNoteViewRaw (0.46.x base component) with all overlay UI disabled.
 * BlockNoteViewRaw without a theme adapter (e.g. @blocknote/mantine) cannot
 * render its toolbar/menu overlays — they need an "element renderer" that only
 * a theme adapter provides. Disabling them here lets the plain content-editable
 * area mount cleanly. A theme adapter will be wired in a follow-up change.
 */
export function BlockNoteEditor() {
  const editor = useCreateBlockNote();

  return (
    <div className="h-full w-full overflow-auto">
      <BlockNoteViewRaw
        editor={editor}
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
