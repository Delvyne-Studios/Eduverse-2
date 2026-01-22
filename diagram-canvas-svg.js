// =================================================================
// SVG DIAGRAM SYSTEM - LLM-Friendly Diagram Rendering
// Uses HTML + SVG for better LLM spatial reasoning
// ViewBox: 100x100 (percentage-like coordinates)
// =================================================================

class DiagramCanvas {
    constructor(containerId, width = 320, height = 220) {
        this.containerId = containerId;
        this.width = width;
        this.height = height;
        this.viewBox = { width: 100, height: 70 }; // LLM thinks in 0-100 range
        this.container = null;
        this.svg = null;
        this.steps = [];
        this.currentStep = 0;
        this.wrapper = null;
    }

    // =================================================================
    // INITIALIZATION
    // =================================================================
    create(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'diagram-wrapper';
        wrapper.innerHTML = `
            <div class="diagram-container">
                <svg 
                    id="${this.containerId}" 
                    viewBox="0 0 ${this.viewBox.width} ${this.viewBox.height}"
                    width="${this.width}" 
                    height="${this.height}"
                    xmlns="http://www.w3.org/2000/svg"
                    class="diagram-svg"
                >
                    <defs>
                        <!-- Arrow marker -->
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor"/>
                        </marker>
                        <marker id="arrowhead-reverse" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto">
                            <polygon points="10 0, 0 3.5, 10 7" fill="currentColor"/>
                        </marker>
                        <!-- Grid pattern -->
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.3"/>
                        </pattern>
                    </defs>
                    <!-- Background - uses theme color -->
                    <rect width="100%" height="100%" class="svg-bg"/>
                    <!-- Grid -->
                    <rect width="100%" height="100%" fill="url(#grid)"/>
                    <!-- Content groups will be inserted here -->
                    <g class="diagram-content"></g>
                </svg>
            </div>
            <div class="diagram-controls" style="display: none;">
                <div class="step-info">
                    <span class="step-label">Step <span class="current-step">1</span> of <span class="total-steps">1</span></span>
                    <span class="step-description"></span>
                </div>
                <div class="step-navigation">
                    <button class="step-btn prev-btn" disabled>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="step-dots"></div>
                    <button class="step-btn next-btn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(wrapper);
        
        this.wrapper = wrapper;
        this.container = wrapper.querySelector('.diagram-container');
        this.svg = wrapper.querySelector('.diagram-svg');
        this.contentGroup = this.svg.querySelector('.diagram-content');
        
        this.setupNavigation();
        
        return this;
    }

    // =================================================================
    // SVG CONTENT RENDERING
    // =================================================================
    
    renderSVG(svgContent, description = '') {
        // Clear existing content
        this.contentGroup.innerHTML = '';
        this.steps = [];
        this.currentStep = 0;
        
        // Parse and inject SVG content
        const cleanedSVG = this.sanitizeSVG(svgContent);
        this.contentGroup.innerHTML = cleanedSVG;
        
        // Find all step groups
        const stepGroups = this.contentGroup.querySelectorAll('[data-step]');
        
        if (stepGroups.length > 0) {
            // Multi-step diagram
            stepGroups.forEach((group, index) => {
                const stepNum = parseInt(group.dataset.step) || (index + 1);
                const stepDesc = group.dataset.description || `Step ${stepNum}`;
                this.steps.push({
                    number: stepNum,
                    description: stepDesc,
                    element: group
                });
                // Hide all steps initially
                group.style.opacity = '0';
            });
            
            // Sort steps by number
            this.steps.sort((a, b) => a.number - b.number);
            
            // Show controls and first step
            this.showControls(true);
            this.updateStepDisplay();
            this.goToStep(0);
        } else {
            // Single diagram, no steps
            this.steps = [{ number: 1, description: description, element: this.contentGroup }];
            this.showControls(false);
        }
        
        return this;
    }
    
    sanitizeSVG(svgContent) {
        // Remove any outer <svg> tags if present (we already have one)
        let cleaned = svgContent
            .replace(/<\?xml[^>]*\?>/gi, '')
            .replace(/<svg[^>]*>/gi, '')
            .replace(/<\/svg>/gi, '')
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .trim();
        
        // Ensure all groups have proper structure
        return cleaned;
    }

    // =================================================================
    // STEP-BY-STEP NAVIGATION
    // =================================================================
    
    setupNavigation() {
        const prevBtn = this.wrapper.querySelector('.prev-btn');
        const nextBtn = this.wrapper.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStep());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
    }
    
    showControls(show) {
        const controls = this.wrapper.querySelector('.diagram-controls');
        if (controls) {
            controls.style.display = show ? 'flex' : 'none';
        }
    }
    
    updateStepDisplay() {
        const currentLabel = this.wrapper.querySelector('.current-step');
        const totalLabel = this.wrapper.querySelector('.total-steps');
        const descLabel = this.wrapper.querySelector('.step-description');
        const dotsContainer = this.wrapper.querySelector('.step-dots');
        
        if (currentLabel) currentLabel.textContent = this.currentStep + 1;
        if (totalLabel) totalLabel.textContent = this.steps.length;
        if (descLabel && this.steps[this.currentStep]) {
            descLabel.textContent = this.steps[this.currentStep].description;
        }
        
        // Update dots
        if (dotsContainer) {
            dotsContainer.innerHTML = this.steps.map((_, i) => 
                `<span class="step-dot ${i === this.currentStep ? 'active' : ''}" data-step="${i}"></span>`
            ).join('');
            
            // Add click handlers to dots
            dotsContainer.querySelectorAll('.step-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    this.goToStep(parseInt(dot.dataset.step));
                });
            });
        }
        
        // Update button states
        const prevBtn = this.wrapper.querySelector('.prev-btn');
        const nextBtn = this.wrapper.querySelector('.next-btn');
        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) nextBtn.disabled = this.currentStep === this.steps.length - 1;
    }
    
    goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        this.currentStep = stepIndex;
        
        // Show all steps up to and including current
        this.steps.forEach((step, i) => {
            if (step.element) {
                step.element.style.opacity = i <= stepIndex ? '1' : '0';
                step.element.style.transition = 'opacity 0.3s ease';
            }
        });
        
        this.updateStepDisplay();
    }
    
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.goToStep(this.currentStep + 1);
        }
    }
    
    previousStep() {
        if (this.currentStep > 0) {
            this.goToStep(this.currentStep - 1);
        }
    }
    
    // =================================================================
    // UTILITY METHODS
    // =================================================================
    
    clear() {
        if (this.contentGroup) {
            this.contentGroup.innerHTML = '';
        }
        this.steps = [];
        this.currentStep = 0;
        this.showControls(false);
    }
    
    exportPNG() {
        return new Promise((resolve) => {
            const svgData = new XMLSerializer().serializeToString(this.svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = this.width * 2; // 2x for retina
                canvas.height = this.height * 2;
                const ctx = canvas.getContext('2d');
                ctx.scale(2, 2);
                ctx.drawImage(img, 0, 0, this.width, this.height);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = url;
        });
    }
    
    download(filename = 'diagram.png') {
        this.exportPNG().then(dataUrl => {
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();
        });
    }
}

// =================================================================
// SVG GRAPH SYSTEM - Mathematical Graphing with SVG
// =================================================================

class GraphCanvas {
    constructor(containerId, width = 320, height = 240) {
        this.containerId = containerId;
        this.width = width;
        this.height = height;
        this.viewBox = { width: 100, height: 75 };
        this.container = null;
        this.svg = null;
        this.steps = [];
        this.currentStep = 0;
        this.wrapper = null;
        
        // Graph config (in viewBox units)
        this.config = {
            origin: { x: 50, y: 37.5 }, // Center of viewBox
            scale: { x: 5, y: 5 }, // units per 10 viewBox units
            xRange: [-10, 10],
            yRange: [-7.5, 7.5]
        };
    }

    create(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'graph-wrapper';
        wrapper.innerHTML = `
            <div class="graph-container">
                <svg 
                    id="${this.containerId}" 
                    viewBox="0 0 ${this.viewBox.width} ${this.viewBox.height}"
                    width="${this.width}" 
                    height="${this.height}"
                    xmlns="http://www.w3.org/2000/svg"
                    class="graph-svg"
                >
                    <defs>
                        <marker id="graph-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="#ffffff"/>
                        </marker>
                        <pattern id="graph-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.2"/>
                        </pattern>
                        <pattern id="graph-grid-minor" width="2" height="2" patternUnits="userSpaceOnUse">
                            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.1"/>
                        </pattern>
                        <!-- Shading patterns -->
                        <pattern id="diagonal-lines" patternUnits="userSpaceOnUse" width="4" height="4">
                            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
                        </pattern>
                    </defs>
                    <!-- Background - uses theme color -->
                    <rect width="100%" height="100%" class="svg-bg"/>
                    <!-- Minor grid -->
                    <rect width="100%" height="100%" fill="url(#graph-grid-minor)"/>
                    <!-- Major grid -->
                    <rect width="100%" height="100%" fill="url(#graph-grid)"/>
                    <!-- Axes will be drawn here -->
                    <g class="graph-axes"></g>
                    <!-- Content -->
                    <g class="graph-content"></g>
                </svg>
            </div>
            <div class="graph-controls" style="display: none;">
                <div class="step-info">
                    <span class="step-label">Step <span class="current-step">1</span> of <span class="total-steps">1</span></span>
                    <span class="step-description"></span>
                </div>
                <div class="step-navigation">
                    <button class="step-btn prev-btn" disabled>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="step-dots"></div>
                    <button class="step-btn next-btn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(wrapper);
        
        this.wrapper = wrapper;
        this.container = wrapper.querySelector('.graph-container');
        this.svg = wrapper.querySelector('.graph-svg');
        this.axesGroup = this.svg.querySelector('.graph-axes');
        this.contentGroup = this.svg.querySelector('.graph-content');
        
        this.setupNavigation();
        this.drawAxes();
        
        return this;
    }
    
    drawAxes() {
        const { origin } = this.config;
        const { width, height } = this.viewBox;
        
        this.axesGroup.innerHTML = `
            <!-- X-axis -->
            <line x1="0" y1="${origin.y}" x2="${width}" y2="${origin.y}" 
                  stroke="#ffffff" stroke-width="0.4" marker-end="url(#graph-arrow)"/>
            <!-- Y-axis -->
            <line x1="${origin.x}" y1="${height}" x2="${origin.x}" y2="0" 
                  stroke="#ffffff" stroke-width="0.4" marker-end="url(#graph-arrow)"/>
            <!-- Origin label -->
            <text x="${origin.x - 2}" y="${origin.y + 3}" fill="#ffffff" font-size="3" font-family="Inter, Arial">O</text>
            <!-- X label -->
            <text x="${width - 3}" y="${origin.y + 4}" fill="#ffffff" font-size="3" font-family="Inter, Arial">x</text>
            <!-- Y label -->
            <text x="${origin.x + 2}" y="4" fill="#ffffff" font-size="3" font-family="Inter, Arial">y</text>
            
            <!-- Axis tick marks and labels -->
            ${this.generateAxisLabels()}
        `;
    }
    
    generateAxisLabels() {
        const { origin, scale } = this.config;
        const { width, height } = this.viewBox;
        let labels = '';
        
        // X-axis labels
        for (let i = -4; i <= 4; i++) {
            if (i === 0) continue;
            const x = origin.x + (i * 10);
            const val = i * scale.x / 5;
            labels += `
                <line x1="${x}" y1="${origin.y - 0.8}" x2="${x}" y2="${origin.y + 0.8}" stroke="#ffffff" stroke-width="0.3"/>
                <text x="${x}" y="${origin.y + 4}" fill="rgba(255,255,255,0.7)" font-size="2.5" text-anchor="middle" font-family="Inter, Arial">${val}</text>
            `;
        }
        
        // Y-axis labels
        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            const y = origin.y - (i * 10);
            const val = i * scale.y / 5;
            labels += `
                <line x1="${origin.x - 0.8}" y1="${y}" x2="${origin.x + 0.8}" y2="${y}" stroke="#ffffff" stroke-width="0.3"/>
                <text x="${origin.x - 3}" y="${y + 1}" fill="rgba(255,255,255,0.7)" font-size="2.5" text-anchor="end" font-family="Inter, Arial">${val}</text>
            `;
        }
        
        return labels;
    }
    
    renderSVG(svgContent, description = '') {
        this.contentGroup.innerHTML = '';
        this.steps = [];
        this.currentStep = 0;
        
        const cleanedSVG = this.sanitizeSVG(svgContent);
        this.contentGroup.innerHTML = cleanedSVG;
        
        const stepGroups = this.contentGroup.querySelectorAll('[data-step]');
        
        if (stepGroups.length > 0) {
            stepGroups.forEach((group, index) => {
                const stepNum = parseInt(group.dataset.step) || (index + 1);
                const stepDesc = group.dataset.description || `Step ${stepNum}`;
                this.steps.push({
                    number: stepNum,
                    description: stepDesc,
                    element: group
                });
                group.style.opacity = '0';
            });
            
            this.steps.sort((a, b) => a.number - b.number);
            this.showControls(true);
            this.updateStepDisplay();
            this.goToStep(0);
        } else {
            this.steps = [{ number: 1, description: description, element: this.contentGroup }];
            this.showControls(false);
        }
        
        return this;
    }
    
    sanitizeSVG(svgContent) {
        return svgContent
            .replace(/<\?xml[^>]*\?>/gi, '')
            .replace(/<svg[^>]*>/gi, '')
            .replace(/<\/svg>/gi, '')
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .trim();
    }
    
    // Same navigation methods as DiagramCanvas
    setupNavigation() {
        const prevBtn = this.wrapper.querySelector('.prev-btn');
        const nextBtn = this.wrapper.querySelector('.next-btn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousStep());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
    }
    
    showControls(show) {
        const controls = this.wrapper.querySelector('.graph-controls');
        if (controls) controls.style.display = show ? 'flex' : 'none';
    }
    
    updateStepDisplay() {
        const currentLabel = this.wrapper.querySelector('.current-step');
        const totalLabel = this.wrapper.querySelector('.total-steps');
        const descLabel = this.wrapper.querySelector('.step-description');
        const dotsContainer = this.wrapper.querySelector('.step-dots');
        
        if (currentLabel) currentLabel.textContent = this.currentStep + 1;
        if (totalLabel) totalLabel.textContent = this.steps.length;
        if (descLabel && this.steps[this.currentStep]) {
            descLabel.textContent = this.steps[this.currentStep].description;
        }
        
        if (dotsContainer) {
            dotsContainer.innerHTML = this.steps.map((_, i) => 
                `<span class="step-dot ${i === this.currentStep ? 'active' : ''}" data-step="${i}"></span>`
            ).join('');
            
            dotsContainer.querySelectorAll('.step-dot').forEach(dot => {
                dot.addEventListener('click', () => this.goToStep(parseInt(dot.dataset.step)));
            });
        }
        
        const prevBtn = this.wrapper.querySelector('.prev-btn');
        const nextBtn = this.wrapper.querySelector('.next-btn');
        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) nextBtn.disabled = this.currentStep === this.steps.length - 1;
    }
    
    goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        this.currentStep = stepIndex;
        this.steps.forEach((step, i) => {
            if (step.element) {
                step.element.style.opacity = i <= stepIndex ? '1' : '0';
                step.element.style.transition = 'opacity 0.3s ease';
            }
        });
        this.updateStepDisplay();
    }
    
    nextStep() {
        if (this.currentStep < this.steps.length - 1) this.goToStep(this.currentStep + 1);
    }
    
    previousStep() {
        if (this.currentStep > 0) this.goToStep(this.currentStep - 1);
    }
    
    clear() {
        if (this.contentGroup) this.contentGroup.innerHTML = '';
        this.steps = [];
        this.currentStep = 0;
        this.showControls(false);
    }
    
    exportPNG() {
        return new Promise((resolve) => {
            const svgData = new XMLSerializer().serializeToString(this.svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = this.width * 2;
                canvas.height = this.height * 2;
                const ctx = canvas.getContext('2d');
                ctx.scale(2, 2);
                ctx.drawImage(img, 0, 0, this.width, this.height);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = url;
        });
    }
    
    download(filename = 'graph.png') {
        this.exportPNG().then(dataUrl => {
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();
        });
    }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
    window.DiagramCanvas = DiagramCanvas;
    window.GraphCanvas = GraphCanvas;
    console.log('✅ DiagramCanvas and GraphCanvas attached to window');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiagramCanvas, GraphCanvas };
}
