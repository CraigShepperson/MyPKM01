## 1. Rust backend — frontmatter extraction and write guard

- [x] 1.1 Add `pub(crate) fn extract_frontmatter(content: &str) -> &str` to `src-tauri/src/vault/timeline.rs`: return the substring from the start of `content` through the end of the closing `\n---\n` delimiter if the content starts with `---\n` and contains a closing delimiter; otherwise return `""`
- [x] 1.2 Update `write_entry_file_impl`: when `filename == "_default.md"`, attempt to read the existing file; if successful call `extract_frontmatter` on it and prepend the result to `content` before calling `fs::write`; if the read fails proceed with `content` as-is
- [x] 1.3 Add unit tests for `extract_frontmatter`: standard frontmatter block returned correctly, no frontmatter returns empty string, frontmatter-only file (no body) handled correctly
- [x] 1.4 Add unit tests for `write_entry_file_impl` frontmatter preservation: writing body-only content preserves existing frontmatter, writing to a non-`_default.md` file passes through verbatim
