# Save/Load + Tabbed UI Upgrade

GitHub issues: #4 (remove SVG export), #5 (Print/Preview PNG buttons), #6 (header + tabs shell), #7 (Save State), #8 (Saved tab list + delete), #9 (Copy Data).

All work lands on a single branch, `feature/ramps-save-load-ui`, with one commit per issue, ending in a single PR that closes #4–#9.

## Goals

- Drop SVG export entirely.
- Replace the PNG-scale radio group with two fixed-size download buttons.
- Let the user snapshot the entire current control state ("Save State"), see a reverse-chronological list of snapshots, recall any of them, and delete ones they no longer want.
- Let the user copy the current live state to the clipboard as JSON.
- Reorganize the panel into two tabs (Controls / Saved) under a shared header, per Figma (node 22:920 for Controls, 22:1190 for Saved).

## Non-goals

- No change to the actual gradient-rendering logic, sliders, locks, or randomize/reset behavior — they move to a new tab, unchanged.
- No naming/labeling of individual saves beyond the save timestamp.
- No cap or pruning of the saved-states list.
- No custom confirm modal — native `confirm()` is sufficient for delete.

## Data model

New localStorage key: `ramps-saved-states`, a JSON array of entries, newest first:

```json
[
  { "timestamp": "2026-09-21-14-03-22", "state": { ...snapshot } }
]
```

`timestamp` uses the existing `getTimestamp()` format (`yyyy-mm-dd-hh-mm-ss`), generated at save time — this is also the display text and the recall link.

`state` is a flat object keyed by control label in camelCase, mapped from the existing internal fields:

| Saved key     | Internal field | Source                       |
| ------------- | --------------- | ----------------------------- |
| `colours`     | stop count      | `#stops` value                |
| `palette`     | color array     | `color-0..N` localStorage     |
| `type`        | `type`          | gradient type radio           |
| `spread`      | `spread`        | spread radio                  |
| `radius`      | `r`             | radius slider                 |
| `shearX`      | `skewX`         | shear X slider                |
| `shearY`      | `skewY`         | shear Y slider                |
| `rotation`    | `rotate`        | rotation slider                |
| `scaleX`      | `scaleX`        | scale X slider                |
| `scaleY`      | `scaleY`        | scale Y slider                |
| `centreX`     | `cx`            | centre X slider               |
| `centreY`     | `cy`            | centre Y slider               |
| `focusX`      | `fx`            | focus X slider                |
| `focusY`      | `fy`            | focus Y slider                |
| `focalRadius` | `fr`            | focal radius slider           |
| `startX`      | `startX`        | linear start X slider         |
| `startY`      | `startY`        | linear start Y slider         |
| `endX`        | `endX`          | linear end X slider           |
| `endY`        | `endY`          | linear end Y slider           |

Two pure functions carry this mapping both ways: `collectSavedState()` (live controls → saved-shape object) and `applySavedState(state)` (saved-shape object → live controls, reusing the existing `applyFormState`/palette-rebuild plumbing). Both `Save State` and `Copy Data` call `collectSavedState()`; recall calls `applySavedState()`.

## Flows

- **Save State**: `collectSavedState()` → prepend `{ timestamp: getTimestamp(), state }` to the `ramps-saved-states` array → persist → re-render the Saved tab list (even if not currently visible).
- **Recall**: click a saved timestamp link → `applySavedState(entry.state)` → this also persists as the new live state (same as any other control change today), so a reload doesn't revert it.
- **Delete**: click the row's trash button → `confirm("Are you sure?")` → on confirm, splice the entry out of the array, persist, re-render the list. No confirmation on Save (only on delete).
- **Copy Data**: `collectSavedState()` → `navigator.clipboard.writeText(JSON.stringify(state))`, unprocessed (no timestamp wrapper — that's specific to a saved list entry, not to the live snapshot).

## Layout

Header row: "Ramps" title (shrunk from the current `h1` to match the `heading/base` scale in Figma) + a black "Save State" button on the left; "Copy Data", "Preview Quality", "Print Quality" buttons on the right. Directly below: a pill-style tab rail (`Controls` / `Saved`), active tab shown with a white background + border, inactive tab plain text. Removing the SVG button and the PNG-scale fieldset frees the vertical space the new rail needs, so no existing control shrinks — "tighter padding" mainly means collapsing that now-empty header space, matching the Figma spacing tokens (`space/lg` 32px panel padding, `space/base` 16px between header/rail/content, `space/sm` 8px inside groups).

Controls tab: exactly the current Colour + Form sections, moved as-is.

Saved tab: a list of rows, each `{ timestamp link, delete button }`, reverse-chronological. Empty state: a plain "No saved states yet" message when the array is empty.

Icons: this project inlines Lucide SVGs (no icon font, unlike the Figma mock which uses Font Awesome Pro glyphs). New buttons get equivalent inline Lucide icons: `save`/`sparkles` for Save State, `copy` for Copy Data, the existing `download` icon (already used for PNG) for both quality buttons, `trash-2` for delete.

## Testing

Manual verification in-browser (`npm` doesn't exist here — plain static files, open via a local server or `file://`):

- Save a state, confirm it appears at the top of the Saved list with the current timestamp.
- Change controls, click a recalled timestamp, confirm the display and all controls snap back to the saved values.
- Delete a saved entry, confirm the native dialog appears and cancel/confirm both behave correctly.
- Copy Data, paste into a text field, confirm valid JSON matching the schema above.
- Reload the page after a recall, confirm the recalled state (not the pre-recall state) persists.
- Resize below 900px, confirm the tab rail and header still fit (existing responsive breakpoint in `css/media.css`).
