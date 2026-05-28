## MODIFIED Requirements

### Requirement: DateTree component renders the vault tree from live backend data
The `DateTree` component SHALL call `invoke('list_timeline')` on mount and store the result in local state. It SHALL pass the response through `mapTimelineToTree` and render the grouped structure as a collapsible tree: year nodes at the top level, with year-level entries listed directly below the year header; month nodes nested within years, with month-level entries listed directly below the month header; day nodes nested within months, with day-level entries listed within days. Each entry item SHALL display its `title` and a type badge (`meeting`, `event`, or `task`). When `EntryMeta.has_children` is `true`, the entry item SHALL render as an expandable node (showing an expand/collapse toggle); when `has_children` is `false`, the entry item SHALL render as a leaf. The component SHALL accept an `onSelect: (filePath: string) => void` prop.

#### Scenario: Tree renders day-level entries from backend response
- **WHEN** `DateTree` mounts and `list_timeline` returns one day-resolution listing with two entries
- **THEN** the tree displays one year node, one month node, one day node, and two entry items with their titles

#### Scenario: Year-level entries render below year header
- **WHEN** `list_timeline` returns a year-resolution listing for `"2027"` with one entry
- **THEN** the tree displays the entry item directly under the 2027 year node, with no month or day nodes

#### Scenario: Month-level entries render below month header
- **WHEN** `list_timeline` returns a month-resolution listing for `"2027-06"` with one entry
- **THEN** the tree displays the entry item directly under the June month node, with no day nodes

#### Scenario: Type badge is displayed
- **WHEN** an entry has `entry_type: "meeting"`
- **THEN** the entry item displays a "meeting" badge or label

#### Scenario: No vault data renders empty state
- **WHEN** `list_timeline` returns an empty array
- **THEN** the tree renders an empty state message rather than crashing

#### Scenario: Entry with has_children true renders expand toggle
- **WHEN** `list_timeline` returns an entry with `has_children: true`
- **THEN** the entry item shows an expand/collapse toggle control

#### Scenario: Entry with has_children false renders as a leaf
- **WHEN** `list_timeline` returns an entry with `has_children: false`
- **THEN** the entry item has no expand/collapse toggle and behaves as a leaf node

---

## ADDED Requirements

### Requirement: DateTree fetches and displays entry children when an entry is expanded
When a user expands an entry node (one with `has_children: true`), `DateTree` SHALL call `invoke('list_entry_children', { date, entryId })` and render the returned `EntryChildrenListing` as child rows beneath the entry item. Direct notes SHALL be rendered as leaf note items. Sub-folders SHALL be rendered as collapsible sub-folder nodes containing their notes. If `list_entry_children` fails the entry node SHALL remain expanded but show an error indicator; no crash SHALL occur.

#### Scenario: Expanding entry loads and shows children
- **WHEN** the user clicks the expand toggle on an entry with `has_children: true`
- **THEN** `list_entry_children` is called and the returned notes and sub-folders appear as child rows under the entry

#### Scenario: Already-loaded children are not re-fetched on collapse and re-expand
- **WHEN** the user collapses and then re-expands an entry whose children were already loaded
- **THEN** `list_entry_children` is NOT called again and the previously loaded children are displayed immediately

#### Scenario: Error loading children shows indicator without crash
- **WHEN** `list_entry_children` rejects after the user expands the entry
- **THEN** the entry row shows an error or empty state indicator and the component does not throw

### Requirement: Entry children are refreshed after a new sub-folder or note is created
After a successful `create_entry_subfolder` or `create_entry_note` call, `DateTree` SHALL re-invoke `list_entry_children` for the affected entry and update the displayed children with the fresh result.

#### Scenario: Children refresh after new sub-folder
- **WHEN** `create_entry_subfolder` succeeds for an entry that is currently expanded
- **THEN** `list_entry_children` is called and the new sub-folder appears in the tree without a full page reload

#### Scenario: Children refresh after new note
- **WHEN** `create_entry_note` succeeds for an entry that is currently expanded
- **THEN** `list_entry_children` is called and the new note appears in the tree
