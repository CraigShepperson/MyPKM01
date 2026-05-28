import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { invoke } from "@tauri-apps/api/core";
import { formatDateString } from "../lib/timeline";

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreateEntryModalProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ENTRY_TYPES = ["event", "meeting", "task"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateEntryModal({ open, onSuccess, onCancel }: CreateEntryModalProps) {
  const [title, setTitle] = useState("");
  const [entryType, setEntryType] = useState<string>("event");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setEntryType("event");
    setYear("");
    setMonth("");
    setDay("");
    setDateErrors({});
  }, [open]);

  const canSave = title.trim().length > 0;

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    const yearNum = parseInt(year, 10);
    if (!year.trim() || isNaN(yearNum)) errs.year = "Year is required";

    const monthNum = month.trim() ? parseInt(month, 10) : undefined;
    const dayNum = day.trim() ? parseInt(day, 10) : undefined;
    if (dayNum !== undefined && monthNum === undefined) errs.day = "Day requires a month";

    if (Object.keys(errs).length > 0) {
      setDateErrors(errs);
      return;
    }
    setDateErrors({});

    try {
      await invoke("create_entry", {
        date: formatDateString(yearNum, monthNum, dayNum),
        title: title.trim(),
        entryType,
      });
      onSuccess();
    } catch (err) {
      console.error("[CreateEntryModal] create_entry failed:", err);
    }
  };

  const handleCancel = () => {
    setDateErrors({});
    onCancel();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Popup className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-lg border border-border bg-background shadow-lg p-5 flex flex-col gap-4">
          <Dialog.Title className="text-sm font-semibold text-foreground">
            New entry
          </Dialog.Title>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Description</label>
            <input
              type="text"
              placeholder="What is this entry about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Type</label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/50"
            >
              {ENTRY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Date</label>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <input
                  type="number"
                  placeholder="Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={`w-full rounded border px-2 py-1.5 text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/50 ${
                    dateErrors.year ? "border-destructive" : "border-border"
                  }`}
                />
                {dateErrors.year && (
                  <p className="text-[11px] text-destructive">{dateErrors.year}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 w-16">
                <input
                  type="number"
                  placeholder="Mo"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              <div className="flex flex-col gap-1 w-14">
                <input
                  type="number"
                  placeholder="Dy"
                  min={1}
                  max={31}
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className={`w-full rounded border px-2 py-1.5 text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/50 ${
                    dateErrors.day ? "border-destructive" : "border-border"
                  }`}
                />
                {dateErrors.day && (
                  <p className="text-[11px] text-destructive">{dateErrors.day}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Dialog.Close
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </Dialog.Close>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
