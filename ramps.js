// Functions to handle changes

function handleChange(id, attribute, target = 'radial-gradient') {
    const element = document.getElementById(id);
    element.addEventListener("input", function () {
        document.getElementById(target).setAttribute(attribute, `${this.value}%`);
    });
}

function handleColorChange(index) {
    const element = document.getElementById(`color-${index}`);
    element.addEventListener("input", function () {
        document.querySelector(`#radial-gradient stop:nth-child(${index + 1})`).style.stopColor = this.value;
        document.querySelector(`#linear-gradient stop:nth-child(${index + 1})`).style.stopColor = this.value;
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

// Function to generate random color

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

handleChange("cx", "cx");
handleChange("cy", "cy");
handleChange("r", "r");
handleChange("fx", "fx");
handleChange("fy", "fy");
handleSpreadChange();
handleGradientTypeChange();

// Handle stop change

const stopElement = document.getElementById("stops");
const colorPickerElement = document.getElementById("color-picker");

stopElement.addEventListener("input", function () {
    const stops = this.value;
    let stopElements = "";

    for (let i = 0; i < stops; i++) {
        const stopColor = getRandomColor();
        stopElements += `<input type="color" id="color-${i}" value="${stopColor}">`;
        document.querySelector(`#radial-gradient stop:nth-child(${i + 1})`).style.stopColor = stopColor;
        document.querySelector(`#linear-gradient stop:nth-child(${i + 1})`).style.stopColor = stopColor;
    }

    colorPickerElement.innerHTML = stopElements;

    for (let i = 0; i < stops; i++) {
        handleColorChange(i);
    }
});

// Handle direction change

const directionElement = document.getElementById("direction");

directionElement.addEventListener("input", function () {
    const angle = this.value;
    document.getElementById("linear-gradient").setAttribute("x2", `${Math.cos(angle * Math.PI / 180) * 100}%`);
    document.getElementById("linear-gradient").setAttribute("y2", `${Math.sin(angle * Math.PI / 180) * 100}%`);
});

// Handle randomise button click

const randomiseElement = document.getElementById("randomise");

randomiseElement.addEventListener("click", function () {
    const stops = document.getElementById("stops").value;

    for (let i = 0; i < stops; i++) {
        const randomColor = getRandomColor();
        document.getElementById(`color-${i}`).value = randomColor;
        document.querySelector(`#radial-gradient stop:nth-child(${i + 1})`).style.stopColor = randomColor;
        document.querySelector(`#linear-gradient stop:nth-child(${i + 1})`).style.stopColor = randomColor;
    }
});