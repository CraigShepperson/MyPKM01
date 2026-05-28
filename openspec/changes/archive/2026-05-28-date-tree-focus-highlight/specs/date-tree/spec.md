## ADDED Requirements

### Requirement: DateTree accepts selectedFilePath prop and highlights the active entry row
The `DateTree` component SHALL accept an optional `selectedFilePath: string` prop. When provided, the entry row whose `_default.md` absolute path matches `selectedFilePath` SHALL be visually distinguished from non-selected rows using a persistent background highlight. Both paths SHALL be normalised to forward slashes before comparison so that Windows backslash separators do not prevent a match. The highlight SHALL remain visible regardless of whether the row is hovered.

#### Scenario: Active entry row is highlighted
- **WHEN** `DateTree` renders with `selectedFilePath` matching an entry's `_default.md` path
- **THEN** that entry row displays a persistent background highlight distinct from the default hover style

#### Scenario: Non-active entry rows are not highlighted
- **WHEN** `selectedFilePath` matches one entry row
- **THEN** all other entry rows do not display the active highlight

#### Scenario: No selectedFilePath shows no highlight
- **WHEN** `DateTree` renders without a `selectedFilePath` prop
- **THEN** no entry rows display an active highlight

#### Scenario: Path normalisation handles OS separators
- **WHEN** `selectedFilePath` contains Windows-style backslash separators
- **THEN** the comparison still correctly identifies and highlights the matching entry row
