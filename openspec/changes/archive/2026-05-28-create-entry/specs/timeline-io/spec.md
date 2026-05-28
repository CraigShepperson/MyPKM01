## ADDED Requirements

### Requirement: create_entry creates a timestamped entry folder with _default.md
The `create_entry` Tauri command SHALL accept `date: String`, `title: String`, and `entry_type: String`. It SHALL create a subfolder named `entry-{unix_millis}` under `timeline/{date}/` relative to the vault root, creating intermediate directories as needed. Within that folder it SHALL write `_default.md` with a YAML frontmatter block containing `title`, `type`, and `source: internal`. The command SHALL return the generated entry ID as a `String`.

#### Scenario: Entry folder is created at the correct path
- **WHEN** `create_entry` is called with `date: "2025-05-28"`, `title: "Standup"`, `entry_type: "meeting"`
- **THEN** a folder matching `timeline/2025-05-28/entry-*/` exists under the vault root

#### Scenario: _default.md contains title, type, and source frontmatter
- **WHEN** `create_entry` is called with `title: "Standup"` and `entry_type: "meeting"`
- **THEN** the `_default.md` written inside the entry folder contains frontmatter with `title: Standup`, `type: meeting`, and `source: internal`

#### Scenario: Command returns the generated entry ID
- **WHEN** `create_entry` completes successfully
- **THEN** the returned string matches the folder name created (e.g. `entry-1748390400000`)

#### Scenario: Year-resolution date is accepted
- **WHEN** `create_entry` is called with `date: "2027"`
- **THEN** the entry folder is created under `timeline/2027/`

#### Scenario: Month-resolution date is accepted
- **WHEN** `create_entry` is called with `date: "2027-06"`
- **THEN** the entry folder is created under `timeline/2027-06/`
