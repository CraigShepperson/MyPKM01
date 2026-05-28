## Why

The existing `+` button in the timeline sidebar creates entries with a hardcoded title ("New entry") and hardcoded type ("event"), giving users no control over the entry's metadata at creation time. This change replaces that placeholder behaviour with a proper creation modal where the user provides a description and selects a type, and ensures the resulting `_default.md` carries a `source: internal` field for provenance tracking.

## What Changes

- The `+` button in the DateTree sidebar opens an enhanced modal that collects a short description (title) and entry type from the user before saving
- The `create_entry` Tauri command adds `source: internal` to the frontmatter written to `_default.md`
- The frontmatter schema for a new entry becomes: `title`, `type`, `source`

## Capabilities

### New Capabilities
- `entry-creation`: The creation modal UI — description input field and type selector — wired to the existing `+` button and `create_entry` command

### Modified Capabilities
- `timeline-io`: `create_entry` command must write `source: internal` to the `_default.md` frontmatter in addition to `title` and `type`

## Impact

- `src/components/DateTree.tsx` — `openNewEntry` handler and the modal it opens need a title input and type selector
- `src-tauri/src/vault/timeline.rs` — `create_entry_impl` adds `source: internal` line to the formatted frontmatter string
- `openspec/specs/timeline-io/spec.md` — `create_entry` requirement and scenarios updated to include the `source` field
