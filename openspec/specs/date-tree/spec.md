## Purpose

Frontend component and utility for rendering vault timeline entries as a collapsible year/month/day tree.

## Requirements

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

### Requirement: findNearestFutureDate locates the closest future TreeDay
A pure function `findNearestFutureDate(tree: TreeYear[], today: string): { year: number; month: number; date: string } | null` SHALL be exported from `src/lib/timeline.ts`. It SHALL return the year, month number, and full `YYYY-MM-DD` date string of the first `TreeDay` whose `date` is lexicographically `>=` the `today` parameter. It SHALL traverse years and months in their existing ascending order. It SHALL return `null` if no such day exists. The function SHALL be pure — no side effects, no I/O.

#### Scenario: Returns nearest future date
- **WHEN** `findNearestFutureDate` is called with a tree containing `2025-05-01` and `2025-06-15`, and `today` is `"2025-05-20"`
- **THEN** it returns `{ year: 2025, month: 6, date: "2025-06-15" }`

#### Scenario: Returns today when today is in the tree
- **WHEN** `findNearestFutureDate` is called and the tree contains a day whose `date` exactly equals `today`
- **THEN** it returns that day's year, month, and date

#### Scenario: Returns null when all dates are in the past
- **WHEN** `findNearestFutureDate` is called and every `TreeDay.date` is lexicographically less than `today`
- **THEN** it returns `null`

#### Scenario: Empty tree returns null
- **WHEN** `findNearestFutureDate` is called with an empty array
- **THEN** it returns `null` without throwing

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

---

### Requirement: DateTree collapses and expands year, month, and day nodes
Year, month, and day nodes in the tree SHALL be independently collapsible. Clicking a node header SHALL toggle its expanded/collapsed state. On initial render, the year, month, and day nodes for the nearest future date (the closest `TreeDay` whose date is ≥ today) SHALL be expanded; all other nodes SHALL be collapsed. If no future dates exist in the tree, the most recent year, its most recent month, and that month's most recent day SHALL be expanded instead.

#### Scenario: Nearest future date path is expanded on load
- **WHEN** the `DateTree` first renders with data containing both past and future dates
- **THEN** the year, month, and day nodes on the path to the nearest future date are expanded; all other year, month, and day nodes are collapsed

#### Scenario: Most recent past date expanded when no future dates exist
- **WHEN** the `DateTree` first renders with data containing only dates before today
- **THEN** the year, month, and day nodes for the most recent past date are expanded; all other nodes are collapsed

#### Scenario: Today's date is treated as a future date
- **WHEN** the `DateTree` first renders and today's date appears in the tree alongside earlier dates
- **THEN** today's year, month, and day nodes are expanded

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

---

### Requirement: DateTree re-fetches timeline data when refreshKey changes
The `DateTree` component SHALL accept an optional `refreshKey` prop of type `number`. Whenever the value of `refreshKey` changes (compared to its previous value), the component SHALL invoke `list_timeline` and update the displayed tree with the fresh response. The initial mount fetch SHALL NOT be skipped — the existing mount-time fetch runs independently of `refreshKey`.

#### Scenario: Incrementing refreshKey triggers a re-fetch
- **WHEN** the parent component increments `refreshKey` (e.g. from 0 to 1)
- **THEN** `DateTree` calls `list_timeline` again and re-renders the tree with the updated data

#### Scenario: refreshKey unchanged does not trigger additional fetch
- **WHEN** the parent re-renders but passes the same `refreshKey` value as the previous render
- **THEN** `DateTree` does NOT issue an additional `list_timeline` call

#### Scenario: refreshKey omitted does not break component
- **WHEN** `DateTree` is rendered without a `refreshKey` prop
- **THEN** the component behaves as before — fetching on mount and on window focus only

---

### Requirement: DateTree re-expands to nearest future date when focusTodayKey changes
The `DateTree` component SHALL accept an optional `focusTodayKey` prop of type `number`. Whenever the value of `focusTodayKey` changes (compared to its previous value), the component SHALL re-run the nearest-future-date expansion logic: it SHALL collapse all currently expanded nodes and expand only the year, month, and day nodes on the path to the nearest future date (or today if today exists in the tree). If no future dates exist, it SHALL expand the most recent year, month, and day nodes instead. The initial mount expansion SHALL NOT be affected by this prop — both the mount-time expansion and `focusTodayKey`-triggered expansion use the same logic.

#### Scenario: focusTodayKey increment collapses other nodes and expands today's path
- **WHEN** the parent increments `focusTodayKey` while the user has manually expanded several unrelated year/month/day nodes
- **THEN** all previously expanded nodes are collapsed and only the year, month, and day path to the nearest future date (or most recent past date if no future dates exist) are expanded

#### Scenario: focusTodayKey triggers expansion even if today is already expanded
- **WHEN** the parent increments `focusTodayKey` and the nearest future date path is already expanded
- **THEN** the component re-runs the expansion logic; the result is the same expanded path (idempotent)

#### Scenario: focusTodayKey omitted does not affect behaviour
- **WHEN** `DateTree` is rendered without a `focusTodayKey` prop
- **THEN** the component behaves as before — expanding on mount and responding to `refreshKey` only

#### Scenario: focusTodayKey unchanged does not trigger re-expansion
- **WHEN** the parent re-renders with the same `focusTodayKey` value
- **THEN** `DateTree` does NOT re-run the expansion logic and does NOT disturb the user's current expanded state
