## ADDED Requirements

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

## MODIFIED Requirements

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
