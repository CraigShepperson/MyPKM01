import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";
import { CaretDown, CaretRight, Plus, File, Folder } from "@phosphor-icons/react";
import {
  findNearestFutureDate,
  getNextMonday,
  getToday,
  getTomorrow,
  mapTimelineToTree,
  type DayListing,
  type EntryChildrenListing,
  type EntryMeta,
  type TreeYear,
} from "../lib/timeline";
import { ResolutionDatePicker } from "./ResolutionDatePicker";

// ── Props ─────────────────────────────────────────────────────────────────────

interface DateTreeProps {
  vaultRoot: string;
  onSelect: (filePath: string) => void;
  refreshKey?: number;
  focusTodayKey?: number;
}

// ── Context menu state ────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  entry: EntryMeta;
  date: string;
}

// ── Add-child state ───────────────────────────────────────────────────────────

interface AddMenuState {
  entryId: string;
  date: string;
  subfolder?: string;
}

interface AddInputState {
  entryId: string;
  date: string;
  type: "folder" | "note";
  subfolder?: string;
}

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_BADGE_CLASSES: Record<string, string> = {
  meeting: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  event:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  task:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function TypeBadge({ type }: { type: string }) {
  const classes =
    TYPE_BADGE_CLASSES[type] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium leading-none ${classes}`}
    >
      {type}
    </span>
  );
}

// ── NoteItem ──────────────────────────────────────────────────────────────────

function NoteItem({
  name,
  indentPx,
  onClick,
}: {
  name: string;
  indentPx: number;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-1.5 pr-2 py-0.5 text-xs hover:bg-muted/60 rounded transition-colors text-left text-foreground/70"
      style={{ paddingLeft: `${indentPx}px` }}
      onClick={onClick}
    >
      <File size={10} className="shrink-0 text-muted-foreground" />
      <span className="truncate">{name}</span>
    </button>
  );
}

// ── AddMenu (inline two-option menu) ─────────────────────────────────────────

function AddMenu({
  indentPx,
  showFolder,
  onFolder,
  onNote,
  onClose,
}: {
  indentPx: number;
  showFolder: boolean;
  onFolder: () => void;
  onNote: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-add-menu]")) onClose();
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [onClose]);

  return (
    <div
      data-add-menu
      className="flex items-center gap-1 py-0.5"
      style={{ paddingLeft: `${indentPx}px` }}
    >
      {showFolder && (
        <button
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-muted/80 text-foreground/70 transition-colors"
          onClick={onFolder}
        >
          <Folder size={10} />
          New folder
        </button>
      )}
      <button
        className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-muted/80 text-foreground/70 transition-colors"
        onClick={onNote}
      >
        <File size={10} />
        New note
      </button>
    </div>
  );
}

// ── AddInput (inline name input) ──────────────────────────────────────────────

function AddInput({
  indentPx,
  placeholder,
  onConfirm,
  onCancel,
}: {
  indentPx: number;
  placeholder: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const confirm = () => {
    if (value.trim()) onConfirm(value.trim());
    else onCancel();
  };

  return (
    <div className="flex items-center gap-1 py-0.5 pr-2" style={{ paddingLeft: `${indentPx}px` }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirm();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => { if (value.trim()) confirm(); else onCancel(); }}
        className="flex-1 text-xs bg-background border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-ring min-w-0"
        placeholder={placeholder}
      />
    </div>
  );
}

// ── SubfolderNode ─────────────────────────────────────────────────────────────

function SubfolderNode({
  name,
  notes,
  isExpanded,
  onToggle,
  onNoteClick,
  onAddNote,
  indentPx,
  addMenu,
  addInput,
  onAddMenuClose,
  onAddNoteConfirm,
  onAddCancel,
}: {
  name: string;
  notes: { name: string; filename: string }[];
  isExpanded: boolean;
  onToggle: () => void;
  onNoteClick: (filename: string) => void;
  onAddNote: () => void;
  indentPx: number;
  addMenu: boolean;
  addInput: boolean;
  onAddMenuClose: () => void;
  onAddNoteConfirm: (value: string) => void;
  onAddCancel: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      <div
        className="group flex items-center gap-0 hover:bg-muted/50 rounded"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          className="flex items-center gap-1 flex-1 pr-2 py-0.5 text-xs text-foreground/70 transition-colors text-left"
          style={{ paddingLeft: `${indentPx}px` }}
          onClick={onToggle}
        >
          {isExpanded ? <CaretDown size={9} /> : <CaretRight size={9} />}
          <Folder size={10} className="shrink-0" />
          <span className="truncate ml-0.5">{name}</span>
        </button>
        {hovered && !addMenu && !addInput && (
          <button
            className="shrink-0 mr-1 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); onAddNote(); }}
            title="New note"
          >
            <Plus size={10} />
          </button>
        )}
      </div>

      {addMenu && (
        <AddMenu
          indentPx={indentPx + 16}
          showFolder={false}
          onFolder={() => {}}
          onNote={() => {}}
          onClose={onAddMenuClose}
        />
      )}

      {addInput && (
        <AddInput
          indentPx={indentPx + 16}
          placeholder="note name"
          onConfirm={onAddNoteConfirm}
          onCancel={onAddCancel}
        />
      )}

      {isExpanded && notes.map((note) => (
        <NoteItem
          key={note.filename}
          name={note.name}
          indentPx={indentPx + 16}
          onClick={() => onNoteClick(note.filename)}
        />
      ))}
    </div>
  );
}

// ── EntryItem ─────────────────────────────────────────────────────────────────

function EntryItem({
  entry,
  date,
  entryIndentPx,
  onSelect,
  onContextMenu,
  isExpanded,
  onToggleExpand,
  children,
  onAddChild,
}: {
  entry: EntryMeta;
  date: string;
  entryIndentPx: number;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent, entry: EntryMeta, date: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  children?: React.ReactNode;
  onAddChild: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  // Outer container is indented by (entryIndentPx - 16px), then a 16px caret slot
  const outerPx = Math.max(0, entryIndentPx - 16);

  return (
    <div>
      <div
        className="flex items-center hover:bg-muted/60 rounded"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ paddingLeft: `${outerPx}px` }}
      >
        {/* 16px caret slot */}
        <div className="shrink-0 w-4 flex items-center justify-center">
          {entry.has_children && (
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            >
              {isExpanded ? <CaretDown size={9} /> : <CaretRight size={9} />}
            </button>
          )}
        </div>

        <button
          className="flex-1 flex items-center justify-between gap-2 pr-2 py-0.5 text-xs transition-colors text-left min-w-0"
          onClick={onSelect}
          onContextMenu={(e) => onContextMenu(e, entry, date)}
        >
          <span className="truncate text-foreground/80">{entry.title}</span>
          <TypeBadge type={entry.entry_type} />
        </button>

        {hovered && (
          <button
            className="shrink-0 mr-1 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); onAddChild(); }}
            title="Add folder or note"
          >
            <Plus size={10} />
          </button>
        )}
      </div>

      {isExpanded && children}
    </div>
  );
}

// ── DateTree ──────────────────────────────────────────────────────────────────

export function DateTree({ vaultRoot, onSelect, refreshKey, focusTodayKey }: DateTreeProps) {
  const [tree, setTree] = useState<TreeYear[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const hasSetInitialExpansion = useRef(false);
  const isFirstRender = useRef(true);
  const isFocusFirstRender = useRef(true);

  // ── Entry children state ───────────────────────────────────────────────────

  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [entryChildren, setEntryChildren] = useState<Map<string, EntryChildrenListing>>(new Map());
  const [expandedSubfolders, setExpandedSubfolders] = useState<Set<string>>(new Set());

  // ── Add-child flow ─────────────────────────────────────────────────────────

  const [addMenu, setAddMenu] = useState<AddMenuState | null>(null);
  const [addInput, setAddInput] = useState<AddInputState | null>(null);

  // ── Context menu ───────────────────────────────────────────────────────────

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // ── Move-to date picker ────────────────────────────────────────────────────

  const [picker, setPicker] = useState<{
    open: boolean;
    title: string;
    initialDate?: string;
    onConfirm: (date: string) => void;
  }>({ open: false, title: "Set date", onConfirm: () => {} });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchTree = useCallback(() => {
    invoke<DayListing[]>("list_timeline")
      .then((days) => {
        setTree(mapTimelineToTree(days));
        setEntryChildren(new Map()); // clear children cache on full refetch
      })
      .catch(console.error);
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  useEffect(() => {
    window.addEventListener("focus", fetchTree);
    return () => window.removeEventListener("focus", fetchTree);
  }, [fetchTree]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    fetchTree();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // ── Expand to nearest future date ─────────────────────────────────────────

  const expandToToday = useCallback((currentTree: TreeYear[]) => {
    if (currentTree.length === 0) return;
    const keys = new Set<string>();
    const today = new Date().toISOString().slice(0, 10);
    const nearest = findNearestFutureDate(currentTree, today);

    if (nearest) {
      keys.add(`y:${nearest.year}`);
      keys.add(`m:${nearest.year}-${nearest.month}`);
      keys.add(`d:${nearest.date}`);
    } else {
      const lastYear = currentTree[currentTree.length - 1]!;
      keys.add(`y:${lastYear.year}`);
      const lastMonth = lastYear.months[lastYear.months.length - 1];
      if (lastMonth) {
        keys.add(`m:${lastYear.year}-${lastMonth.month}`);
        const lastDay = lastMonth.days[lastMonth.days.length - 1];
        if (lastDay) keys.add(`d:${lastDay.date}`);
      }
    }

    setExpandedKeys(keys);
  }, []);

  useEffect(() => {
    if (tree.length === 0 || hasSetInitialExpansion.current) return;
    hasSetInitialExpansion.current = true;
    expandToToday(tree);
  }, [tree, expandToToday]);

  useEffect(() => {
    if (isFocusFirstRender.current) { isFocusFirstRender.current = false; return; }
    hasSetInitialExpansion.current = false;
    expandToToday(tree);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTodayKey]);

  // ── Close context menu on any click ───────────────────────────────────────

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  // ── Toggle helpers ─────────────────────────────────────────────────────────

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Entry expansion ────────────────────────────────────────────────────────

  const toggleEntry = async (entryId: string, date: string) => {
    if (expandedEntries.has(entryId)) {
      setExpandedEntries((prev) => { const n = new Set(prev); n.delete(entryId); return n; });
    } else {
      if (!entryChildren.has(entryId)) {
        try {
          const children = await invoke<EntryChildrenListing>("list_entry_children", { date, entryId });
          setEntryChildren((prev) => new Map(prev).set(entryId, children));
        } catch (err) {
          console.error("list_entry_children failed:", err);
        }
      }
      setExpandedEntries((prev) => new Set(prev).add(entryId));
    }
  };

  const refreshEntryChildren = async (date: string, entryId: string) => {
    try {
      const children = await invoke<EntryChildrenListing>("list_entry_children", { date, entryId });
      setEntryChildren((prev) => new Map(prev).set(entryId, children));
      setExpandedEntries((prev) => new Set(prev).add(entryId));
    } catch (err) {
      console.error("list_entry_children failed:", err);
    }
  };

  const toggleSubfolder = (entryId: string, subfolderName: string) => {
    const key = `${entryId}:${subfolderName}`;
    setExpandedSubfolders((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  // ── Entry click ────────────────────────────────────────────────────────────

  const handleEntryClick = (date: string, entryId: string) => {
    const sep = vaultRoot.includes("\\") ? "\\" : "/";
    const filePath = [vaultRoot, "timeline", date, entryId, "_default.md"].join(sep);
    onSelect(filePath);
  };

  const handleNoteClick = (date: string, entryId: string, filename: string, subfolder?: string) => {
    const sep = vaultRoot.includes("\\") ? "\\" : "/";
    const parts = subfolder
      ? [vaultRoot, "timeline", date, entryId, subfolder, filename]
      : [vaultRoot, "timeline", date, entryId, filename];
    onSelect(parts.join(sep));
  };

  // ── Add-child flow ─────────────────────────────────────────────────────────

  const openAddMenu = async (entryId: string, date: string, subfolder?: string) => {
    setAddMenu({ entryId, date, subfolder });
    setAddInput(null);
    // Ensure the entry is expanded so the menu/input becomes visible
    if (!expandedEntries.has(entryId)) {
      if (!entryChildren.has(entryId)) {
        try {
          const children = await invoke<EntryChildrenListing>("list_entry_children", { date, entryId });
          setEntryChildren((prev) => new Map(prev).set(entryId, children));
        } catch (err) {
          console.error("list_entry_children failed:", err);
        }
      }
      setExpandedEntries((prev) => new Set(prev).add(entryId));
    }
  };

  const startAddFolder = () => {
    if (!addMenu) return;
    setAddInput({ entryId: addMenu.entryId, date: addMenu.date, type: "folder" });
    setAddMenu(null);
  };

  const startAddNote = (subfolder?: string) => {
    if (!addMenu && subfolder === undefined) return;
    const state = addMenu ?? { entryId: addInput!.entryId, date: addInput!.date };
    setAddInput({ entryId: state.entryId, date: state.date, type: "note", subfolder });
    setAddMenu(null);
  };

  const confirmAdd = async (value: string) => {
    if (!addInput) return;
    const { entryId, date, type, subfolder } = addInput;
    setAddInput(null);

    try {
      if (type === "folder") {
        await invoke("create_entry_subfolder", { date, entryId, name: value });
      } else {
        const filename = value.endsWith(".md") ? value : `${value}.md`;
        await invoke("create_entry_note", {
          date,
          entryId,
          filename,
          subfolder: subfolder ?? null,
        });
      }
      await refreshEntryChildren(date, entryId);
    } catch (err) {
      console.error("create child failed:", err);
    }
  };

  // ── Context menu ───────────────────────────────────────────────────────────

  const handleContextMenu = (e: React.MouseEvent, entry: EntryMeta, date: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry, date });
  };

  const openEditDate = (entry: EntryMeta, currentDate: string) => {
    setContextMenu(null);
    setPicker({
      open: true,
      title: "Move To...",
      initialDate: currentDate,
      onConfirm: async (newDate) => {
        setPicker((p) => ({ ...p, open: false }));
        try {
          await invoke("move_entry", {
            entryId: entry.id,
            fromDate: currentDate,
            toDate: newDate,
          });
          fetchTree();
        } catch (err) {
          console.error("move_entry failed:", err);
        }
      },
    });
  };

  const quickMove = async (entry: EntryMeta, fromDate: string, toDate: string) => {
    setContextMenu(null);
    try {
      await invoke("move_entry", { entryId: entry.id, fromDate, toDate });
      fetchTree();
    } catch (err) {
      console.error("move_entry failed:", err);
    }
  };

  const handleDelete = async (entry: EntryMeta, date: string) => {
    setContextMenu(null);
    const ok = await confirm(`Delete "${entry.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await invoke("delete_entry", { entryId: entry.id, date });
      fetchTree();
    } catch (err) {
      console.error("delete_entry failed:", err);
    }
  };

  // ── Entry children renderer ────────────────────────────────────────────────

  const renderEntryChildren = (entry: EntryMeta, date: string, childIndentPx: number) => {
    const children = entryChildren.get(entry.id);
    if (!children) return null;

    return (
      <>
        {/* Add menu/input at entry level */}
        {addMenu?.entryId === entry.id && !addMenu.subfolder && (
          <AddMenu
            indentPx={childIndentPx}
            showFolder
            onFolder={startAddFolder}
            onNote={() => startAddNote(undefined)}
            onClose={() => setAddMenu(null)}
          />
        )}
        {addInput?.entryId === entry.id && !addInput.subfolder && (
          <AddInput
            indentPx={childIndentPx}
            placeholder={addInput.type === "folder" ? "folder name" : "note name"}
            onConfirm={confirmAdd}
            onCancel={() => setAddInput(null)}
          />
        )}

        {/* Direct notes */}
        {children.notes.map((note) => (
          <NoteItem
            key={note.filename}
            name={note.name}
            indentPx={childIndentPx}
            onClick={() => handleNoteClick(date, entry.id, note.filename)}
          />
        ))}

        {/* Sub-folders */}
        {children.subfolders.map((sf) => {
          const sfKey = `${entry.id}:${sf.name}`;
          const isOpen = expandedSubfolders.has(sfKey);
          const sfAddMenuOpen = addMenu?.entryId === entry.id && addMenu.subfolder === sf.name;
          const sfAddInputOpen = addInput?.entryId === entry.id && addInput.subfolder === sf.name;

          return (
            <SubfolderNode
              key={sf.name}
              name={sf.name}
              notes={sf.notes}
              isExpanded={isOpen}
              onToggle={() => toggleSubfolder(entry.id, sf.name)}
              onNoteClick={(filename) => handleNoteClick(date, entry.id, filename, sf.name)}
              onAddNote={() => openAddMenu(entry.id, date, sf.name)}
              indentPx={childIndentPx}
              addMenu={sfAddMenuOpen}
              addInput={sfAddInputOpen}
              onAddMenuClose={() => setAddMenu(null)}
              onAddNoteConfirm={confirmAdd}
              onAddCancel={() => setAddInput(null)}
            />
          );
        })}
      </>
    );
  };

  // ── Render helpers for entry items ─────────────────────────────────────────

  const renderEntry = (entry: EntryMeta, date: string, entryIndentPx: number, childIndentPx: number) => (
    <EntryItem
      key={entry.id}
      entry={entry}
      date={date}
      entryIndentPx={entryIndentPx}
      onSelect={() => handleEntryClick(date, entry.id)}
      onContextMenu={handleContextMenu}
      isExpanded={expandedEntries.has(entry.id)}
      onToggleExpand={() => toggleEntry(entry.id, date)}
      onAddChild={() => openAddMenu(entry.id, date)}
    >
      {expandedEntries.has(entry.id) && renderEntryChildren(entry, date, childIndentPx)}
    </EntryItem>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {tree.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
          <p className="text-xs text-muted-foreground">No entries yet</p>
          <p className="text-[11px] text-muted-foreground/60">
            Click + to create your first entry
          </p>
        </div>
      ) : (
        <div className="py-1 px-1 select-none">
          {tree.map((yearNode) => {
            const yearKey = `y:${yearNode.year}`;
            const yearExpanded = expandedKeys.has(yearKey);

            return (
              <div key={yearNode.year}>
                {/* Year row */}
                <button
                  className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:bg-muted/50 rounded transition-colors"
                  onClick={() => toggle(yearKey)}
                >
                  {yearExpanded ? (
                    <CaretDown size={9} weight="bold" />
                  ) : (
                    <CaretRight size={9} weight="bold" />
                  )}
                  {yearNode.year}
                </button>

                {yearExpanded && (
                  <>
                    {yearNode.entries.map((entry) =>
                      renderEntry(entry, String(yearNode.year), 20, 36)
                    )}

                    {yearNode.months.map((monthNode) => {
                      const monthKey = `m:${yearNode.year}-${monthNode.month}`;
                      const monthExpanded = expandedKeys.has(monthKey);
                      const monthDate = `${yearNode.year}-${String(monthNode.month).padStart(2, "0")}`;

                      return (
                        <div key={monthNode.month}>
                          <button
                            className="w-full flex items-center gap-1.5 pl-5 pr-2 py-0.5 text-xs font-medium text-foreground/70 hover:bg-muted/50 rounded transition-colors"
                            onClick={() => toggle(monthKey)}
                          >
                            {monthExpanded ? (
                              <CaretDown size={9} />
                            ) : (
                              <CaretRight size={9} />
                            )}
                            {monthNode.monthName}
                          </button>

                          {monthExpanded && (
                            <>
                              {monthNode.entries.map((entry) =>
                                renderEntry(entry, monthDate, 36, 52)
                              )}

                              {monthNode.days.map((dayNode) => {
                                const dayKey = `d:${dayNode.date}`;
                                const dayExpanded = expandedKeys.has(dayKey);

                                return (
                                  <div key={dayNode.date}>
                                    <button
                                      className="w-full flex items-center gap-1.5 pl-9 pr-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/50 rounded transition-colors"
                                      onClick={() => toggle(dayKey)}
                                    >
                                      {dayExpanded ? (
                                        <CaretDown size={9} />
                                      ) : (
                                        <CaretRight size={9} />
                                      )}
                                      {dayNode.day}
                                    </button>

                                    {dayExpanded &&
                                      dayNode.entries.map((entry) =>
                                        renderEntry(entry, dayNode.date, 52, 68)
                                      )}
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-background border border-border rounded-md shadow-md py-1 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground"
            onClick={() => quickMove(contextMenu.entry, contextMenu.date, getToday())}
          >
            Move to Today
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground"
            onClick={() => quickMove(contextMenu.entry, contextMenu.date, getTomorrow())}
          >
            Move to Tomorrow
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground"
            onClick={() => quickMove(contextMenu.entry, contextMenu.date, getNextMonday())}
          >
            Move to Next Monday
          </button>
          <div className="my-1 border-t border-border" />
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground"
            onClick={() => openEditDate(contextMenu.entry, contextMenu.date)}
          >
            Move To...
          </button>
          <div className="my-1 border-t border-border" />
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors text-red-500 hover:text-red-600"
            onClick={() => handleDelete(contextMenu.entry, contextMenu.date)}
          >
            Delete
          </button>
        </div>
      )}

      {/* Move-to date picker */}
      <ResolutionDatePicker
        open={picker.open}
        title={picker.title}
        initialDate={picker.initialDate}
        onConfirm={picker.onConfirm}
        onCancel={() => setPicker((p) => ({ ...p, open: false }))}
      />
    </>
  );
}
