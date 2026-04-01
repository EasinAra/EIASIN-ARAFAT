// Modular Windows 11 UI JavaScript

// UI Component Module
class UIComponent {
    constructor(element) {
        this.element = document.createElement(element);
    }
    render(parent) {
        parent.appendChild(this.element);
    }
}

// Button Component
class Button extends UIComponent {
    constructor(label) {
        super('button');
        this.element.innerHTML = label;
        this.element.className = 'button';
    }
}

// Main Application
class App {
    constructor() {
        this.init();
    }
    init() {
        const container = document.getElementById('app');
        const button = new Button('Click Me');
        button.render(container);
    }
}

window.onload = () => {
    new App();
};