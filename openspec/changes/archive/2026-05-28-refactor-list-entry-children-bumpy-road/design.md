## Context

`list_entry_children_impl` in `src-tauri/src/vault/timeline.rs` contains two nested conditional blocks ("bumps") inside its main item loop:

1. A `if ft.is_dir()` block that reads a subfolder's contents, filters by name and file type, and builds a `Vec<EntryNote>` — roughly 25 lines inline.
2. An `else if ft.is_file()` block that appends a direct note — 5 lines.

Both bumps share a pattern: skip `_`-prefixed names, skip non-`.md` files, build `EntryNote` values. The directory bump inlines that pattern a second time, which is the root cause of the smell.

## Goals / Non-Goals

**Goals:**
- Extract the subfolder traversal into a private helper, eliminating the deeper nested bump
- Remove the duplicated filtering logic

**Non-Goals:**
- Changing any observable behaviour (inputs, outputs, error variants, sort order)
- Refactoring `create_entry_subfolder_impl`, `create_entry_note_impl`, or any other function
- Adding tests beyond what already exists

## Decisions

**Extract `read_subfolder_notes` as a private free function**

Signature: `fn read_subfolder_notes(dir: &Path) -> Result<Vec<EntryNote>, VaultError>`

It reads the directory, sorts entries, filters out `_`-prefixed names and non-`.md` files, and returns the collected `EntryNote` list. `list_entry_children_impl` calls it inside the `is_dir` branch, replacing the inlined block with a single call.

Alternatives considered:
- **Closure inside the function** — keeps it local but closures that return `Result` and use `?` are awkward; a named function is cleaner.
- **Method on a struct** — no struct exists here; a free function matches the surrounding code style.

**Preserve sort-before-collect ordering**

The helper sorts its own `sub_items` before collecting, mirroring the existing behaviour exactly. The outer loop's `items` sort is untouched.

## Risks / Trade-offs

- **Identical logic, two callsites** — the helper centralises the filtering; a future bug fix only needs to happen in one place. Low risk of introducing divergence.
- **Refactor-only change** — no logic changes means existing tests remain the full correctness check.
