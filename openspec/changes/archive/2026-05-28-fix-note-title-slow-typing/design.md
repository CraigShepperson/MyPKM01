## Context

`NotePanel` holds a controlled `titleValue` state that is kept in sync with the `title` prop via a `useEffect([title])`. Separately, a 500 ms debounce in `handleTitleChange` persists edits to disk and then calls `onEntryRenamed` / `onNoteRenamed`, which triggers a parent re-render that passes the freshly-read title back as a new `title` prop. This causes the effect to fire again, overwriting whatever the user has typed since the last save — visible as the cursor jumping or characters disappearing after any pause longer than 500 ms.

## Goals / Non-Goals

**Goals:**
- Title input remains stable while the user is actively editing, regardless of how slowly they type or how often the parent re-renders.
- Title resets correctly when the user navigates to a different note.

**Non-Goals:**
- Handling concurrent external renames of the same note (out of scope for this app).
- Changing debounce duration or save strategy.

## Decisions

### Change `useEffect` dependency from `[title]` to `[filePath]`

The sync from prop to state is needed in exactly one case: the user navigates to a different note and the component must show the new note's title. That transition is signalled by `filePath` changing, not by `title` changing. Switching the dependency array to `[filePath]` means the reset only fires on navigation.

**Alternatives considered:**

- *`isDirty` ref* — set `true` on every keystroke, `false` after save completes; skip the effect when dirty. Works, but adds mutable ref state and a timing dependency on the async save callback.
- *Guard on `debounceTimer.current`* — skip the effect when a timer is pending. Fails if the timer just fired but the parent hasn't re-rendered yet (race condition).
- *Compare incoming prop to last saved value* — track a `savedTitle` ref and skip the effect if `title === savedTitle.current`. Also works, but requires an extra ref and explicit bookkeeping on every save path.

The `[filePath]` approach is the smallest, most reliable change: no extra state, no timing assumptions, and it directly models the intended semantics.

## Risks / Trade-offs

- **External title change for the same filePath goes unshown** — if something outside the component changes the title without changing the filePath (e.g., a future background sync), the input won't update. This is an acceptable trade-off given the app's current architecture and the absence of such a feature.

## Migration Plan

Single-file change to `src/components/editor/NotePanel.tsx`. No migration or rollback steps required; the change is immediately reversible by restoring the original dependency array.
