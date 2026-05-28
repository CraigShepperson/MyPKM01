## MODIFIED Requirements

### Requirement: mapTimelineToTree groups DayListings into a year/month/day structure
A pure function `mapTimelineToTree(days: DayListing[]): TreeYear[]` SHALL be exported from `src/lib/timeline.ts`. It SHALL inspect each `DayListing.date` string and classify it by shape: a 4-character string as year-resolution, a 7-character string (`YYYY-MM`) as month-resolution, and a 10-character string (`YYYY-MM-DD`) as day-resolution. Listings that do not match any of these shapes SHALL be silently skipped. The function SHALL group the listings into a nested structure: `TreeYear[]` → `TreeMonth[]` → `TreeDay[]`. Year-resolution entries SHALL be placed in `TreeYear.entries`. Month-resolution entries SHALL be placed in `TreeMonth.entries` within the appropriate year node. Day-resolution entries SHALL be placed in `TreeDay.entries` as before. Years and months SHALL be sorted ascending (oldest first). Days within a month SHALL be sorted ascending. Month labels SHALL be English full names (e.g. "May"). The function SHALL be pure — no side effects, no IPC calls.

#### Scenario: Multiple dates grouped correctly
- **WHEN** `mapTimelineToTree` is called with listings for `2025-05-27`, `2025-05-26`, and `2024-12-01`
- **THEN** the result contains two `TreeYear` nodes (2024 and 2025), 2024 contains one `TreeMonth` ("December") with one `TreeDay` node (1), and 2025 contains one `TreeMonth` ("May") with two `TreeDay` nodes (26 and 27)

#### Scenario: Year-resolution listing placed on TreeYear
- **WHEN** `mapTimelineToTree` is called with a listing for date `"2027"`
- **THEN** the result contains a `TreeYear` node for 2027 with one entry in `entries` and no month nodes

#### Scenario: Month-resolution listing placed on TreeMonth
- **WHEN** `mapTimelineToTree` is called with a listing for date `"2027-06"`
- **THEN** the result contains a `TreeYear` node for 2027 with one `TreeMonth` node for June, that month node has one entry in `entries`, and no `TreeDay` nodes

#### Scenario: Mixed resolutions in the same year
- **WHEN** `mapTimelineToTree` is called with listings for `"2027"`, `"2027-06"`, and `"2027-06-15"`
- **THEN** the `TreeYear` for 2027 has one year-level entry, the `TreeMonth` for June has one month-level entry, and the `TreeDay` for the 15th has one day-level entry

#### Scenario: Empty input returns empty array
- **WHEN** `mapTimelineToTree` is called with an empty array
- **THEN** it returns an empty array without throwing

#### Scenario: Years sorted ascending
- **WHEN** input contains dates from 2023, 2025, and 2024
- **THEN** the output year nodes appear in order 2023, 2024, 2025

---

### Requirement: DateTree component renders the vault tree from live backend data
The `DateTree` component SHALL call `invoke('list_timeline')` on mount and store the result in local state. It SHALL pass the response through `mapTimelineToTree` and render the grouped structure as a collapsible tree: year nodes at the top level, with year-level entries listed directly below the year header; month nodes nested within years, with month-level entries listed directly below the month header; day nodes nested within months, with day-level entries listed within days. Each entry item SHALL display its `title` and a type badge (`meeting`, `event`, or `task`). The component SHALL accept an `onSelect: (filePath: string) => void` prop.

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
