const FORM_STATE_KEY = 'ramps-form-state';
const FORM_DEFAULTS = {
    spread: 'repeat',
    skewX: 0,
    skewY: 0,
    cx: 50,
    cy: 50,
    r: 50,
    fx: 50,
    fy: 50,
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

function setGradientSkew(x, y) {
    const gradient = document.getElementById('radial-gradient');
    gradient.setAttribute('gradientTransform', `skewX(${x}) skewY(${y})`);
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

function updateBackgroundColor(color) {
    const backgroundCircle = document.getElementById('background-circle');
    if (backgroundCircle) {
        backgroundCircle.setAttribute('fill', color);
    }
}

function initialize() {
    const stops = document.getElementById("stops").value;

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

function handleDownloadPNG() {
    const downloadPNGButton = document.getElementById('download-png');
    downloadPNGButton.addEventListener('click', function () {
        const svg = document.getElementById('gradient-svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        canvas.width = 2000;
        canvas.height = 2000;

        img.onload = function () {
            ctx.drawImage(img, 0, 0, 2000, 2000);
            canvas.toBlob(function (blob) {
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = `ramp-${getTimestamp()}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            });
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
}

function collectFormState() {
    return {
        spread: document.querySelector('input[name="spread"]:checked').value,
        skewX: Number(document.getElementById('skewX').value),
        skewY: Number(document.getElementById('skewY').value),
        cx: Number(document.getElementById('cx').value),
        cy: Number(document.getElementById('cy').value),
        r: Number(document.getElementById('r').value),
        fx: Number(document.getElementById('fx').value),
        fy: Number(document.getElementById('fy').value),
    };
}

function applyFormState(state, controls) {
    controls.cx.set(state.cx);
    controls.cy.set(state.cy);
    controls.r.set(state.r);
    controls.fx.set(state.fx);
    controls.fy.set(state.fy);
    controls.skewX.set(state.skewX);
    controls.skewY.set(state.skewY);

    const gradient = document.getElementById('radial-gradient');
    gradient.setAttribute('cx', `${state.cx}%`);
    gradient.setAttribute('cy', `${state.cy}%`);
    gradient.setAttribute('r', `${state.r}%`);
    gradient.setAttribute('fx', `${state.fx}%`);
    gradient.setAttribute('fy', `${state.fy}%`);
    gradient.setAttribute('spreadMethod', state.spread);
    setGradientSkew(state.skewX, state.skewY);

    const radio = document.querySelector(`input[name="spread"][value="${state.spread}"]`);
    if (radio) radio.checked = true;
}

function handleGradientControls() {
    const gradient = document.getElementById('radial-gradient');

    const controls = {
        cx: wireRangeControl('cx', (value) => { gradient.setAttribute('cx', `${value}%`); saveFormState(collectFormState()); }),
        cy: wireRangeControl('cy', (value) => { gradient.setAttribute('cy', `${value}%`); saveFormState(collectFormState()); }),
        r: wireRangeControl('r', (value) => { gradient.setAttribute('r', `${value}%`); saveFormState(collectFormState()); }),
        fx: wireRangeControl('fx', (value) => { gradient.setAttribute('fx', `${value}%`); saveFormState(collectFormState()); }),
        fy: wireRangeControl('fy', (value) => { gradient.setAttribute('fy', `${value}%`); saveFormState(collectFormState()); }),
        skewX: wireRangeControl('skewX', () => {
            setGradientSkew(document.getElementById('skewX').value, document.getElementById('skewY').value);
            saveFormState(collectFormState());
        }),
        skewY: wireRangeControl('skewY', () => {
            setGradientSkew(document.getElementById('skewX').value, document.getElementById('skewY').value);
            saveFormState(collectFormState());
        }),
    };

    const savedState = loadFormState();
    applyFormState(savedState, controls);

    return controls;
}

function handleResetSliders(controls) {
    document.getElementById('reset-sliders').addEventListener('click', function () {
        applyFormState(FORM_DEFAULTS, controls);
        saveFormState(FORM_DEFAULTS);
    });
}

function handleRandomiseSliders(controls) {
    document.getElementById('randomise-sliders').addEventListener('click', function () {
        const spreadMethods = ['pad', 'reflect', 'repeat'];
        const randomState = {
            spread: spreadMethods[Math.floor(Math.random() * spreadMethods.length)],
            skewX: Math.floor(Math.random() * 181) - 90,
            skewY: Math.floor(Math.random() * 181) - 90,
            cx: Math.floor(Math.random() * 101),
            cy: Math.floor(Math.random() * 101),
            r: Math.floor(Math.random() * 101),
            fx: Math.floor(Math.random() * 101),
            fy: Math.floor(Math.random() * 101),
        };

        applyFormState(randomState, controls);
        saveFormState(randomState);
    });
}

window.onload = function () {
    initialize();
    handleRandomise();
    handleDownloadSVG();
    handleDownloadPNG();
    handleSpreadChange();
    handleStopsChange();
    const controls = handleGradientControls();
    handleResetSliders(controls);
    handleRandomiseSliders(controls);
};
