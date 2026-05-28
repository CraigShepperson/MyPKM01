import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";
import { CaretDown, CaretRight, File, Folder } from "@phosphor-icons/react";
import {
  findNearestFutureDate,
  getNextMonday,
  getToday,
  getTomorrow,
  mapTimelineToTree,
  type DayListing,
  type EntryChildrenListing,
  type EntryMeta,
  type FocusedItem,
  type TreeYear,
} from "../lib/timeline";
import { ResolutionDatePicker } from "./ResolutionDatePicker";

// ── Props ─────────────────────────────────────────────────────────────────────

interface DateTreeProps {
  vaultRoot: string;
  onSelect: (payload: { filePath: string; meta: EntryMeta }) => void;
  refreshKey?: number;
  focusTodayKey?: number;
  onFocusItem?: (item: FocusedItem | null) => void;
  pendingAdd?: "folder" | "note" | null;
  onPendingAddDone?: () => void;
  childRefreshSignal?: { entryId: string; date: string } | null;
}

// ── Context menu state ────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  entry: EntryMeta;
  date: string;
}

// ── Add-child state ───────────────────────────────────────────────────────────

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

  const commit = () => {
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
          if (e.key === "Enter") commit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => { if (value.trim()) commit(); else onCancel(); }}
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
  indentPx,
  addInput,
  onAddNoteConfirm,
  onAddCancel,
}: {
  name: string;
  notes: { name: string; filename: string }[];
  isExpanded: boolean;
  onToggle: () => void;
  onNoteClick: (filename: string) => void;
  indentPx: number;
  addInput: boolean;
  onAddNoteConfirm: (value: string) => void;
  onAddCancel: () => void;
}) {
  return (
    <div>
      <div className="flex items-center hover:bg-muted/50 rounded">
        <button
          className="flex items-center gap-1 flex-1 pr-2 py-0.5 text-xs text-foreground/70 transition-colors text-left"
          style={{ paddingLeft: `${indentPx}px` }}
          onClick={onToggle}
        >
          {isExpanded ? <CaretDown size={9} /> : <CaretRight size={9} />}
          <Folder size={10} className="shrink-0" />
          <span className="truncate ml-0.5">{name}</span>
        </button>
      </div>

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
}: {
  entry: EntryMeta;
  date: string;
  entryIndentPx: number;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent, entry: EntryMeta, date: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  children?: React.ReactNode;
}) {
  const outerPx = Math.max(0, entryIndentPx - 16);

  return (
    <div>
      <div
        className="flex items-center hover:bg-muted/60 rounded"
        style={{ paddingLeft: `${outerPx}px` }}
      >
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
      </div>

      {isExpanded && children}
    </div>
  );
}

// ── DateTree ──────────────────────────────────────────────────────────────────

export function DateTree({
  vaultRoot,
  onSelect,
  refreshKey,
  focusTodayKey,
  onFocusItem,
  pendingAdd,
  onPendingAddDone,
  childRefreshSignal,
}: DateTreeProps) {
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

  const [addInput, setAddInput] = useState<AddInputState | null>(null);

  // ── Focused item and latest-ref pattern ───────────────────────────────────

  const focusedItemRef = useRef<FocusedItem | null>(null);
  const onFocusItemRef = useRef(onFocusItem);
  onFocusItemRef.current = onFocusItem;
  const onPendingAddDoneRef = useRef(onPendingAddDone);
  onPendingAddDoneRef.current = onPendingAddDone;

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
        setEntryChildren(new Map());
        focusedItemRef.current = null;
        onFocusItemRef.current?.(null);
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

  useEffect(() => {
    if (childRefreshSignal) {
      refreshEntryChildren(childRefreshSignal.date, childRefreshSignal.entryId);
    }
  }, [childRefreshSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSubfolder = (entryId: string, date: string, subfolderName: string) => {
    const key = `${entryId}:${subfolderName}`;
    setExpandedSubfolders((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
    focusedItemRef.current = { type: "subfolder", entryId, date, subfolderName };
    onFocusItemRef.current?.({ type: "subfolder", entryId, date, subfolderName });
  };

  // ── Entry click ────────────────────────────────────────────────────────────

  const handleEntryClick = (date: string, entry: EntryMeta) => {
    const sep = vaultRoot.includes("\\") ? "\\" : "/";
    const filePath = [vaultRoot, "timeline", date, entry.id, "_default.md"].join(sep);
    onSelect({ filePath, meta: entry });
    focusedItemRef.current = { type: "entry", entryId: entry.id, date };
    onFocusItemRef.current?.({ type: "entry", entryId: entry.id, date });
  };

  const handleNoteClick = (date: string, entry: EntryMeta, filename: string, subfolder?: string) => {
    const sep = vaultRoot.includes("\\") ? "\\" : "/";
    const parts = subfolder
      ? [vaultRoot, "timeline", date, entry.id, subfolder, filename]
      : [vaultRoot, "timeline", date, entry.id, filename];
    onSelect({ filePath: parts.join(sep), meta: entry });
  };

  // ── Add-child flow ─────────────────────────────────────────────────────────

  const cancelAdd = () => {
    setAddInput(null);
    onPendingAddDoneRef.current?.();
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
    onPendingAddDoneRef.current?.();
  };

  // ── pendingAdd effect ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!pendingAdd) return;
    const focused = focusedItemRef.current;
    if (!focused) return;

    const { entryId, date } = focused;
    const subfolder = focused.type === "subfolder" ? focused.subfolderName : undefined;

    const openInput = async () => {
      if (!entryChildren.has(entryId)) {
        try {
          const children = await invoke<EntryChildrenListing>("list_entry_children", { date, entryId });
          setEntryChildren((prev) => new Map(prev).set(entryId, children));
        } catch (err) {
          console.error("list_entry_children failed:", err);
        }
      }
      setExpandedEntries((prev) => new Set(prev).add(entryId));
      setAddInput({ entryId, date, type: pendingAdd, subfolder });
    };

    openInput();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAdd]);

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
        {addInput?.entryId === entry.id && !addInput.subfolder && (
          <AddInput
            indentPx={childIndentPx}
            placeholder={addInput.type === "folder" ? "folder name" : "note name"}
            onConfirm={confirmAdd}
            onCancel={cancelAdd}
          />
        )}

        {children.notes.map((note) => (
          <NoteItem
            key={note.filename}
            name={note.name}
            indentPx={childIndentPx}
            onClick={() => handleNoteClick(date, entry, note.filename)}
          />
        ))}

        {children.subfolders.map((sf) => {
          const sfKey = `${entry.id}:${sf.name}`;
          const isOpen = expandedSubfolders.has(sfKey);
          const sfAddInputOpen = addInput?.entryId === entry.id && addInput.subfolder === sf.name;

          return (
            <SubfolderNode
              key={sf.name}
              name={sf.name}
              notes={sf.notes}
              isExpanded={isOpen}
              onToggle={() => toggleSubfolder(entry.id, date, sf.name)}
              onNoteClick={(filename) => handleNoteClick(date, entry, filename, sf.name)}
              indentPx={childIndentPx}
              addInput={sfAddInputOpen}
              onAddNoteConfirm={confirmAdd}
              onAddCancel={cancelAdd}
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
      onSelect={() => handleEntryClick(date, entry)}
      onContextMenu={handleContextMenu}
      isExpanded={expandedEntries.has(entry.id)}
      onToggleExpand={() => toggleEntry(entry.id, date)}
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
