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
    });
}

function handleStopsChange() {
    const stopElement = document.getElementById("stops");
    stopElement.addEventListener("input", function () {
        const stops = this.value;
        let stopElements = "";
        for (let i = 0; i < stops; i++) {
            stopElements += `<input type="color" id="color-${i}" value="#000000">`;
        }
        document.getElementById("color-picker").innerHTML = stopElements;

        const gradientTypes = ['linear', 'radial'];
        gradientTypes.forEach(gradientType => {
            const gradient = document.getElementById(`${gradientType}-gradient`);
            while (gradient.firstChild) {
                gradient.firstChild.remove();
            }
            for (let i = 0; i < stops; i++) {
                const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop.setAttribute('offset', `${(i / (stops - 1)) * 100}%`);
                stop.setAttribute('stop-color', '#000000');
                gradient.appendChild(stop);
            }
        });

        for (let i = 0; i < stops; i++) {
            handleColorChange(i);
        }
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
            document.getElementById(`color-${i}`).value = randomColor;
            const gradientType = document.querySelector('input[name="gradient-type"]:checked').value;
            document.querySelector(`#${gradientType}-gradient stop:nth-child(${i + 1})`).setAttribute('stop-color', randomColor);
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