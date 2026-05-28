## MODIFIED Requirements

### Requirement: mapTimelineToTree groups DayListings into a year/month/day structure
A pure function `mapTimelineToTree(days: DayListing[]): TreeYear[]` SHALL be exported from `src/lib/timeline.ts`. It SHALL parse each `DayListing.date` string (`YYYY-MM-DD`) into numeric year, month, and day components, then group the listings into a nested structure: `TreeYear[]` → `TreeMonth[]` → `TreeDay[]` → `EntryMeta[]`. Years and months SHALL be sorted ascending (oldest first). Days within a month SHALL be sorted ascending. Month labels SHALL be English full names (e.g. "May"). The function SHALL be pure — no side effects, no IPC calls.

#### Scenario: Multiple dates grouped correctly
- **WHEN** `mapTimelineToTree` is called with listings for `2025-05-27`, `2025-05-26`, and `2024-12-01`
- **THEN** the result contains two `TreeYear` nodes (2024 and 2025), 2024 contains one `TreeMonth` ("December") with one `TreeDay` node (1), and 2025 contains one `TreeMonth` ("May") with two `TreeDay` nodes (26 and 27)

#### Scenario: Empty input returns empty array
- **WHEN** `mapTimelineToTree` is called with an empty array
- **THEN** it returns an empty array without throwing

#### Scenario: Years sorted ascending
- **WHEN** input contains dates from 2023, 2025, and 2024
- **THEN** the output year nodes appear in order 2023, 2024, 2025
