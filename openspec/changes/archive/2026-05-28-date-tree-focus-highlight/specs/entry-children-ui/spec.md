## ADDED Requirements

### Requirement: Note items highlight when their path matches selectedFilePath
Note items rendered under an entry or sub-folder SHALL receive the `selectedFilePath` value threaded down from the parent `DateTree`. A note item SHALL display a persistent background highlight when its own file path matches `selectedFilePath`, compared after normalising both values to forward slashes. Direct notes and sub-folder notes SHALL both participate in this highlight. The highlight SHALL remain visible regardless of hover state.

#### Scenario: Direct note item is highlighted when selected
- **WHEN** `selectedFilePath` matches a direct note item's file path
- **THEN** that note item displays the active background highlight

#### Scenario: Sub-folder note item is highlighted when selected
- **WHEN** `selectedFilePath` matches a note inside a sub-folder
- **THEN** that note item displays the active background highlight

#### Scenario: Non-matching note items show no highlight
- **WHEN** `selectedFilePath` matches one note item
- **THEN** all other note items do not display the active highlight

#### Scenario: Undefined selectedFilePath shows no highlight on note items
- **WHEN** `selectedFilePath` is not provided to `DateTree`
- **THEN** no note items display an active highlight
