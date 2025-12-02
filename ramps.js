function updateBackgroundColor(color) {
    document.body.style.background = color;
}

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

    // Set background to first color
    const firstColor = localStorage.getItem('color-0') || '#000000';
    updateBackgroundColor(firstColor);
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

    // Update background to first color
    const firstColor = localStorage.getItem('color-0') || '#000000';
    updateBackgroundColor(firstColor);
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
        // Update background if it's the first color
        if (index === 0) {
            updateBackgroundColor(this.value);
        }
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
            // Update background if it's the first color
            if (i === 0) {
                updateBackgroundColor(randomColor);
            }
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

function handleDownloadSVG() {
    const downloadSVGButton = document.getElementById('download-svg');
    downloadSVGButton.addEventListener('click', function () {
        const svg = document.getElementById('gradient-svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'gradient.svg';
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
                downloadLink.download = 'gradient.png';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            });
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
}

function handleRandomiseSliders() {
    const randomiseSlidersButton = document.getElementById('randomise-sliders');
    randomiseSlidersButton.addEventListener('click', function () {
        // Randomise stops
        const stopsSlider = document.getElementById('stops');
        stopsSlider.value = Math.floor(Math.random() * 6) + 2;
        stopsSlider.dispatchEvent(new Event('input'));

        // Randomise skew
        const skewXSlider = document.getElementById('skewX');
        const skewYSlider = document.getElementById('skewY');
        skewXSlider.value = Math.floor(Math.random() * 181) - 90;
        skewYSlider.value = Math.floor(Math.random() * 181) - 90;
        skewXSlider.dispatchEvent(new Event('input'));
        skewYSlider.dispatchEvent(new Event('input'));

        // Randomise gradient parameters
        ['cx', 'cy', 'r', 'fx', 'fy'].forEach(id => {
            const slider = document.getElementById(id);
            slider.value = Math.floor(Math.random() * 101);
            slider.dispatchEvent(new Event('input'));
        });

        // Randomise spread method
        const spreadMethods = ['pad', 'reflect', 'repeat'];
        const randomSpread = spreadMethods[Math.floor(Math.random() * spreadMethods.length)];
        document.querySelector(`input[name="spread"][value="${randomSpread}"]`).checked = true;
        document.getElementById('radial-gradient').setAttribute('spreadMethod', randomSpread);
    });
}


window.onload = function () {
    initialize();
    handleRandomise();
    handleRandomiseSliders();
    handleDownloadSVG();
    handleDownloadPNG();
    handleAttributeSliderChange("cx", "cx");
    handleAttributeSliderChange("cy", "cy");
    handleAttributeSliderChange("fx", "fx");
    handleAttributeSliderChange("fy", "fy");
    handleAttributeSliderChange("r", "r");
    handleSpreadChange();
    handleStopsChange();
    handleGradientSkewChange();
};


