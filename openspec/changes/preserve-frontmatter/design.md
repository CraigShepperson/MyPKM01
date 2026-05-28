## Context

`write_entry_file_impl` currently writes the incoming `content` verbatim. Because `read_entry_file_impl` strips frontmatter before returning content to the frontend, the save path receives a frontmatter-free body and overwrites the file completely — destroying `title`, `type`, and `source` on first save.

The fix is confined to `write_entry_file_impl`: before writing, read the existing file, extract its frontmatter block as a raw string, and prepend it to the incoming body.

## Goals / Non-Goals

**Goals:**
- `write_entry_file` for `_default.md` preserves the file's existing YAML frontmatter
- Files with no frontmatter pass through unchanged

**Non-Goals:**
- Merging or modifying frontmatter fields (e.g. updating `modified` timestamp)
- Handling frontmatter in files other than `_default.md`

## Decisions

### 1. Extract frontmatter with simple string search, not gray_matter re-parse

`gray_matter` parses YAML and returns structured data — useful for reading field values, but overkill for extracting a raw string block to round-trip unchanged.

A direct string extraction is safe and avoids any YAML round-trip reformatting:
```
if content starts with "---\n"
  find next "\n---\n" after offset 4
  the frontmatter block = content[0..end_of_closing_delimiter]
else
  no frontmatter → empty string
```

This preserves the frontmatter byte-for-byte: no YAML serialisation, no field reordering, no whitespace changes.

*Alternative considered:* Use `gray_matter`'s `.matter` field and reconstruct `---\n{matter}\n---\n`. Rejected — round-trip through the YAML parser may reorder or reformat fields.

### 2. Frontmatter extracted from the existing file on disk, not cached in memory

The write path reads the current file, extracts its frontmatter, prepends it to the new body, and writes. This is stateless — no caching needed in the Tauri state or anywhere else. The overhead of one extra `fs::read_to_string` per save is negligible for local files.

### 3. Only `_default.md` gets frontmatter preservation

Other files written via `write_entry_file` (if any) pass through unchanged. The guard is `if filename == "_default.md"`, matching the existing read-side guard in `read_entry_file_impl`.

### 4. Missing or unreadable existing file → write body as-is

If the file doesn't exist yet (edge case: race condition on new entry) or can't be read, the write proceeds with the body only — no frontmatter prepended, no error returned. Frontmatter destruction in this path is already the pre-existing behaviour.

## Risks / Trade-offs

- **Extra read per save** → negligible for local vault files; acceptable.
- **Frontmatter modified externally between load and save** → the write will use the most recent on-disk frontmatter (not the version when the entry was opened), which is correct behaviour.
