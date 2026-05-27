## Purpose

Frontend component and utility for rendering vault timeline entries as a collapsible year/month/day tree.

## Requirements

### Requirement: mapTimelineToTree groups DayListings into a year/month/day structure
A pure function `mapTimelineToTree(days: DayListing[]): TreeYear[]` SHALL be exported from `src/lib/timeline.ts`. It SHALL parse each `DayListing.date` string (`YYYY-MM-DD`) into numeric year, month, and day components, then group the listings into a nested structure: `TreeYear[]` → `TreeMonth[]` → `TreeDay[]` → `EntryMeta[]`. Years and months SHALL be sorted descending (newest first). Days within a month SHALL be sorted descending. Month labels SHALL be English full names (e.g. "May"). The function SHALL be pure — no side effects, no IPC calls.

#### Scenario: Multiple dates grouped correctly
- **WHEN** `mapTimelineToTree` is called with listings for `2025-05-27`, `2025-05-26`, and `2024-12-01`
- **THEN** the result contains two `TreeYear` nodes (2025 and 2024), 2025 contains one `TreeMonth` ("May") with two `TreeDay` nodes (27 and 26), and 2024 contains one `TreeMonth` ("December") with one `TreeDay` node (1)

#### Scenario: Empty input returns empty array
- **WHEN** `mapTimelineToTree` is called with an empty array
- **THEN** it returns an empty array without throwing

#### Scenario: Years sorted descending
- **WHEN** input contains dates from 2023, 2025, and 2024
- **THEN** the output year nodes appear in order 2025, 2024, 2023

---

### Requirement: DateTree component renders the vault tree from live backend data
The `DateTree` component SHALL call `invoke('list_timeline')` on mount and store the result in local state. It SHALL pass the response through `mapTimelineToTree` and render the grouped structure as a collapsible tree: year nodes at the top level, month nodes nested within years, day nodes nested within months, and entry items listed within days. Each entry item SHALL display its `title` and a type badge (`meeting`, `event`, or `task`). The component SHALL accept an `onSelect: (filePath: string) => void` prop.

#### Scenario: Tree renders entries from backend response
- **WHEN** `DateTree` mounts and `list_timeline` returns one day with two entries
- **THEN** the tree displays one year node, one month node, one day node, and two entry items with their titles

#### Scenario: Type badge is displayed
- **WHEN** an entry has `entry_type: "meeting"`
- **THEN** the entry item displays a "meeting" badge or label

#### Scenario: No vault data renders empty state
- **WHEN** `list_timeline` returns an empty array
- **THEN** the tree renders an empty state message rather than crashing

---

### Requirement: DateTree collapses and expands year, month, and day nodes
Year, month, and day nodes in the tree SHALL be independently collapsible. Clicking a node header SHALL toggle its expanded/collapsed state. On initial render, the most recent year and its most recent month SHALL be expanded; all other nodes SHALL be collapsed.

#### Scenario: Most recent year and month are expanded on load
- **WHEN** the `DateTree` first renders with data
- **THEN** the highest year and its highest month are expanded; other years are collapsed

#### Scenario: Clicking a collapsed year expands it
- **WHEN** the user clicks a collapsed year node
- **THEN** that year's month nodes become visible

#### Scenario: Clicking an expanded year collapses it
- **WHEN** the user clicks an already-expanded year node
- **THEN** that year's month nodes are hidden

---

### Requirement: Selecting an entry calls onSelect with the entry's _config.md path
When the user clicks an entry item in the tree, `DateTree` SHALL call `onSelect` with the absolute file path: `{vaultRoot}/timeline/{date}/{entry_id}/_config.md`. The component SHALL receive `vaultRoot` as a prop.

#### Scenario: Clicking an entry fires onSelect with correct path
- **WHEN** the user clicks an entry with `date: "2025-05-27"` and `id: "abc123"` in a vault at `/Users/alice/vault`
- **THEN** `onSelect` is called with `/Users/alice/vault/timeline/2025-05-27/abc123/_config.md`

---

### Requirement: DateTree refetches on window focus
The `DateTree` component SHALL add a `focus` event listener on `window` when it mounts and remove it when it unmounts. When the window receives focus, the component SHALL re-invoke `list_timeline` and update the displayed tree with the fresh response.

#### Scenario: Refetch triggered on window focus
- **WHEN** the window gains focus after a folder has been manually created in the vault
- **THEN** `list_timeline` is called again and the new entry appears in the tree
