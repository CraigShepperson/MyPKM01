import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { parseDateString, formatDateString } from "../lib/timeline";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ResolutionDatePickerProps {
  open: boolean;
  title?: string;
  initialDate?: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResolutionDatePicker({
  open,
  title = "Set date",
  initialDate,
  onConfirm,
  onCancel,
}: ResolutionDatePickerProps) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill from initialDate whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    if (initialDate) {
      const parsed = parseDateString(initialDate);
      if (parsed) {
        setYear(String(parsed.year));
        setMonth(parsed.month !== undefined ? String(parsed.month) : "");
        setDay(parsed.day !== undefined ? String(parsed.day) : "");
        return;
      }
    }
    setYear("");
    setMonth("");
    setDay("");
    setErrors({});
  }, [open, initialDate]);

  const handleConfirm = () => {
    const errs: Record<string, string> = {};

    const yearNum = parseInt(year, 10);
    if (!year.trim() || isNaN(yearNum)) {
      errs.year = "Year is required";
    }

    const monthNum = month.trim() ? parseInt(month, 10) : undefined;
    const dayNum = day.trim() ? parseInt(day, 10) : undefined;

    if (dayNum !== undefined && monthNum === undefined) {
      errs.day = "Day requires a month";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    onConfirm(formatDateString(yearNum, monthNum, dayNum));
  };

  const handleCancel = () => {
    setErrors({});
    onCancel();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Popup className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 rounded-lg border border-border bg-background shadow-lg p-5 flex flex-col gap-4">
          <Dialog.Title className="text-sm font-semibold text-foreground">
            {title}
          </Dialog.Title>

          {/* Fields */}
          <div className="flex gap-2">
            {/* Year */}
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-muted-foreground font-medium">Year</label>
              <input
                type="number"
                placeholder="2027"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={`w-full rounded border px-2 py-1.5 text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/50 ${
                  errors.year ? "border-destructive" : "border-border"
                }`}
              />
              {errors.year && (
                <p className="text-[11px] text-destructive">{errors.year}</p>
              )}
            </div>

            {/* Month */}
            <div className="flex flex-col gap-1 w-16">
              <label className="text-xs text-muted-foreground font-medium">Month</label>
              <input
                type="number"
                placeholder="—"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {/* Day */}
            <div className="flex flex-col gap-1 w-14">
              <label className="text-xs text-muted-foreground font-medium">Day</label>
              <input
                type="number"
                placeholder="—"
                min={1}
                max={31}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className={`w-full rounded border px-2 py-1.5 text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/50 ${
                  errors.day ? "border-destructive" : "border-border"
                }`}
              />
              {errors.day && (
                <p className="text-[11px] text-destructive">{errors.day}</p>
              )}
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
              onClick={handleConfirm}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Set date
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
