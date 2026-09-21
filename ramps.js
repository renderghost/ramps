const FORM_STATE_KEY = 'ramps-form-state';
const FORM_DEFAULTS = {
    type: 'radial',
    spread: 'repeat',
    skewX: 0,
    skewY: 0,
    rotate: 0,
    scaleX: 100,
    scaleY: 100,
    cx: 50,
    cy: 50,
    r: 50,
    fx: 50,
    fy: 50,
    fr: 0,
    startX: 0,
    startY: 50,
    endX: 100,
    endY: 50,
};

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getTimestamp() {
    const pad = (n) => String(n).padStart(2, '0');
    const d = new Date();
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}-${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`;
}

function updateFillVar(rangeEl) {
    const min = Number(rangeEl.min);
    const max = Number(rangeEl.max);
    const percent = ((Number(rangeEl.value) - min) / (max - min)) * 100;
    rangeEl.style.setProperty('--fill', `${percent}%`);
    return percent;
}

function showTooltip(id, value, percent) {
    const tooltip = document.getElementById(`${id}-tooltip`);
    if (!tooltip) return;
    tooltip.textContent = value;
    tooltip.style.left = `${percent}%`;
    tooltip.classList.add('is-visible');
    clearTimeout(tooltip._hideTimer);
    tooltip._hideTimer = setTimeout(() => tooltip.classList.remove('is-visible'), 1000);
}

/**
 * Wires a range input to its paired number input, keeping both in sync,
 * updating the track fill and drag tooltip, and calling onChange with the
 * resolved numeric value whenever either control changes.
 */
function wireRangeControl(id, onChange) {
    const range = document.getElementById(id);
    const number = document.getElementById(`${id}-number`);
    const min = Number(range.min);
    const max = Number(range.max);

    function apply(value, { fromRange }) {
        const percent = updateFillVar(range);
        if (fromRange) {
            number.value = value;
        }
        showTooltip(id, value, percent);
        onChange(value);
    }

    range.addEventListener('input', function () {
        apply(Number(this.value), { fromRange: true });
    });

    number.addEventListener('input', function () {
        const parsed = Number(this.value);
        if (this.value === '' || Number.isNaN(parsed)) return;
        range.value = clamp(parsed, min, max);
        apply(Number(range.value), { fromRange: false });
    });

    number.addEventListener('change', function () {
        const parsed = clamp(Number(this.value) || 0, min, max);
        this.value = parsed;
        range.value = parsed;
        apply(parsed, { fromRange: false });
    });

    updateFillVar(range);

    return {
        set(value) {
            range.value = value;
            number.value = value;
            updateFillVar(range);
        },
    };
}

function updateGradientTransform() {
    const gradient = document.getElementById('radial-gradient');
    const skewX = document.getElementById('skewX').value;
    const skewY = document.getElementById('skewY').value;
    const rotate = document.getElementById('rotate').value;
    const scaleX = Number(document.getElementById('scaleX').value) / 100;
    const scaleY = Number(document.getElementById('scaleY').value) / 100;
    gradient.setAttribute('gradientTransform',
        `rotate(${rotate}) skewX(${skewX}) skewY(${skewY}) scale(${scaleX}, ${scaleY})`);
}

function updateGradientVisibility(type) {
    const circle = document.getElementById('circle');
    circle.setAttribute('fill', type === 'linear' ? 'url(#linear-gradient)' : 'url(#radial-gradient)');
    document.querySelectorAll('.group[data-type]').forEach((group) => {
        group.hidden = group.dataset.type !== type;
    });
}

function handleGradientType() {
    document.querySelectorAll('input[name="gradient-type"]').forEach((item) => {
        item.addEventListener('change', function () {
            updateGradientVisibility(this.value);
            saveFormState(collectFormState());
        });
    });
}

function loadFormState() {
    try {
        const saved = JSON.parse(localStorage.getItem(FORM_STATE_KEY));
        return { ...FORM_DEFAULTS, ...saved };
    } catch {
        return { ...FORM_DEFAULTS };
    }
}

function saveFormState(state) {
    localStorage.setItem(FORM_STATE_KEY, JSON.stringify(state));
}

const LOCKS_KEY = 'ramps-locks';
const LOCKABLE_IDS = ['stops', 'palette', 'type', 'spread', 'r', 'skewX', 'skewY', 'rotate', 'scaleX', 'scaleY', 'cx', 'cy', 'fx', 'fy', 'fr', 'startX', 'startY', 'endX', 'endY'];

function loadLocks() {
    const defaults = Object.fromEntries(LOCKABLE_IDS.map((id) => [id, false]));
    try {
        return { ...defaults, ...JSON.parse(localStorage.getItem(LOCKS_KEY)) };
    } catch {
        return defaults;
    }
}

function saveLocks(locks) {
    localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
}

function setControlDisabled(id, disabled) {
    if (id === 'palette') {
        document.querySelectorAll('#color-picker input[type="color"]').forEach((el) => { el.disabled = disabled; });
        return;
    }
    if (id === 'spread') {
        document.querySelectorAll('input[name="spread"]').forEach((el) => { el.disabled = disabled; });
        return;
    }
    if (id === 'type') {
        document.querySelectorAll('input[name="gradient-type"]').forEach((el) => { el.disabled = disabled; });
        return;
    }
    const range = document.getElementById(id);
    const number = document.getElementById(`${id}-number`);
    if (range) range.disabled = disabled;
    if (number) number.disabled = disabled;
}

function applyLockState(id, locked) {
    const button = document.getElementById(`lock-${id}`);
    if (button) button.setAttribute('aria-pressed', locked);
    setControlDisabled(id, locked);
}

function handleLocks() {
    const locks = loadLocks();
    LOCKABLE_IDS.forEach((id) => applyLockState(id, locks[id]));

    document.querySelectorAll('.lock-button').forEach((button) => {
        button.addEventListener('click', function () {
            const id = this.dataset.lock;
            const currentLocks = loadLocks();
            currentLocks[id] = !currentLocks[id];
            saveLocks(currentLocks);
            applyLockState(id, currentLocks[id]);
        });
    });
}

function updateBackgroundColor(color) {
    const backgroundCircle = document.getElementById('background-circle');
    if (backgroundCircle) {
        backgroundCircle.setAttribute('fill', color);
    }
}

const STOPS_KEY = 'ramps-stops';

function initialize() {
    const stops = Number(localStorage.getItem(STOPS_KEY)) || Number(document.getElementById("stops").value);
    document.getElementById("stops").value = stops;
    document.getElementById("stops-number").value = stops;

    for (let i = 0; i < stops; i++) {
        if (!localStorage.getItem(`color-${i}`)) {
            localStorage.setItem(`color-${i}`, getRandomColor());
        }
    }

    createSVGStops(stops);
    createColorPickers(stops);
    attachColorChangeHandlers(stops);

    const firstColor = localStorage.getItem('color-0');
    updateBackgroundColor(firstColor);
}

function createSVGStops(stops) {
    const gradient = document.getElementById("radial-gradient");
    while (gradient.firstChild) {
        gradient.firstChild.remove();
    }
    for (let i = 0; i < stops; i++) {
        const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop.setAttribute('offset', `${(i / (stops - 1)) * 100}%`);
        const color = localStorage.getItem(`color-${i}`);
        stop.setAttribute('stop-color', color);
        gradient.appendChild(stop);
    }
}

function createColorPickers(stops) {
    let stopElements = "";
    for (let i = 0; i < stops; i++) {
        let color = localStorage.getItem(`color-${i}`);
        if (!color) {
            color = getRandomColor();
            localStorage.setItem(`color-${i}`, color);
        }
        stopElements += `<input type="color" id="color-${i}" value="${color}">`;
    }
    const colorPickerContainer = document.getElementById("color-picker");
    colorPickerContainer.innerHTML = stopElements;
    setControlDisabled('palette', loadLocks().palette);

    const firstColor = localStorage.getItem('color-0');
    updateBackgroundColor(firstColor);
}

function attachColorChangeHandlers(stops) {
    for (let i = 0; i < stops; i++) {
        handleColorChange(i);
    }
}

function handleColorChange(index) {
    const element = document.getElementById(`color-${index}`);
    const stopElement = document.querySelector(`#radial-gradient stop:nth-child(${index + 1})`);
    element.addEventListener("input", function () {
        stopElement.setAttribute('stop-color', this.value);
        localStorage.setItem(`color-${index}`, this.value);
        if (index === 0) {
            updateBackgroundColor(this.value);
        }
    });
}

function handleStopsChange() {
    wireRangeControl('stops', function (stops) {
        localStorage.setItem(STOPS_KEY, stops);
        createSVGStops(stops);
        createColorPickers(stops);
        attachColorChangeHandlers(stops);
    });
}

function handleSpreadChange() {
    document.querySelectorAll("input[name=spread]").forEach((item) => {
        item.addEventListener("change", function () {
            document.getElementById("radial-gradient").setAttribute("spreadMethod", this.value);
            saveFormState(collectFormState());
        });
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function handleRandomise() {
    const randomiseButton = document.getElementById('randomise');
    randomiseButton.addEventListener('click', function () {
        if (loadLocks().palette) return;
        const stops = document.getElementById("stops").value;
        for (let i = 0; i < stops; i++) {
            const randomColor = getRandomColor();
            const colorElement = document.getElementById(`color-${i}`);
            colorElement.value = randomColor;
            const stopElement = document.querySelector(`#radial-gradient stop:nth-child(${i + 1})`);
            stopElement.setAttribute('stop-color', randomColor);
            localStorage.setItem(`color-${i}`, randomColor);
            if (i === 0) {
                updateBackgroundColor(randomColor);
            }
        }
    });
}

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

function collectFormState() {
    return {
        type: document.querySelector('input[name="gradient-type"]:checked').value,
        spread: document.querySelector('input[name="spread"]:checked').value,
        skewX: Number(document.getElementById('skewX').value),
        skewY: Number(document.getElementById('skewY').value),
        rotate: Number(document.getElementById('rotate').value),
        scaleX: Number(document.getElementById('scaleX').value),
        scaleY: Number(document.getElementById('scaleY').value),
        cx: Number(document.getElementById('cx').value),
        cy: Number(document.getElementById('cy').value),
        r: Number(document.getElementById('r').value),
        fx: Number(document.getElementById('fx').value),
        fy: Number(document.getElementById('fy').value),
        fr: Number(document.getElementById('fr').value),
        startX: Number(document.getElementById('startX').value),
        startY: Number(document.getElementById('startY').value),
        endX: Number(document.getElementById('endX').value),
        endY: Number(document.getElementById('endY').value),
    };
}

function applyFormState(state, controls) {
    controls.cx.set(state.cx);
    controls.cy.set(state.cy);
    controls.r.set(state.r);
    controls.fx.set(state.fx);
    controls.fy.set(state.fy);
    controls.fr.set(state.fr);
    controls.skewX.set(state.skewX);
    controls.skewY.set(state.skewY);
    controls.rotate.set(state.rotate);
    controls.scaleX.set(state.scaleX);
    controls.scaleY.set(state.scaleY);
    controls.startX.set(state.startX);
    controls.startY.set(state.startY);
    controls.endX.set(state.endX);
    controls.endY.set(state.endY);

    const gradient = document.getElementById('radial-gradient');
    gradient.setAttribute('cx', `${state.cx}%`);
    gradient.setAttribute('cy', `${state.cy}%`);
    gradient.setAttribute('r', `${state.r}%`);
    gradient.setAttribute('fx', `${state.fx}%`);
    gradient.setAttribute('fy', `${state.fy}%`);
    gradient.setAttribute('fr', `${state.fr}%`);
    gradient.setAttribute('spreadMethod', state.spread);
    updateGradientTransform();

    const linearGradient = document.getElementById('linear-gradient');
    linearGradient.setAttribute('x1', `${state.startX}%`);
    linearGradient.setAttribute('y1', `${state.startY}%`);
    linearGradient.setAttribute('x2', `${state.endX}%`);
    linearGradient.setAttribute('y2', `${state.endY}%`);

    const radio = document.querySelector(`input[name="spread"][value="${state.spread}"]`);
    if (radio) radio.checked = true;

    const typeRadio = document.querySelector(`input[name="gradient-type"][value="${state.type}"]`);
    if (typeRadio) typeRadio.checked = true;
    updateGradientVisibility(state.type);
}

function handleGradientControls() {
    const gradient = document.getElementById('radial-gradient');
    const linearGradient = document.getElementById('linear-gradient');

    const controls = {
        cx: wireRangeControl('cx', (value) => { gradient.setAttribute('cx', `${value}%`); saveFormState(collectFormState()); }),
        cy: wireRangeControl('cy', (value) => { gradient.setAttribute('cy', `${value}%`); saveFormState(collectFormState()); }),
        r: wireRangeControl('r', (value) => { gradient.setAttribute('r', `${value}%`); saveFormState(collectFormState()); }),
        fx: wireRangeControl('fx', (value) => { gradient.setAttribute('fx', `${value}%`); saveFormState(collectFormState()); }),
        fy: wireRangeControl('fy', (value) => { gradient.setAttribute('fy', `${value}%`); saveFormState(collectFormState()); }),
        fr: wireRangeControl('fr', (value) => { gradient.setAttribute('fr', `${value}%`); saveFormState(collectFormState()); }),
        skewX: wireRangeControl('skewX', () => { updateGradientTransform(); saveFormState(collectFormState()); }),
        skewY: wireRangeControl('skewY', () => { updateGradientTransform(); saveFormState(collectFormState()); }),
        rotate: wireRangeControl('rotate', () => { updateGradientTransform(); saveFormState(collectFormState()); }),
        scaleX: wireRangeControl('scaleX', () => { updateGradientTransform(); saveFormState(collectFormState()); }),
        scaleY: wireRangeControl('scaleY', () => { updateGradientTransform(); saveFormState(collectFormState()); }),
        startX: wireRangeControl('startX', (value) => { linearGradient.setAttribute('x1', `${value}%`); saveFormState(collectFormState()); }),
        startY: wireRangeControl('startY', (value) => { linearGradient.setAttribute('y1', `${value}%`); saveFormState(collectFormState()); }),
        endX: wireRangeControl('endX', (value) => { linearGradient.setAttribute('x2', `${value}%`); saveFormState(collectFormState()); }),
        endY: wireRangeControl('endY', (value) => { linearGradient.setAttribute('y2', `${value}%`); saveFormState(collectFormState()); }),
    };

    const savedState = loadFormState();
    applyFormState(savedState, controls);

    return controls;
}

function handleResetSliders(controls) {
    document.getElementById('reset-sliders').addEventListener('click', function () {
        const locks = loadLocks();
        const current = collectFormState();
        const nextState = Object.fromEntries(
            Object.keys(FORM_DEFAULTS).map((key) => [key, locks[key] ? current[key] : FORM_DEFAULTS[key]])
        );
        applyFormState(nextState, controls);
        saveFormState(nextState);
    });
}

function handleRandomiseSliders(controls) {
    document.getElementById('randomise-sliders').addEventListener('click', function () {
        const locks = loadLocks();
        const current = collectFormState();
        const spreadMethods = ['pad', 'reflect', 'repeat'];
        const randomState = {
            type: current.type,
            spread: locks.spread ? current.spread : spreadMethods[Math.floor(Math.random() * spreadMethods.length)],
            skewX: locks.skewX ? current.skewX : Math.floor(Math.random() * 181) - 90,
            skewY: locks.skewY ? current.skewY : Math.floor(Math.random() * 181) - 90,
            rotate: locks.rotate ? current.rotate : Math.floor(Math.random() * 361) - 180,
            scaleX: locks.scaleX ? current.scaleX : Math.floor(Math.random() * 291) + 10,
            scaleY: locks.scaleY ? current.scaleY : Math.floor(Math.random() * 291) + 10,
            cx: locks.cx ? current.cx : Math.floor(Math.random() * 101),
            cy: locks.cy ? current.cy : Math.floor(Math.random() * 101),
            r: locks.r ? current.r : Math.floor(Math.random() * 101),
            fx: locks.fx ? current.fx : Math.floor(Math.random() * 101),
            fy: locks.fy ? current.fy : Math.floor(Math.random() * 101),
            fr: locks.fr ? current.fr : Math.floor(Math.random() * 101),
            startX: locks.startX ? current.startX : Math.floor(Math.random() * 101),
            startY: locks.startY ? current.startY : Math.floor(Math.random() * 101),
            endX: locks.endX ? current.endX : Math.floor(Math.random() * 101),
            endY: locks.endY ? current.endY : Math.floor(Math.random() * 101),
        };

        applyFormState(randomState, controls);
        saveFormState(randomState);
    });
}

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
    localStorage.setItem(STOPS_KEY, saved.colours);
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
}

function handleSaveState(controls) {
    document.getElementById('save-state').addEventListener('click', function () {
        const states = loadSavedStates();
        states.unshift({ timestamp: getTimestamp(), state: collectSavedState() });
        persistSavedStates(states);
        renderSavedList(controls);
    });
}

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

window.onload = function () {
    initialize();
    handleRandomise();
    handleDownloadPNG();
    handleSpreadChange();
    handleGradientType();
    handleStopsChange();
    const controls = handleGradientControls();
    handleResetSliders(controls);
    handleRandomiseSliders(controls);
    handleLocks();
    handleTabs();
    handleSaveState(controls);
    renderSavedList(controls);
};
