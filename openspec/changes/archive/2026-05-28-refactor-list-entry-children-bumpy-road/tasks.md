## 1. Extract Helper Function

- [x] 1.1 Add private function `read_subfolder_notes(dir: &Path) -> Result<Vec<EntryNote>, VaultError>` above `list_entry_children_impl` in `timeline.rs`
- [x] 1.2 Implement the helper: read dir, sort entries, filter `_`-prefixed names and non-`.md` files, return `Vec<EntryNote>`

## 2. Refactor list_entry_children_impl

- [x] 2.1 Replace the inline `if ft.is_dir()` block with a call to `read_subfolder_notes(&item.path())?`
- [x] 2.2 Verify the `else if ft.is_file()` bump is unchanged and the function body compiles cleanly

## 3. Verify

- [x] 3.1 Run `cargo build` — no errors or warnings
- [x] 3.2 Run `cargo test` — all existing tests pass
