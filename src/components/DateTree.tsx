import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import {
  findNearestFutureDate,
  getNextMonday,
  getToday,
  getTomorrow,
  mapTimelineToTree,
  type DayListing,
  type EntryMeta,
  type TreeYear,
} from "../lib/timeline";
import { ResolutionDatePicker } from "./ResolutionDatePicker";

// ── Props ─────────────────────────────────────────────────────────────────────

interface DateTreeProps {
  vaultRoot: string;
  onSelect: (filePath: string) => void;
  refreshKey?: number;
}

// ── Context menu state ────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  entry: EntryMeta;
  date: string;
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

// ── Entry item (shared across all resolutions) ────────────────────────────────

function EntryItem({
  entry,
  date,
  indent,
  onSelect,
  onContextMenu,
}: {
  entry: EntryMeta;
  date: string;
  indent: string;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent, entry: EntryMeta, date: string) => void;
}) {
  return (
    <button
      key={entry.id}
      className={`w-full flex items-center justify-between gap-2 ${indent} pr-2 py-0.5 text-xs hover:bg-muted/60 rounded transition-colors text-left`}
      onClick={onSelect}
      onContextMenu={(e) => onContextMenu(e, entry, date)}
    >
      <span className="truncate text-foreground/80">{entry.title}</span>
      <TypeBadge type={entry.entry_type} />
    </button>
  );
}

// ── DateTree ──────────────────────────────────────────────────────────────────

export function DateTree({ vaultRoot, onSelect, refreshKey }: DateTreeProps) {
  const [tree, setTree] = useState<TreeYear[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const hasSetInitialExpansion = useRef(false);
  const isFirstRender = useRef(true);

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
      .then((days) => setTree(mapTimelineToTree(days)))
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

  // ── Auto-expand nearest future date on first load ──────────────────────────

  useEffect(() => {
    if (tree.length === 0 || hasSetInitialExpansion.current) return;
    hasSetInitialExpansion.current = true;

    const initial = new Set<string>();
    const today = new Date().toISOString().slice(0, 10);
    const nearest = findNearestFutureDate(tree, today);

    if (nearest) {
      initial.add(`y:${nearest.year}`);
      initial.add(`m:${nearest.year}-${nearest.month}`);
      initial.add(`d:${nearest.date}`);
    } else {
      const lastYear = tree[tree.length - 1]!;
      initial.add(`y:${lastYear.year}`);
      const lastMonth = lastYear.months[lastYear.months.length - 1];
      if (lastMonth) {
        initial.add(`m:${lastYear.year}-${lastMonth.month}`);
        const lastDay = lastMonth.days[lastMonth.days.length - 1];
        if (lastDay) initial.add(`d:${lastDay.date}`);
      }
    }

    setExpandedKeys(initial);
  }, [tree]);

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

  // ── Entry click ────────────────────────────────────────────────────────────

  const handleEntryClick = (date: string, entryId: string) => {
    const sep = vaultRoot.includes("\\") ? "\\" : "/";
    const filePath = [vaultRoot, "timeline", date, entryId, "_default.md"].join(sep);
    onSelect(filePath);
  };

  // ── Context menu ───────────────────────────────────────────────────────────

  const handleContextMenu = (
    e: React.MouseEvent,
    entry: EntryMeta,
    date: string,
  ) => {
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
                    {/* Year-level entries */}
                    {yearNode.entries.map((entry) => (
                      <EntryItem
                        key={entry.id}
                        entry={entry}
                        date={String(yearNode.year)}
                        indent="pl-5"
                        onSelect={() => handleEntryClick(String(yearNode.year), entry.id)}
                        onContextMenu={handleContextMenu}
                      />
                    ))}

                    {/* Month nodes */}
                    {yearNode.months.map((monthNode) => {
                      const monthKey = `m:${yearNode.year}-${monthNode.month}`;
                      const monthExpanded = expandedKeys.has(monthKey);
                      const monthDate = `${yearNode.year}-${String(monthNode.month).padStart(2, "0")}`;

                      return (
                        <div key={monthNode.month}>
                          {/* Month row */}
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
                              {/* Month-level entries */}
                              {monthNode.entries.map((entry) => (
                                <EntryItem
                                  key={entry.id}
                                  entry={entry}
                                  date={monthDate}
                                  indent="pl-9"
                                  onSelect={() => handleEntryClick(monthDate, entry.id)}
                                  onContextMenu={handleContextMenu}
                                />
                              ))}

                              {/* Day nodes */}
                              {monthNode.days.map((dayNode) => {
                                const dayKey = `d:${dayNode.date}`;
                                const dayExpanded = expandedKeys.has(dayKey);

                                return (
                                  <div key={dayNode.date}>
                                    {/* Day row */}
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

                                    {/* Day-level entries */}
                                    {dayExpanded &&
                                      dayNode.entries.map((entry) => (
                                        <EntryItem
                                          key={entry.id}
                                          entry={entry}
                                          date={dayNode.date}
                                          indent="pl-[52px]"
                                          onSelect={() => handleEntryClick(dayNode.date, entry.id)}
                                          onContextMenu={handleContextMenu}
                                        />
                                      ))}
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
