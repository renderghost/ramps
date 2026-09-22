# Ramps

A single-page tool for designing SVG radial gradients and exporting them as print-ready PNG files. You pick a set of colors, shape the gradient with a handful of sliders, and download the result.

## How it works

The app is one `<circle>` filled by one `<radialGradient>`. Every control in the panel either:

- edits an attribute on the `<radialGradient id="radial-gradient">` element (`cx`, `cy`, `r`, `fx`, `fy`, `spreadMethod`, `gradientTransform`), or
- adds/removes/recolors the `<stop>` children inside it, or
- triggers a one-off action (randomize, reset, download).

There's no build step or framework — plain HTML/CSS/JS, no npm, no bundler. Icons are inline SVGs copied from [Lucide](https://lucide.dev) (MIT licensed).

```
index.html          Markup for the panel (Colour + Form) and the result pane
ramps.js            All control behavior (event listeners, SVG updates, persistence, downloads)
css/
  tokens.css        Spacing, radius, color and type scale as CSS custom properties
  reset.css         Minimal reset + the .visually-hidden utility
  type.css          Inter font import + heading/label type styles
  layout.css        The two-pane grid (panel + result) and section spacing
  input.css         Buttons, custom radio, custom range slider, number inputs, palette swatches
  feedback.css      The drag tooltip that appears above a slider thumb
  special.css       The result circle's shape/border
  media.css         Responsive breakpoint — panel and result stack below 900px
  utility.css       Unused placeholder, kept as-is
```

### What persists vs. what doesn't

- **Colors** are saved to `localStorage` (`color-0`, `color-1`, …) and survive a page reload. **The color count** is saved separately under `ramps-stops`, so dragging the Colours slider — or recalling a saved state with a different count — survives a reload too.
- **Spread, Radius, Shear X/Y, Centre X/Y and Focus X/Y** are saved together as one object under `ramps-form-state` and also survive a reload. **Reset Sliders** is the only thing that clears them back to defaults (Spread: Repeat, Radius/Centre/Focus: 50, Shear: 0) — it doesn't touch the palette.
- **Saved states** — each snapshot taken with **Save State** is appended to an array of `{timestamp, state}` objects under `ramps-saved-states`, and persists across reloads until removed from the Saved tab.

## Controls reference

### Colour

| Control               | Element(s)                                            | Does                                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Colours**            | `#stops` (range, 2–10) + `#stops-number`              | Sets how many color stops the gradient has. Rebuilds the stop list and the palette swatches below it.                                                                                                 |
| **Palette**            | `#color-picker` → one `<input type="color">` per stop | Sets the `stop-color` for each stop, in order. The **first** swatch also sets the page's background circle color (the disc behind the gradient circle), so it doubles as a fill/backdrop color.       |
| **Randomise Palette**  | `#randomise`                                          | Assigns a new random hex color to every stop.                                                                                                                                                         |

### Form

| Control                | Element(s)                                | SVG attribute                  | Does                                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Spread**              | `input[name=spread]` (Pad / Reflect / Repeat) | `spreadMethod`              | Controls what happens once you're past the gradient's defined radius. **Pad** holds the last stop's color forever. **Reflect** mirrors the gradient back and forth. **Repeat** tiles the gradient over and over — this is what produces the banded/ramp look, and is the default. |
| **Radius**              | `#r` + `#r-number`                        | `r` (%)                         | Radius of the gradient before it starts padding/reflecting/repeating. Smaller values → more, tighter bands. Larger values → fewer, wider bands.                                                                                                                        |
| **Shear X**             | `#skewX` + `#skewX-number` (-90 to 90)    | `gradientTransform="skewX(…)"`  | Shears the gradient horizontally. Combined with Repeat, this is what turns concentric rings into diagonal stripes.                                                                                                                                                      |
| **Shear Y**             | `#skewY` + `#skewY-number` (-90 to 90)    | `gradientTransform="skewY(…)"`  | Same shear, applied vertically. Shear X and Shear Y together set the angle of the diagonal stripes.                                                                                                                                                                     |
| **Centre X**            | `#cx` + `#cx-number`                      | `cx` (%)                        | Horizontal position of the gradient's center, as a percentage of the shape's bounding box (0 = left edge, 100 = right edge).                                                                                                                                            |
| **Centre Y**            | `#cy` + `#cy-number`                      | `cy` (%)                        | Vertical position of the gradient's center (0 = top edge, 100 = bottom edge).                                                                                                                                                                                            |
| **Focus X**             | `#fx` + `#fx-number`                      | `fx` (%)                        | Horizontal position of the gradient's _focal point_ — where the first color stop (0%) effectively radiates from. Independent of Centre X; offsetting it creates an off-center "hotspot" or lens effect.                                                                |
| **Focus Y**             | `#fy` + `#fy-number`                      | `fy` (%)                        | Vertical position of the focal point, independent of Centre Y.                                                                                                                                                                                                          |
| **Randomise Sliders**   | `#randomise-sliders`                      | —                                | Randomizes color count, Spread, Radius, Shear X/Y, Centre X/Y and Focus X/Y all in one click.                                                                                                                                                                           |
| **Reset Sliders**       | `#reset-sliders`                          | —                                | Restores Spread/Radius/Shear/Centre/Focus to their defaults without touching the palette.                                                                                                                                                                                |

Every slider has a paired number input (e.g. `#r` ↔ `#r-number`) that stays in sync both ways, so you can type an exact value instead of dragging. Dragging or arrow-keying a slider also shows a small tooltip above the thumb with the live value.

> Technical note: `cx`, `cy`, `r`, `fx`, `fy` are percentages of the gradient's **object bounding box** (the circle it's painted on), not the SVG viewport. That's why values are entered as plain 0–100 numbers rather than pixels.

### Export

| Control              | Element(s)                | Does                                                                                                    |
| --------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Preview Quality**   | `#download-png-preview`   | Rasterizes the live SVG onto a 1000×1000 canvas and downloads it as `ramp-<timestamp>-preview.png`.       |
| **Print Quality**     | `#download-png-print`     | Rasterizes the live SVG onto a 10000×10000 canvas and downloads it as `ramp-<timestamp>-print.png`.       |

Both rasterize a `<canvas>` from the live SVG and download the result as a PNG; there's no SVG export. If either step fails (canvas creation or blob rendering), an alert suggests trying Preview Quality instead — it's the much smaller of the two and unlikely to fail.

### Save & Recall

| Control          | Element(s)                                    | Does                                                                                                                                                                    |
| ----------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Save State**    | `#save-state`                                 | Snapshots the current color count, palette, gradient type, and every Form control value, timestamps it, and adds it to the top of the **Saved** tab's list.            |
| **Saved tab**     | `#tab-saved` / `#panel-saved` → `#saved-list` | Lists every saved snapshot by timestamp, newest first.                                                                                                                  |
| **Recall**        | a saved timestamp (`.saved-list__link`)       | Restores that snapshot's color count, palette, gradient type, and Form values, and makes it the live persisted state (so a reload after recalling keeps it).           |
| **Delete**        | the trash button (`.saved-list__delete`)      | Removes that saved snapshot after a confirmation prompt. Only affects the Saved list — it doesn't touch the current live state.                                        |
| **Copy Data**     | `#copy-data`                                  | Copies the *current live* state (not a saved snapshot) to the clipboard as JSON — same shape as a saved entry's `state` field, but with no `timestamp`. Needs a secure context (HTTPS or localhost); shows an alert if clipboard access isn't available or the copy fails. |

### Header & tabs

The header sits above the Colour/Form controls: the "Ramps" title and **Save State** button are on the left, and **Copy Data**, **Preview Quality** and **Print Quality** are on the right. Below that sits a **Controls** / **Saved** tab rail — **Controls** shows the Colour and Form sections described above, **Saved** shows the saved-state list described in Save & Recall.

## Layout

A two-pane CSS grid: the panel (Colour + Form controls) on the left, sized `minmax(360px, 840px)`, and the result pane filling the rest with the gradient circle centered in it. Below 900px wide, the grid collapses to one column and the panel stacks above the result (see `css/media.css`).

## Known gaps

- Each control has an individual lock button (persisted under `ramps-locks`) that excludes it from **Randomise Sliders** and **Reset Sliders**, so you can hold some axes fixed while exploring others — but there's no "lock all" / "unlock all" shortcut, so locking several controls at once means clicking each one individually.
- `css/utility.css` is an empty placeholder, unused.
