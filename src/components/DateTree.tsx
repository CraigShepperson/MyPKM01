import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { findNearestFutureDate, mapTimelineToTree, type DayListing, type TreeYear } from "../lib/timeline";

// ── Props ─────────────────────────────────────────────────────────────────────

interface DateTreeProps {
  vaultRoot: string;
  onSelect: (filePath: string) => void;
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

// ── DateTree ──────────────────────────────────────────────────────────────────

export function DateTree({ vaultRoot, onSelect }: DateTreeProps) {
  const [tree, setTree] = useState<TreeYear[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const hasSetInitialExpansion = useRef(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchTree = useCallback(() => {
    invoke<DayListing[]>("list_timeline")
      .then((days) => setTree(mapTimelineToTree(days)))
      .catch(console.error);
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Refetch on window focus
  useEffect(() => {
    window.addEventListener("focus", fetchTree);
    return () => window.removeEventListener("focus", fetchTree);
  }, [fetchTree]);

  // ── Auto-expand nearest future date (or most recent past) on first load ────

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
      // No future dates — fall back to most recent year/month/day
      const lastYear = tree.at(-1)!;
      initial.add(`y:${lastYear.year}`);
      const lastMonth = lastYear.months.at(-1);
      if (lastMonth) {
        initial.add(`m:${lastYear.year}-${lastMonth.month}`);
        const lastDay = lastMonth.days.at(-1);
        if (lastDay) initial.add(`d:${lastDay.date}`);
      }
    }

    setExpandedKeys(initial);
  }, [tree]);

  // ── Toggle helpers ─────────────────────────────────────────────────────────

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ── Entry click ────────────────────────────────────────────────────────────

  const handleEntryClick = (date: string, entryId: string) => {
    // Use the platform separator that matches vaultRoot
    const sep = vaultRoot.includes("\\") ? "\\" : "/";
    const filePath = [vaultRoot, "timeline", date, entryId, "_config.md"].join(sep);
    onSelect(filePath);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <p className="text-xs text-muted-foreground">No entries yet</p>
        <p className="text-[11px] text-muted-foreground/60">
          Create a folder inside <code className="font-mono">timeline/</code> to get started
        </p>
      </div>
    );
  }

  return (
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

            {yearExpanded &&
              yearNode.months.map((monthNode) => {
                const monthKey = `m:${yearNode.year}-${monthNode.month}`;
                const monthExpanded = expandedKeys.has(monthKey);

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

                    {monthExpanded &&
                      monthNode.days.map((dayNode) => {
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

                            {dayExpanded &&
                              dayNode.entries.map((entry) => (
                                <button
                                  key={entry.id}
                                  className="w-full flex items-center justify-between gap-2 pl-[52px] pr-2 py-0.5 text-xs hover:bg-muted/60 rounded transition-colors text-left"
                                  onClick={() =>
                                    handleEntryClick(dayNode.date, entry.id)
                                  }
                                >
                                  <span className="truncate text-foreground/80">
                                    {entry.title}
                                  </span>
                                  <TypeBadge type={entry.entry_type} />
                                </button>
                              ))}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
