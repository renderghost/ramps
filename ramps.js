function initialize() {
    const stops = document.getElementById("stops").value;
    createSVGStops(stops, true);
    createColorPickers(stops, true);
    attachColorChangeHandlers(stops);

    ['cx', 'cy', 'r', 'fx', 'fy'].forEach(id => {
        const slider = document.getElementById(id);
        const valueElement = document.getElementById(`${id}-value`);
        valueElement.textContent = slider.value;
    });
}

function createSVGStops(stops, isInitialLoad) {
    const gradient = document.getElementById("radial-gradient");
    while (gradient.firstChild) {
        gradient.firstChild.remove();
    }
    for (let i = 0; i < stops; i++) {
        const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop.setAttribute('offset', `${(i / (stops - 1)) * 100}%`);
        const color = localStorage.getItem(`color-${i}`) || '#000000';
        stop.setAttribute('stop-color', color);
        gradient.appendChild(stop);
    }
}

function createColorPickers(stops, isInitialLoad) {
    let stopElements = "";
    for (let i = 0; i < stops; i++) {
        let color;
        if (isInitialLoad) {
            color = getRandomColor();
            localStorage.setItem(`color-${i}`, color);
        } else {
            color = localStorage.getItem(`color-${i}`) || '#000000';
        }
        stopElements += `<input type="color" id="color-${i}" value="${color}">`;
    }
    const colorPickerContainer = document.getElementById("color-picker");
    colorPickerContainer.innerHTML = stopElements;
}

function attachColorChangeHandlers(stops) {
    for (let i = 0; i < stops; i++) {
        handleColorChange(i);
    }
}

function handleAttributeSliderChange(id, attribute) {
    const element = document.getElementById(id);
    const valueElement = document.getElementById(`${id}-value`);
    element.addEventListener("input", function () {
        document.getElementById("radial-gradient").setAttribute(attribute, `${this.value}%`);
        valueElement.textContent = this.value;
    });
}

function handleColorChange(index) {
    const element = document.getElementById(`color-${index}`);
    const stopElement = document.querySelector(`#radial-gradient stop:nth-child(${index + 1})`);
    element.addEventListener("input", function () {
        stopElement.setAttribute('stop-color', this.value);
        localStorage.setItem(`color-${index}`, this.value);
    });
}

function handleStopsChange() {
    const stopElement = document.getElementById("stops");
    stopElement.addEventListener("input", function () {
        const stops = this.value;
        createSVGStops(stops, false);
        createColorPickers(stops, false);
        attachColorChangeHandlers(stops);
    });
}

function handleSpreadChange() {
    document.querySelectorAll("input[name=spread]").forEach((item) => {
        item.addEventListener("change", function () {
            document.getElementById("radial-gradient").setAttribute("spreadMethod", this.value);
        });
    });

    // set initial value based on checked radio button
    const initialValue = document.querySelector('input[name="spread"]:checked').value;
    document.getElementById("radial-gradient").setAttribute("spreadMethod", initialValue);
}


function getRandomColor() {
    return '#' + Math.random().toString(16).slice(2, 8).toUpperCase();
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
        }
    });
}

function handleGradientSkewChange() {
    const skewX = document.getElementById('skewX');
    const skewY = document.getElementById('skewY');
    const skewXValue = document.getElementById('skewX-value');
    const skewYValue = document.getElementById('skewY-value');
    skewXValue.textContent = skewX.value;
    skewYValue.textContent = skewY.value;

    skewX.addEventListener('input', function () {
        skewXValue.textContent = this.value;
        setGradientSkew(this.value, skewY.value);
    });

    skewY.addEventListener('input', function () {
        skewYValue.textContent = this.value;
        setGradientSkew(skewX.value, this.value);
    });
}

function setGradientSkew(x, y) {
    const gradient = document.getElementById('radial-gradient');
    gradient.setAttribute('gradientTransform', `skewX(${x}) skewY(${y})`);
}


window.onload = function () {
    initialize();
    handleRandomise();
    handleAttributeSliderChange("cx", "cx");
    handleAttributeSliderChange("cy", "cy");
    handleAttributeSliderChange("fx", "fx");
    handleAttributeSliderChange("fy", "fy");
    handleAttributeSliderChange("r", "r");
    handleSpreadChange();
    handleStopsChange();
    handleGradientSkewChange();
};


