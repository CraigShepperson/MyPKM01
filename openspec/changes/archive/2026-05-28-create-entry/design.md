## Context

The DateTree sidebar has a `+` button that calls `openNewEntry`, which opens `ResolutionDatePicker`. On date selection it immediately calls `create_entry` with a hardcoded title (`"New entry"`) and type (`"event"`). The entry is created without user input for these fields.

The Rust `create_entry_impl` writes a `_default.md` frontmatter block containing only `title` and `type`. There is no `source` field.

## Goals / Non-Goals

**Goals:**
- Replace the hardcoded title/type with user-provided values collected in a single creation modal
- Add `source: internal` to every entry created through the app
- Keep the `+` button as the sole entry point for creation

**Non-Goals:**
- Editing title/type after creation
- Supporting `source` values other than `internal` (external sources are a future concern)
- Changing the date-picking UX or `ResolutionDatePicker` internals

## Decisions

### New `CreateEntryModal` component rather than extending `ResolutionDatePicker`

`ResolutionDatePicker` is a focused date-only component; adding title and type fields to it conflates concerns. A new `CreateEntryModal` owns the full creation form (title input, type selector, date picker) and calls `create_entry` directly on submit.

*Alternative considered*: extend the existing `picker` state shape in `DateTree` with extra fields and pass them through `ResolutionDatePicker`. Rejected — it couples an unrelated component to entry-creation semantics.

### `source: internal` is hardcoded in the backend, not a parameter

`source` is not a user-facing choice — every entry created through the app is `internal`. Adding it as a parameter to `create_entry` would expose a field that callers should never vary. The value is written unconditionally inside `create_entry_impl`.

*Alternative considered*: pass `source` from the frontend. Rejected — the frontend has no valid reason to supply a different value today.

### Type selector defaults to `"event"`, title must be non-empty to enable Save

The Save button is disabled until the title field contains at least one non-whitespace character. Type defaults to `"event"` so the user can skip it if they don't care. No other validation is applied at creation time.

### `DateTree` state: replace `picker` state with `createModal` state

The existing `picker` state object was tailored for `ResolutionDatePicker`. The new `CreateEntryModal` has a different contract (title + type + date vs date-only). Replacing `picker` with a `createModalOpen: boolean` flag keeps the state minimal; the modal manages its own field state internally.

## Risks / Trade-offs

- **`ResolutionDatePicker` stays in `DateTree` only if used elsewhere** — if `CreateEntryModal` absorbs all date-picking for entry creation, the `picker` state and its open/cancel handlers can be removed entirely. Verify no other caller remains before deleting.
- **Hardcoded `source` in Rust** → if a future import feature needs `source: external`, the parameter will need to be added to `create_entry` at that point. Low risk now, easy to extend later.
