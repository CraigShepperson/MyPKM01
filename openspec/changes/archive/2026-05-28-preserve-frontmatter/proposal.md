## Why

`read_entry_file` strips YAML frontmatter before returning content to the frontend. `write_entry_file` writes whatever it receives verbatim. The auto-save round-trip therefore permanently destroys the frontmatter (`title`, `type`, `source`) on the first save, breaking all timeline metadata.

## What Changes

- `write_entry_file_impl` in Rust: when the filename is `_default.md`, read the existing file, extract its frontmatter block, and prepend it to the incoming body content before writing to disk
- The frontend (`BlockNoteEditor`) is unchanged — it already receives and returns body-only content
- A new `extract_frontmatter` helper in `timeline.rs` returns the raw frontmatter block (the `---…---` header including delimiters and trailing newline), or an empty string if none is present

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `editor-layer`: `write_entry_file` for `_default.md` now preserves the file's existing YAML frontmatter when overwriting the body

## Impact

- `src-tauri/src/vault/timeline.rs` — add `extract_frontmatter` helper; update `write_entry_file_impl` to prepend frontmatter when writing `_default.md`; add unit tests
