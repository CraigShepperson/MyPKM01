## ADDED Requirements

### Requirement: write_entry_file preserves existing YAML frontmatter when overwriting _default.md
When `write_entry_file` is called with `filename = "_default.md"`, the command SHALL read the existing file from disk, extract its YAML frontmatter block (the `---\n…\n---\n` header), and prepend it to the incoming body content before writing to disk. If the existing file has no frontmatter, or if the file cannot be read, the incoming content SHALL be written as-is without error. Files with a filename other than `_default.md` SHALL be written verbatim without frontmatter handling.

#### Scenario: Frontmatter is preserved after a body-only write
- **WHEN** `write_entry_file` is called for `_default.md` with content that contains no frontmatter
- **THEN** the saved file contains the original frontmatter block followed by the new body content

#### Scenario: File with no frontmatter is written unchanged
- **WHEN** `write_entry_file` is called for a `_default.md` that has no existing frontmatter
- **THEN** the incoming content is written to disk verbatim

#### Scenario: Non-default-md files are written verbatim
- **WHEN** `write_entry_file` is called with a filename other than `_default.md`
- **THEN** the content is written to disk without any frontmatter handling

#### Scenario: Unreadable existing file does not block the write
- **WHEN** the existing `_default.md` cannot be read (e.g. it does not yet exist)
- **THEN** the incoming content is written to disk as-is and no error is returned
