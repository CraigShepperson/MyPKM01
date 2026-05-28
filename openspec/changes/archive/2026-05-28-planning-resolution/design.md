## Context

Timeline entries currently live at `timeline/YYYY-MM-DD/{entry_id}/`. Every item requires a specific day, which forces false precision on events that only exist at a coarse planning horizon. This change extends the vault folder convention to support year and month resolution, with a unified "edit date" action for moving entries between resolutions.

The frontend already renders a year → month → day tree. Coarse entries slot naturally into existing nodes — year-level entries float above the month list, month-level entries float above the day list.

## Goals / Non-Goals

**Goals:**
- Support `YYYY`, `YYYY-MM`, and `YYYY-MM-DD` folder shapes in the vault's `timeline/` directory
- Allow entries to be created at any resolution via a shared segmented date picker modal
- Allow entries to be moved to any date/resolution via a right-click "Edit date" action
- Keep the vault filesystem human-readable and the resolution inferable without extra metadata

**Non-Goals:**
- Time-of-day resolution (handled separately in entry frontmatter if needed)
- Automatic promotion — nothing moves without a deliberate user action
- Batch promotion across multiple entries at once

## Decisions

### Folder name encodes resolution
The vault folder name is the single source of truth for resolution. No `resolution:` field in frontmatter.

_Alternative considered_: Store a `resolution` field in `_config.md` frontmatter. Rejected because it creates two sources of truth — a folder named `2027` with `resolution: month` in frontmatter would be ambiguous and fragile.

### Single `move_entry` command covers all cases
One Tauri command accepts `from_date` and `to_date` and renames the folder. Direction (coarser → finer or finer → coarser) is irrelevant.

_Alternative considered_: Separate `promote_entry` / `demote_entry` commands with directional validation. Rejected because the user mental model is "edit date", not "change resolution direction". Directional validation adds complexity with no UX benefit.

### Resolution inferred in the frontend from string shape
`mapTimelineToTree` detects resolution by string length/pattern: 4 chars → year, 7 chars → month, 10 chars → day. No backend change to `DayListing` type.

_Alternative considered_: Backend adds a `resolution: String` field to `DayListing`. Rejected to avoid a breaking change to the IPC contract. The three date formats are unambiguous and the pattern match is trivial.

### `std::fs::rename` for atomicity
The rename of `timeline/{from_date}/{entry_id}` → `timeline/{to_date}/{entry_id}` uses `std::fs::rename`, which is atomic on the same filesystem on both POSIX and Windows. The subsequent cleanup of an empty `{from_date}` directory is not atomic — it runs after the rename succeeds and is safe to skip if it fails.

### Shared `ResolutionDatePicker` modal for creation and editing
The same modal component is used in both the "create entry" and "edit date" flows. When opened for editing it is pre-filled with the entry's current date. This avoids two diverging date input implementations.

## Risks / Trade-offs

**Cross-filesystem rename fails** → `std::fs::rename` returns an error if `from` and `to` are on different filesystems. The vault is always a single local directory, so this cannot occur in practice.

**Empty parent directory not cleaned up** → If the cleanup step fails after a successful rename, an empty `timeline/2027/` folder remains. `list_timeline` already handles empty date folders gracefully (returns a DayListing with no entries). The stale folder is cosmetically untidy but not harmful. A future `list_timeline` call will expose it and a subsequent move or manual deletion will remove it.

**Frontend string-shape inference breaks on unexpected folder names** → Folders that don't match `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` will be silently skipped during `mapTimelineToTree` parsing. This matches the current behaviour for non-date folders in `timeline/`.

## Migration Plan

No migration required. Existing `YYYY-MM-DD` folders are valid under the new convention. New `YYYY` and `YYYY-MM` folders can be created alongside them without conflict.
