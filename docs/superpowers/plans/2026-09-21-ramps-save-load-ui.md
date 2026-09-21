# Ramps Save/Load + Tabbed UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove SVG export, replace the PNG-scale radios with two fixed-size download buttons, and add a tabbed UI (Controls/Saved) with a save/recall/delete/copy-to-clipboard state-snapshot feature.

**Architecture:** Six sequential edits to the existing plain-JS single-page app: two removals (SVG export, PNG-scale radios), a structural header/tabs rewrite, and a new small persistence layer (`ramps-saved-states` in `localStorage`) with save/recall/delete/copy operations layered on top of the existing per-control `localStorage` pattern already used for colours and form state.

**Tech Stack:** Plain HTML/CSS/JS. No build step, no framework, no package manager. `localStorage` for persistence. Native Clipboard API for Copy Data.

**Spec:** [docs/superpowers/specs/2026-09-21-save-load-ui-design.md](../specs/2026-09-21-save-load-ui-design.md)

## Global Constraints

- No build step — edit `index.html`, `ramps.js`, and `css/*.css` directly; no npm, no bundler.
- Every new CSS value must use an existing `var(--token)` from `css/tokens.css`; add a new token there first if the value doesn't exist yet (see Task 3 and Task 5).
- Follow the existing BEM-ish class naming already in the CSS (`.block__element`, `.block--modifier`).
- New icons are inline SVGs matching the existing hand-copied Lucide style already used throughout `index.html` — no icon fonts, no external icon libraries.
- Delete confirmation uses the native `confirm()` dialog — no custom modal.
- There is no automated test suite in this repo. Verify each task by serving the site locally — `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000/index.html` — and exercising it in a real browser. Use a served URL, not `file://`: Task 6's clipboard write requires a secure context, which `file://` does not reliably provide.
- One commit per task. Commit message format: `<type>: <description> (#<issue>)`, all on branch `feature/ramps-save-load-ui` (already created). Do not push or open the PR until explicitly told to — that happens once, after the last task.

---

### Task 1: Remove SVG export

**Files:**
- Modify: `index.html` (removes the `#download-svg` button)
- Modify: `ramps.js` (removes `handleDownloadSVG` and its call)

**Interfaces:** None — pure removal, no other task depends on anything from this one.

- [ ] **Step 1: Remove the SVG button from `index.html`**

Find this block (inside `.panel__header`'s `.button-row`) and remove the `#download-svg` button, leaving the `#download-png` button as the first (and only) child of `.button-row`:

```html
                <div class="button-row">
                    <button id="download-svg" class="button button--primary" type="button">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 15V3" />
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <path d="m7 10 5 5 5-5" />
                        </svg>
                        Download as SVG
                    </button>
                    <button id="download-png" class="button" type="button">
```

becomes:

```html
                <div class="button-row">
                    <button id="download-png" class="button" type="button">
```

- [ ] **Step 2: Remove `handleDownloadSVG` from `ramps.js`**

Delete this whole function (it sits right before the `PNG_BASE_SIZE` constant):

```js
function handleDownloadSVG() {
    const downloadSVGButton = document.getElementById('download-svg');
    downloadSVGButton.addEventListener('click', function () {
        const svg = document.getElementById('gradient-svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `ramp-${getTimestamp()}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
    });
}

```

- [ ] **Step 3: Remove its call in `window.onload`**

```js
    initialize();
    handleRandomise();
    handleDownloadSVG();
    handleDownloadPNG();
    handlePngScale();
```

becomes:

```js
    initialize();
    handleRandomise();
    handleDownloadPNG();
    handlePngScale();
```

- [ ] **Step 4: Verify manually**

Serve the site (`python3 -m http.server 8000` from the repo root) and open `http://localhost:8000/index.html`. Confirm: no SVG button is visible, no console errors, "Download as PNG" still downloads a file.

- [ ] **Step 5: Commit**

```bash
git add index.html ramps.js
git commit -m "feat: remove SVG export (#4)"
```

---

### Task 2: Replace PNG scale controls with Print/Preview quality buttons

**Files:**
- Modify: `index.html` (removes the PNG Scale fieldset, splits `#download-png` into two buttons)
- Modify: `ramps.js` (removes `handlePngScale`, rewrites `handleDownloadPNG`)

**Interfaces:**
- Produces: `downloadPng(size, suffix)` — renders the live SVG to a PNG of `size`×`size` px and downloads it as `ramp-<timestamp><suffix>.png`. `handleDownloadPNG()` wires the two buttons to it. No other task calls `downloadPng` directly, but Task 3 must not remove the `#download-png-preview` / `#download-png-print` IDs it relies on.

- [ ] **Step 1: Replace the PNG button + PNG Scale fieldset in `index.html`**

```html
                    <button id="download-png" class="button" type="button">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 15V3" />
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <path d="m7 10 5 5 5-5" />
                        </svg>
                        Download as PNG
                    </button>
                </div>
                <fieldset class="group">
                    <legend class="visually-hidden">PNG Scale</legend>
                    <div class="field-row field-row--wide">
                        <span class="field-label">PNG Scale</span>
                        <div class="radios">
                            <label class="radio-option">
                                <input type="radio" name="png-scale" value="1" checked>
                                1&times;
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="png-scale" value="2">
                                2&times;
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="png-scale" value="4">
                                4&times;
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="png-scale" value="8">
                                8&times;
                            </label>
                        </div>
                    </div>
                </fieldset>
            </header>
```

becomes:

```html
                    <button id="download-png-preview" class="button" type="button">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 15V3" />
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <path d="m7 10 5 5 5-5" />
                        </svg>
                        Preview Quality
                    </button>
                    <button id="download-png-print" class="button" type="button">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 15V3" />
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <path d="m7 10 5 5 5-5" />
                        </svg>
                        Print Quality
                    </button>
                </div>
            </header>
```

- [ ] **Step 2: Rewrite the PNG download logic in `ramps.js`**

Replace this whole block (from `const PNG_BASE_SIZE` through the end of `handleDownloadPNG`):

```js
const PNG_BASE_SIZE = 2000;
const PNG_SCALE_KEY = 'ramps-png-scale';

function handlePngScale() {
    const saved = localStorage.getItem(PNG_SCALE_KEY);
    if (saved) {
        const radio = document.querySelector(`input[name="png-scale"][value="${saved}"]`);
        if (radio) radio.checked = true;
    }
    document.querySelectorAll('input[name="png-scale"]').forEach((item) => {
        item.addEventListener('change', function () {
            localStorage.setItem(PNG_SCALE_KEY, this.value);
        });
    });
}

function handleDownloadPNG() {
    const downloadPNGButton = document.getElementById('download-png');
    downloadPNGButton.addEventListener('click', function () {
        const scale = Number(document.querySelector('input[name="png-scale"]:checked').value);
        const size = PNG_BASE_SIZE * scale;

        const svg = document.getElementById('gradient-svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        if (canvas.width !== size || canvas.height !== size) {
            alert(`Your browser couldn't create a canvas at ${size}×${size}px. Try a smaller scale.`);
            return;
        }

        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function () {
            ctx.drawImage(img, 0, 0, size, size);
            canvas.toBlob(function (blob) {
                if (!blob) {
                    alert(`Rendering at ${size}×${size}px failed in this browser. Try a smaller scale.`);
                    return;
                }
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = `ramp-${getTimestamp()}-${scale}x.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            });
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
}
```

with:

```js
const PNG_PREVIEW_SIZE = 1000;
const PNG_PRINT_SIZE = 10000;

function downloadPng(size, suffix) {
    const svg = document.getElementById('gradient-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    if (canvas.width !== size || canvas.height !== size) {
        alert(`Your browser couldn't create a canvas at ${size}×${size}px.`);
        return;
    }

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob(function (blob) {
            if (!blob) {
                alert(`Rendering at ${size}×${size}px failed in this browser.`);
                return;
            }
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `ramp-${getTimestamp()}${suffix}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function handleDownloadPNG() {
    document.getElementById('download-png-preview').addEventListener('click', function () {
        downloadPng(PNG_PREVIEW_SIZE, '-preview');
    });
    document.getElementById('download-png-print').addEventListener('click', function () {
        downloadPng(PNG_PRINT_SIZE, '-print');
    });
}
```

- [ ] **Step 3: Remove the `handlePngScale()` call in `window.onload`**

```js
    handleRandomise();
    handleDownloadPNG();
    handlePngScale();
    handleSpreadChange();
```

becomes:

```js
    handleRandomise();
    handleDownloadPNG();
    handleSpreadChange();
```

- [ ] **Step 4: Verify manually**

Reload the served page. Confirm both buttons are present, "Preview Quality" downloads `ramp-<timestamp>-preview.png`, "Print Quality" downloads `ramp-<timestamp>-print.png`. Open each PNG and confirm dimensions are 1000×1000 and 10000×10000 respectively (e.g. `sips -g pixelWidth -g pixelHeight <file>` on macOS, or check in Preview's inspector).

- [ ] **Step 5: Commit**

```bash
git add index.html ramps.js
git commit -m "feat: replace PNG scale controls with Print/Preview quality buttons (#5)"
```

---

### Task 3: Header + tabs shell

**Files:**
- Modify: `index.html` (new header layout, tab rail, wraps existing sections in a Controls tab panel, adds an empty Saved tab panel)
- Modify: `ramps.js` (adds `handleTabs()`)
- Modify: `css/tokens.css` (adds `--space-2xs`)
- Modify: `css/layout.css` (adds `.header-row`, `.header-row__group`, `.tab-panel`)
- Modify: `css/type.css` (adds `.panel__title`)
- Modify: `css/input.css` (adds `.tabs`, `.tab`)

**Interfaces:**
- Produces: tab buttons with `[data-tab="controls"|"saved"]` and `aria-selected`; tab panels with `id="panel-controls"|"panel-saved"`; `handleTabs()` wires clicks between them. The `#save-state` and `#copy-data` buttons are added here with **no click handlers yet** — Task 4 and Task 6 wire them. The `#saved-list` container div is added here empty — Task 4 fills it.
- Consumes: `#download-png-preview` / `#download-png-print` from Task 2 (moved into the new header, IDs unchanged, so `handleDownloadPNG()` keeps working with no changes).

- [ ] **Step 1: Replace the header markup in `index.html`**

```html
            <header class="panel__header">
                <div class="button-row">
                    <button id="download-png-preview" class="button" type="button">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 15V3" />
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <path d="m7 10 5 5 5-5" />
                        </svg>
                        Preview Quality
                    </button>
                    <button id="download-png-print" class="button" type="button">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 15V3" />
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <path d="m7 10 5 5 5-5" />
                        </svg>
                        Print Quality
                    </button>
                </div>
            </header>

            <section class="panel__section" aria-label="Colour">
```

becomes:

```html
            <header class="panel__header">
                <div class="header-row">
                    <div class="header-row__group">
                        <h1 class="panel__title">Ramps</h1>
                        <button id="save-state" class="button button--primary" type="button">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                                <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
                                <path d="M7 3v4a1 1 0 0 0 1 1h7" />
                            </svg>
                            Save State
                        </button>
                    </div>
                    <div class="header-row__group">
                        <button id="copy-data" class="button" type="button">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                            Copy Data
                        </button>
                        <button id="download-png-preview" class="button" type="button">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                <path d="M12 15V3" />
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <path d="m7 10 5 5 5-5" />
                            </svg>
                            Preview Quality
                        </button>
                        <button id="download-png-print" class="button" type="button">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                <path d="M12 15V3" />
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <path d="m7 10 5 5 5-5" />
                            </svg>
                            Print Quality
                        </button>
                    </div>
                </div>
                <div class="tabs" role="tablist">
                    <button class="tab" type="button" role="tab" id="tab-controls" data-tab="controls"
                        aria-selected="true" aria-controls="panel-controls">Controls</button>
                    <button class="tab" type="button" role="tab" id="tab-saved" data-tab="saved"
                        aria-selected="false" aria-controls="panel-saved">Saved</button>
                </div>
            </header>

            <div class="tab-panel" id="panel-controls" role="tabpanel" aria-labelledby="tab-controls">
            <section class="panel__section" aria-label="Colour">
```

(The `<section>` below keeps its original indentation — only the lines shown above change. Don't re-indent the ~470 unchanged lines of Colour/Form markup between here and Step 2; that would balloon the diff for no functional gain.)

- [ ] **Step 2: Close the Controls tab panel and add the Saved tab panel**

At the end of the Form section, find:

```html
                </div>
            </section>
        </div>

        <div class="result">
```

and change it to:

```html
                </div>
            </section>
            </div>

            <div class="tab-panel" id="panel-saved" role="tabpanel" aria-labelledby="tab-saved" hidden>
                <div class="saved-list" id="saved-list"></div>
            </div>
        </div>

        <div class="result">
```

- [ ] **Step 3: Add `--space-2xs` to `css/tokens.css`**

```css
:root {
    --space-0: 0;
    --space-px: 1px;
    --space-xs: 4px;
```

becomes:

```css
:root {
    --space-0: 0;
    --space-px: 1px;
    --space-2xs: 2px;
    --space-xs: 4px;
```

- [ ] **Step 4: Add header-row and tab-panel layout to `css/layout.css`**

Append to the end of the file:

```css
.header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-sm);
    flex-wrap: wrap;
}

.header-row__group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
}

.tab-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-base);
}

.tab-panel[hidden] {
    display: none;
}
```

- [ ] **Step 5: Add `.panel__title` to `css/type.css`**

Append to the end of the file:

```css
.panel__title {
    font-size: var(--font-size-md);
    line-height: var(--line-height-md);
    font-weight: var(--font-weight-bold);
}
```

- [ ] **Step 6: Add tab styling to `css/input.css`**

Append to the end of the file:

```css
/* Tabs */

.tabs {
    display: inline-flex;
    gap: var(--space-2xs);
    padding: var(--space-xs);
    background: var(--color-tint);
    border-radius: var(--radius-base);
}

.tab {
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid transparent;
    border-radius: var(--radius-soft);
    background: transparent;
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
}

.tab[aria-selected="true"] {
    background: var(--color-surface);
    border-color: var(--color-border);
}
```

- [ ] **Step 7: Add `handleTabs()` to `ramps.js`**

Insert this function immediately before `window.onload`:

```js
function handleTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', function () {
            tabs.forEach((t) => {
                const selected = t === tab;
                t.setAttribute('aria-selected', String(selected));
                document.getElementById(`panel-${t.dataset.tab}`).hidden = !selected;
            });
        });
    });
}

```

- [ ] **Step 8: Call `handleTabs()` in `window.onload`**

```js
    handleRandomiseSliders(controls);
    handleLocks();
};
```

becomes:

```js
    handleRandomiseSliders(controls);
    handleLocks();
    handleTabs();
};
```

- [ ] **Step 9: Verify manually**

Reload the served page. Confirm: title reads smaller ("Ramps" at the reduced size), header shows Save State (black), Copy Data / Preview Quality / Print Quality (outlined) — Save State and Copy Data don't need to *do* anything yet, just render without errors. Confirm the tab rail shows "Controls" (active/white) and "Saved" (inactive). Click "Saved" — the Controls content hides and an empty area (with just the empty `#saved-list` div) shows. Click "Controls" — it comes back with all sliders intact and working. Resize below 900px and confirm nothing overflows (existing `css/media.css` breakpoint).

- [ ] **Step 10: Commit**

```bash
git add index.html ramps.js css/tokens.css css/layout.css css/type.css css/input.css
git commit -m "feat: add header/tabs shell for Controls and Saved panels (#6)"
```

---

### Task 4: Save State — snapshot, persist, and recall

**Files:**
- Modify: `ramps.js` (adds the saved-state data model, `handleSaveState`, and list rendering with recall)
- Modify: `css/layout.css` (adds `.saved-list`, `.saved-list__item`, `.saved-list__empty`)
- Modify: `css/input.css` (adds `.saved-list__link`)

**Interfaces:**
- Consumes: `collectFormState()`, `applyFormState(state, controls)`, `saveFormState(state)`, `createSVGStops(stops)`, `createColorPickers(stops)`, `attachColorChangeHandlers(stops)`, `updateFillVar(rangeEl)`, `getTimestamp()` — all pre-existing, unchanged.
- Produces: `collectSavedState()` → returns `{ colours, palette, type, spread, radius, shearX, shearY, rotation, scaleX, scaleY, centreX, centreY, focusX, focusY, focalRadius, startX, startY, endX, endY }`. `applySavedState(saved, controls)` — applies that shape back to the live controls. `loadSavedStates()` / `persistSavedStates(states)` — read/write the `ramps-saved-states` array. `renderSavedList(controls)` — re-renders `#saved-list` from storage; Task 5 will extend the row markup this function builds.

- [ ] **Step 1: Add the saved-state model and Save State handler to `ramps.js`**

Insert this block immediately before the `handleTabs` function:

```js
const SAVED_STATES_KEY = 'ramps-saved-states';

function collectSavedState() {
    const formState = collectFormState();
    const stops = Number(document.getElementById('stops').value);
    const palette = [];
    for (let i = 0; i < stops; i++) {
        palette.push(localStorage.getItem(`color-${i}`));
    }

    return {
        colours: stops,
        palette,
        type: formState.type,
        spread: formState.spread,
        radius: formState.r,
        shearX: formState.skewX,
        shearY: formState.skewY,
        rotation: formState.rotate,
        scaleX: formState.scaleX,
        scaleY: formState.scaleY,
        centreX: formState.cx,
        centreY: formState.cy,
        focusX: formState.fx,
        focusY: formState.fy,
        focalRadius: formState.fr,
        startX: formState.startX,
        startY: formState.startY,
        endX: formState.endX,
        endY: formState.endY,
    };
}

function applySavedState(saved, controls) {
    document.getElementById('stops').value = saved.colours;
    document.getElementById('stops-number').value = saved.colours;
    saved.palette.forEach((color, i) => {
        localStorage.setItem(`color-${i}`, color);
    });
    createSVGStops(saved.colours);
    createColorPickers(saved.colours);
    attachColorChangeHandlers(saved.colours);
    updateFillVar(document.getElementById('stops'));

    const formState = {
        type: saved.type,
        spread: saved.spread,
        r: saved.radius,
        skewX: saved.shearX,
        skewY: saved.shearY,
        rotate: saved.rotation,
        scaleX: saved.scaleX,
        scaleY: saved.scaleY,
        cx: saved.centreX,
        cy: saved.centreY,
        fx: saved.focusX,
        fy: saved.focusY,
        fr: saved.focalRadius,
        startX: saved.startX,
        startY: saved.startY,
        endX: saved.endX,
        endY: saved.endY,
    };
    applyFormState(formState, controls);
    saveFormState(formState);
}

function loadSavedStates() {
    try {
        const saved = JSON.parse(localStorage.getItem(SAVED_STATES_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function persistSavedStates(states) {
    localStorage.setItem(SAVED_STATES_KEY, JSON.stringify(states));
}

function renderSavedList(controls) {
    const list = document.getElementById('saved-list');
    const states = loadSavedStates();

    if (states.length === 0) {
        list.innerHTML = '<p class="saved-list__empty">No saved states yet.</p>';
        return;
    }

    list.innerHTML = '';
    states.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'saved-list__item';

        const link = document.createElement('button');
        link.type = 'button';
        link.className = 'saved-list__link';
        link.textContent = entry.timestamp;
        link.addEventListener('click', function () {
            applySavedState(entry.state, controls);
        });

        item.appendChild(link);
        list.appendChild(item);
    });
}

function handleSaveState(controls) {
    document.getElementById('save-state').addEventListener('click', function () {
        const states = loadSavedStates();
        states.unshift({ timestamp: getTimestamp(), state: collectSavedState() });
        persistSavedStates(states);
        renderSavedList(controls);
    });
}

```

- [ ] **Step 2: Wire it up in `window.onload`**

```js
    handleLocks();
    handleTabs();
};
```

becomes:

```js
    handleLocks();
    handleTabs();
    handleSaveState(controls);
    renderSavedList(controls);
};
```

- [ ] **Step 3: Add saved-list layout to `css/layout.css`**

Append to the end of the file:

```css
.saved-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-px);
    width: 100%;
}

.saved-list__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-base);
    padding: var(--space-sm);
    background: var(--color-surface-muted);
    border-radius: var(--radius-base);
}

.saved-list__empty {
    padding: var(--space-sm);
    opacity: 0.6;
}
```

- [ ] **Step 4: Add the saved-list link style to `css/input.css`**

Append to the end of the file:

```css
.saved-list__link {
    font-weight: var(--font-weight-bold);
    text-decoration: underline;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--color-text);
    font: inherit;
}
```

- [ ] **Step 5: Verify manually**

Reload the served page. Set some sliders to distinctive values, click "Save State". Switch to the Saved tab — confirm a row appears with the current timestamp (`yyyy-mm-dd-hh-mm-ss`) as underlined, clickable text, and the empty-state message is gone. Change the sliders again, click the saved timestamp, and confirm every control (including the palette and stop count) snaps back to the saved values and the gradient preview updates. Reload the page entirely and confirm the recalled state (not the pre-recall one) is what's showing — it should persist via the existing `ramps-form-state`/`color-N` keys. Save a second state and confirm it appears above the first (newest first).

- [ ] **Step 6: Commit**

```bash
git add ramps.js css/layout.css css/input.css
git commit -m "feat: add Save State snapshot, persistence, and recall (#7)"
```

---

### Task 5: Saved tab — delete with confirmation

**Files:**
- Modify: `ramps.js` (extends `renderSavedList` with a delete button)
- Modify: `css/tokens.css` (adds `--magenta`, `--magenta-a16`, `--color-danger`, `--color-danger-border`)
- Modify: `css/input.css` (adds `.saved-list__delete`)

**Interfaces:**
- Consumes: `loadSavedStates()`, `persistSavedStates(states)`, `renderSavedList(controls)` from Task 4.
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Add danger-color tokens to `css/tokens.css`**

```css
:root {
    --black: #000000;
    --black-a06: rgba(0, 0, 0, 0.06);
    --black-a16: rgba(0, 0, 0, 0.16);
    --black-a24: rgba(0, 0, 0, 0.24);
    --white: #ffffff;
    --whitesmoke: #f5f5f5;
    --blue: #130df2;
}
```

becomes:

```css
:root {
    --black: #000000;
    --black-a06: rgba(0, 0, 0, 0.06);
    --black-a16: rgba(0, 0, 0, 0.16);
    --black-a24: rgba(0, 0, 0, 0.24);
    --white: #ffffff;
    --whitesmoke: #f5f5f5;
    --blue: #130df2;
    --magenta: #fc226a;
    --magenta-a16: rgba(252, 34, 106, 0.16);
}
```

And:

```css
:root {
    --color-surface: var(--white);
    --color-surface-muted: var(--whitesmoke);
    --color-text: var(--black);
    --color-text-inverse: var(--white);
    --color-border: var(--black-a16);
    --color-border-strong: var(--black-a24);
    --color-tint: var(--black-a06);
    --color-accent: var(--blue);
}
```

becomes:

```css
:root {
    --color-surface: var(--white);
    --color-surface-muted: var(--whitesmoke);
    --color-text: var(--black);
    --color-text-inverse: var(--white);
    --color-border: var(--black-a16);
    --color-border-strong: var(--black-a24);
    --color-tint: var(--black-a06);
    --color-accent: var(--blue);
    --color-danger: var(--magenta);
    --color-danger-border: var(--magenta-a16);
}
```

- [ ] **Step 2: Add delete-button styling to `css/input.css`**

Append to the end of the file:

```css
.saved-list__delete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    flex-shrink: 0;
    border: 1px solid var(--color-danger-border);
    border-radius: var(--radius-base);
    color: var(--color-danger);
}

.saved-list__delete:hover {
    background: var(--color-danger-border);
}

.saved-list__delete svg {
    width: 16px;
    height: 16px;
}
```

- [ ] **Step 3: Add the delete button inside `renderSavedList` in `ramps.js`**

```js
        const link = document.createElement('button');
        link.type = 'button';
        link.className = 'saved-list__link';
        link.textContent = entry.timestamp;
        link.addEventListener('click', function () {
            applySavedState(entry.state, controls);
        });

        item.appendChild(link);
        list.appendChild(item);
    });
```

becomes:

```js
        const link = document.createElement('button');
        link.type = 'button';
        link.className = 'saved-list__link';
        link.textContent = entry.timestamp;
        link.addEventListener('click', function () {
            applySavedState(entry.state, controls);
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'saved-list__delete';
        deleteButton.setAttribute('aria-label', `Delete saved state ${entry.timestamp}`);
        deleteButton.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>';
        deleteButton.addEventListener('click', function () {
            if (!confirm('Are you sure?')) return;
            const remaining = loadSavedStates();
            remaining.splice(index, 1);
            persistSavedStates(remaining);
            renderSavedList(controls);
        });

        item.appendChild(link);
        item.appendChild(deleteButton);
        list.appendChild(item);
    });
```

- [ ] **Step 4: Verify manually**

Reload the served page. Save two or three states. In the Saved tab, click a row's delete (trash) button, click "Cancel" on the confirm dialog — confirm the row is still there. Click delete again and confirm — the row disappears and the remaining rows keep their correct timestamps. Delete every row and confirm the "No saved states yet." message reappears.

- [ ] **Step 5: Commit**

```bash
git add ramps.js css/tokens.css css/input.css
git commit -m "feat: add delete with confirmation to Saved tab (#8)"
```

---

### Task 6: Copy Data

**Files:**
- Modify: `ramps.js` (adds `handleCopyData`)

**Interfaces:**
- Consumes: `collectSavedState()` from Task 4.
- Produces: nothing consumed elsewhere — this is the last task.

- [ ] **Step 1: Add `handleCopyData` to `ramps.js`**

Insert immediately before `window.onload`:

```js
function handleCopyData() {
    document.getElementById('copy-data').addEventListener('click', function () {
        const data = JSON.stringify(collectSavedState());
        navigator.clipboard.writeText(data).catch(() => {
            alert('Could not copy to clipboard.');
        });
    });
}

```

- [ ] **Step 2: Wire it up in `window.onload`**

```js
    handleSaveState(controls);
    renderSavedList(controls);
};
```

becomes:

```js
    handleSaveState(controls);
    renderSavedList(controls);
    handleCopyData();
};
```

- [ ] **Step 3: Verify manually**

Reload the served page (must be via `http://localhost:8000/...`, not `file://`, for `navigator.clipboard` to work). Set some distinctive slider values, click "Copy Data", then paste into a text editor or browser dev-tools console (`await navigator.clipboard.readText()`). Confirm it's valid JSON with exactly the keys from the schema in the spec (`colours, palette, type, spread, radius, shearX, shearY, rotation, scaleX, scaleY, centreX, centreY, focusX, focusY, focalRadius, startX, startY, endX, endY`) and that the values match what's currently on screen — including *unsaved* changes (it should not require clicking Save State first).

- [ ] **Step 4: Commit**

```bash
git add ramps.js
git commit -m "feat: add Copy Data button (#9)"
```

---

## After all six tasks

Do not push or open the PR automatically — check in first. Once given the go-ahead:

```bash
git push -u origin feature/ramps-save-load-ui
gh pr create --title "Save/load state + tabbed UI" --body "Closes #4, #5, #6, #7, #8, #9"
```
