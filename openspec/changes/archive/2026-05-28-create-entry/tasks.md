## 1. Backend

- [x] 1.1 Update `create_entry_impl` in `src-tauri/src/vault/timeline.rs` to add `source: internal` to the frontmatter string written to `_default.md`
- [x] 1.2 Update the existing `create_entry` Rust tests to assert that `source: internal` appears in the written `_default.md` content

## 2. CreateEntryModal Component

- [x] 2.1 Create `src/components/CreateEntryModal.tsx` with a title text input, a type selector (`meeting` / `event` / `task`, defaulting to `event`), and a `ResolutionDatePicker` for date selection
- [x] 2.2 Disable the Save button when the title field is empty or whitespace-only
- [x] 2.3 On Save, invoke `create_entry` with the trimmed title, selected type, and chosen date; close the modal on success and log the error on failure
- [x] 2.4 On Cancel, close the modal without invoking any Tauri command

## 3. DateTree Wiring

- [x] 3.1 Replace the `picker` state object in `DateTree.tsx` with a `createModalOpen: boolean` flag
- [x] 3.2 Wire the `+` button `onClick` to set `createModalOpen = true`
- [x] 3.3 Render `CreateEntryModal` controlled by `createModalOpen`, passing an `onSuccess` callback that closes the modal and calls `fetchTree`, and an `onCancel` callback that closes the modal
- [x] 3.4 Remove the `openNewEntry` function and any `ResolutionDatePicker` usage that was tied to entry creation; remove the import if it is no longer referenced
