function initialize() {
    const stops = document.getElementById("stops").value;
    createSVGStops(stops, true);
    createColorPickers(stops, true);
    attachColorChangeHandlers(stops);
}

function createSVGStops(stops, isInitialLoad) {
    const gradientTypes = ['linear', 'radial'];
    gradientTypes.forEach(gradientType => {
        const gradient = document.getElementById(`${gradientType}-gradient`);
        // Clear existing children
        while (gradient.firstChild) {
            gradient.firstChild.remove();
        }
        // Create stops
        for (let i = 0; i < stops; i++) {
            const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop.setAttribute('offset', `${(i / (stops - 1)) * 100}%`);
            const color = localStorage.getItem(`color-${i}`) || '#000000';
            stop.setAttribute('stop-color', color);
            gradient.appendChild(stop);
        }
    });
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

function handleSliderChange(id, attribute) {
    const element = document.getElementById(id);
    element.addEventListener("input", function () {
        const gradientType = document.querySelector('input[name="gradient-type"]:checked').value;
        document.getElementById(`${gradientType}-gradient`).setAttribute(attribute, `${this.value}%`);
    });
}

function handleColorChange(index) {
    const element = document.getElementById(`color-${index}`);
    element.addEventListener("input", function () {
        const gradientType = document.querySelector('input[name="gradient-type"]:checked').value;
        document.querySelector(`#${gradientType}-gradient stop:nth-child(${index + 1})`).setAttribute('stop-color', this.value);
        localStorage.setItem(`color-${index}`, this.value); // store the color in local storage
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
            document.getElementById("linear-gradient").setAttribute("spreadMethod", this.value);
        });
    });
}

function handleGradientTypeChange() {
    document.querySelectorAll("input[name=gradient-type]").forEach((item) => {
        item.addEventListener("change", function () {
            document.getElementById("circle").style.fill = this.value === 'radial' ? "url(#radial-gradient)" : "none";
            document.getElementById("rectangle").style.fill = this.value === 'linear' ? "url(#linear-gradient)" : "none";
            document.getElementById("direction").disabled = this.value === 'radial';
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
    const randomiseElement = document.getElementById("randomise");
    randomiseElement.addEventListener("click", function () {
        const stops = document.getElementById("stops").value;
        for (let i = 0; i < stops; i++) {
            const randomColor = getRandomColor();
            // Update color picker
            document.getElementById(`color-${i}`).value = randomColor;
            // Update gradient stop
            const gradientType = document.querySelector('input[name="gradient-type"]:checked').value;
            document.querySelector(`#${gradientType}-gradient stop:nth-child(${i + 1})`).setAttribute('stop-color', randomColor);
            // Save color to local storage
            localStorage.setItem(`color-${i}`, randomColor);
        }
    });
}

handleSliderChange("cx", "cx");
handleSliderChange("cy", "cy");
handleSliderChange("r", "r");
handleSliderChange("fx", "fx");
handleSliderChange("fy", "fy");
handleStopsChange();
handleSpreadChange();
handleGradientTypeChange();
handleRandomise();

window.onload = initialize;