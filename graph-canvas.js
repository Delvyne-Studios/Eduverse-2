// =================================================================
// GRAPH CANVAS - AI-Powered Mathematical Graphing System
// Supports LPP shading, multiple functions, CBSE-style formatting
// =================================================================

class GraphCanvas {
    constructor(containerId, width = 450, height = 350) {
        this.containerId = containerId;
        this.width = width;
        this.height = height;
        this.canvas = null;
        this.ctx = null;
        this.steps = [];
        this.currentStep = 0;
        this.isAnimating = false;
        this.animationSpeed = 500;
        
        // Graph configuration
        this.config = {
            origin: { x: width / 2, y: height / 2 },
            scale: { x: 40, y: 40 }, // pixels per unit
            gridSpacing: 1,
            axisColor: '#ffffff',
            gridColor: 'rgba(255, 255, 255, 0.1)',
            axisWidth: 2,
            gridWidth: 1,
            showGrid: true,
            showAxisLabels: true,
            scaleLabel: ''
        };
        
        this.colors = {
            primary: '#6366f1',
            secondary: '#ec4899',
            accent: '#8b5cf6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            blue: '#3b82f6',
            red: '#ef4444',
            green: '#22c55e',
            orange: '#f97316',
            purple: '#a855f7',
            cyan: '#06b6d4',
            pink: '#ec4899',
            yellow: '#eab308',
            white: '#ffffff',
            black: '#000000'
        };
        
        this.shadingPatterns = {
            solid: 'solid',
            diagonal: 'diagonal',
            crosshatch: 'crosshatch',
            horizontal: 'horizontal',
            vertical: 'vertical',
            dots: 'dots'
        };
    }

    // =================================================================
    // INITIALIZATION
    // =================================================================
    create(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'graph-wrapper';
        wrapper.innerHTML = `
            <div class="graph-container">
                <canvas id="${this.containerId}" width="${this.width}" height="${this.height}"></canvas>
                <div class="graph-scale-label"></div>
            </div>
            <div class="graph-controls" style="display: none;">
                <div class="step-info">
                    <span class="step-label">Step <span class="current-step">1</span> of <span class="total-steps">1</span></span>
                    <span class="step-description"></span>
                </div>
                <div class="step-navigation">
                    <button class="step-btn prev-btn" disabled>
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <div class="step-dots"></div>
                    <button class="step-btn next-btn">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(wrapper);
        
        this.canvas = document.getElementById(this.containerId);
        this.ctx = this.canvas.getContext('2d');
        this.wrapper = wrapper;
        this.scaleLabel = wrapper.querySelector('.graph-scale-label');
        
        this.setupNavigation();
        this.drawAxes();
        
        return this;
    }

    setupNavigation() {
        const prevBtn = this.wrapper.querySelector('.prev-btn');
        const nextBtn = this.wrapper.querySelector('.next-btn');
        
        prevBtn.addEventListener('click', () => this.previousStep());
        nextBtn.addEventListener('click', () => this.nextStep());
    }

    // =================================================================
    // COORDINATE SYSTEM
    // =================================================================
    
    // Convert graph coordinates to canvas pixels
    toCanvas(x, y) {
        return {
            x: this.config.origin.x + x * this.config.scale.x,
            y: this.config.origin.y - y * this.config.scale.y
        };
    }

    // Convert canvas pixels to graph coordinates
    toGraph(canvasX, canvasY) {
        return {
            x: (canvasX - this.config.origin.x) / this.config.scale.x,
            y: (this.config.origin.y - canvasY) / this.config.scale.y
        };
    }

    setScale(xScale, yScale, scaleLabel = '') {
        this.config.scale.x = xScale;
        this.config.scale.y = yScale || xScale;
        this.config.scaleLabel = scaleLabel;
        this.updateScaleLabel();
    }

    setOrigin(x, y) {
        this.config.origin = { x, y };
    }

    updateScaleLabel() {
        if (this.config.scaleLabel) {
            this.scaleLabel.textContent = this.config.scaleLabel;
            this.scaleLabel.style.display = 'block';
        } else {
            this.scaleLabel.style.display = 'none';
        }
    }

    // =================================================================
    // AXES AND GRID
    // =================================================================
    
    drawAxes() {
        const ctx = this.ctx;
        const { origin, scale } = this.config;
        
        // Clear canvas
        ctx.fillStyle = '#2a2d3a';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid
        if (this.config.showGrid) {
            this.drawGrid();
        }
        
        // Draw axes
        ctx.strokeStyle = this.config.axisColor;
        ctx.lineWidth = this.config.axisWidth;
        ctx.setLineDash([]);
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(this.width, origin.y);
        ctx.stroke();
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, this.height);
        ctx.stroke();
        
        // Draw arrowheads
        this.drawArrowhead(ctx, this.width - 5, origin.y, 0);
        this.drawArrowhead(ctx, 0 + 5, origin.y, Math.PI);
        this.drawArrowhead(ctx, origin.x, 5, -Math.PI / 2);
        this.drawArrowhead(ctx, origin.x, this.height - 5, Math.PI / 2);
        
        // Axis labels (X, X', Y, Y')
        ctx.font = 'bold 14px Inter, Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText('X', this.width - 20, origin.y + 20);
        ctx.fillText("X'", 20, origin.y + 20);
        ctx.fillText('Y', origin.x + 20, 20);
        ctx.fillText("Y'", origin.x + 20, this.height - 20);
        
        // Origin label
        ctx.fillText('O', origin.x - 15, origin.y + 15);
        
        // Axis number labels
        if (this.config.showAxisLabels) {
            this.drawAxisLabels();
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        const { origin, scale, gridSpacing } = this.config;
        
        ctx.strokeStyle = this.config.gridColor;
        ctx.lineWidth = this.config.gridWidth;
        
        // Vertical lines
        for (let i = -Math.ceil(origin.x / scale.x); i <= Math.ceil((this.width - origin.x) / scale.x); i += gridSpacing) {
            const x = origin.x + i * scale.x;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = -Math.ceil((this.height - origin.y) / scale.y); i <= Math.ceil(origin.y / scale.y); i += gridSpacing) {
            const y = origin.y - i * scale.y;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    drawAxisLabels() {
        const ctx = this.ctx;
        const { origin, scale } = this.config;
        
        ctx.font = '11px Inter, Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        // X-axis labels
        for (let i = -Math.floor(origin.x / scale.x); i <= Math.floor((this.width - origin.x) / scale.x); i++) {
            if (i === 0) continue;
            const x = origin.x + i * scale.x;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(i.toString(), x, origin.y + 5);
            
            // Tick marks
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, origin.y - 3);
            ctx.lineTo(x, origin.y + 3);
            ctx.stroke();
        }
        
        // Y-axis labels
        for (let i = -Math.floor((this.height - origin.y) / scale.y); i <= Math.floor(origin.y / scale.y); i++) {
            if (i === 0) continue;
            const y = origin.y - i * scale.y;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), origin.x - 8, y);
            
            // Tick marks
            ctx.beginPath();
            ctx.moveTo(origin.x - 3, y);
            ctx.lineTo(origin.x + 3, y);
            ctx.stroke();
        }
    }

    drawArrowhead(ctx, x, y, angle, size = 8) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size / 2);
        ctx.lineTo(-size, size / 2);
        ctx.closePath();
        ctx.fillStyle = this.config.axisColor;
        ctx.fill();
        ctx.restore();
    }

    // =================================================================
    // GRAPHING TOOLS
    // =================================================================
    
    // PLOT FUNCTION
    plotFunction(func, xMin, xMax, options = {}) {
        const color = this.colors[options.color] || options.color || this.colors.primary;
        const lineWidth = options.lineWidth || 2;
        const label = options.label || '';
        
        return {
            type: 'function',
            params: { func, xMin, xMax, label },
            style: { color, lineWidth },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const currentMax = xMin + (xMax - xMin) * progress;
                    const step = (xMax - xMin) / 200;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth;
                    ctx.setLineDash(options.dashed ? [5, 5] : []);
                    
                    let started = false;
                    for (let x = xMin; x <= currentMax; x += step) {
                        try {
                            const y = func(x);
                            if (isNaN(y) || !isFinite(y)) continue;
                            
                            const canvasPoint = this.toCanvas(x, y);
                            
                            // Skip if out of canvas bounds
                            if (canvasPoint.y < -100 || canvasPoint.y > this.height + 100) continue;
                            
                            if (!started) {
                                ctx.moveTo(canvasPoint.x, canvasPoint.y);
                                started = true;
                            } else {
                                ctx.lineTo(canvasPoint.x, canvasPoint.y);
                            }
                        } catch (e) {
                            // Skip undefined points
                        }
                    }
                    ctx.stroke();
                    
                    // Draw label at end
                    if (label && progress === 1) {
                        const endY = func(xMax);
                        const labelPoint = this.toCanvas(xMax, endY);
                        ctx.font = '12px Inter, Arial';
                        ctx.fillStyle = color;
                        ctx.textAlign = 'left';
                        ctx.fillText(label, labelPoint.x + 5, labelPoint.y);
                    }
                });
            }
        };
    }

    // PLOT LINEAR EQUATION (ax + by + c = 0)
    plotLinear(a, b, c, options = {}) {
        const xMin = options.xMin ?? -10;
        const xMax = options.xMax ?? 10;
        
        // y = (-ax - c) / b  OR  x = (-c) / a if b = 0
        const func = b !== 0 ? (x) => (-a * x - c) / b : null;
        
        if (func) {
            return this.plotFunction(func, xMin, xMax, options);
        } else {
            // Vertical line x = -c/a
            const x = -c / a;
            return this.drawVerticalLine(x, options);
        }
    }

    // DRAW VERTICAL LINE
    drawVerticalLine(x, options = {}) {
        const color = this.colors[options.color] || options.color || this.colors.primary;
        const label = options.label || '';
        
        return {
            type: 'verticalLine',
            params: { x, label },
            style: { color },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const canvasX = this.toCanvas(x, 0).x;
                    const startY = this.height;
                    const endY = 0;
                    const currentY = startY + (endY - startY) * progress;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.setLineDash(options.dashed ? [5, 5] : []);
                    ctx.moveTo(canvasX, startY);
                    ctx.lineTo(canvasX, currentY);
                    ctx.stroke();
                    
                    if (label && progress === 1) {
                        ctx.font = '12px Inter, Arial';
                        ctx.fillStyle = color;
                        ctx.fillText(label, canvasX + 5, 20);
                    }
                });
            }
        };
    }

    // DRAW HORIZONTAL LINE
    drawHorizontalLine(y, options = {}) {
        const color = this.colors[options.color] || options.color || this.colors.primary;
        const label = options.label || '';
        
        return {
            type: 'horizontalLine',
            params: { y, label },
            style: { color },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const canvasY = this.toCanvas(0, y).y;
                    const startX = 0;
                    const endX = this.width;
                    const currentX = startX + (endX - startX) * progress;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.setLineDash(options.dashed ? [5, 5] : []);
                    ctx.moveTo(startX, canvasY);
                    ctx.lineTo(currentX, canvasY);
                    ctx.stroke();
                    
                    if (label && progress === 1) {
                        ctx.font = '12px Inter, Arial';
                        ctx.fillStyle = color;
                        ctx.fillText(label, this.width - 30, canvasY - 5);
                    }
                });
            }
        };
    }

    // PLOT POINT
    plotPoint(x, y, label = '', options = {}) {
        const color = this.colors[options.color] || options.color || this.colors.primary;
        const radius = options.radius || 5;
        
        return {
            type: 'point',
            params: { x, y, label },
            style: { color, radius },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const point = this.toCanvas(x, y);
                    const currentRadius = radius * progress;
                    
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, currentRadius, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    if (label && progress === 1) {
                        ctx.font = 'bold 12px Inter, Arial';
                        ctx.fillStyle = color;
                        ctx.textAlign = 'left';
                        ctx.fillText(label, point.x + 8, point.y - 8);
                    }
                });
            }
        };
    }

    // CONNECT POINTS
    connectPoints(points, options = {}) {
        const color = this.colors[options.color] || options.color || this.colors.primary;
        const close = options.close !== false;
        
        return {
            type: 'connectPoints',
            params: { points, close },
            style: { color },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const numPoints = Math.ceil(points.length * progress);
                    if (numPoints < 1) return;
                    
                    const firstPoint = this.toCanvas(points[0].x, points[0].y);
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.moveTo(firstPoint.x, firstPoint.y);
                    
                    for (let i = 1; i < numPoints; i++) {
                        const p = this.toCanvas(points[i].x, points[i].y);
                        ctx.lineTo(p.x, p.y);
                    }
                    
                    if (close && progress === 1) {
                        ctx.closePath();
                    }
                    ctx.stroke();
                });
            }
        };
    }

    // =================================================================
    // SHADING TOOLS (for LPP)
    // =================================================================
    
    // SHADE POLYGON REGION
    shadePolygon(points, options = {}) {
        const color = this.colors[options.color] || options.color || this.colors.primary;
        const opacity = options.opacity || 0.3;
        const pattern = options.pattern || 'solid';
        
        return {
            type: 'shadePolygon',
            params: { points },
            style: { color, opacity, pattern },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    if (progress < 0.5) return;
                    
                    const canvasPoints = points.map(p => this.toCanvas(p.x, p.y));
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
                    for (let i = 1; i < canvasPoints.length; i++) {
                        ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
                    }
                    ctx.closePath();
                    
                    // Apply pattern
                    if (pattern === 'diagonal') {
                        ctx.fillStyle = this._createDiagonalPattern(color, opacity);
                    } else if (pattern === 'crosshatch') {
                        ctx.fillStyle = this._createCrossHatchPattern(color, opacity);
                    } else if (pattern === 'horizontal') {
                        ctx.fillStyle = this._createHorizontalPattern(color, opacity);
                    } else if (pattern === 'vertical') {
                        ctx.fillStyle = this._createVerticalPattern(color, opacity);
                    } else if (pattern === 'dots') {
                        ctx.fillStyle = this._createDotsPattern(color, opacity);
                    } else {
                        ctx.fillStyle = this._hexToRgba(color, opacity * (progress - 0.5) * 2);
                    }
                    
                    ctx.fill();
                    ctx.restore();
                });
            }
        };
    }

    // SHADE HALF-PLANE (for inequalities)
    shadeHalfPlane(a, b, c, inequality, options = {}) {
        // inequality: '<', '<=', '>', '>='
        // For ax + by + c <= 0 or ax + by + c >= 0
        const color = this.colors[options.color] || options.color || this.colors.primary;
        const opacity = options.opacity || 0.2;
        const pattern = options.pattern || 'diagonal';
        
        return {
            type: 'shadeHalfPlane',
            params: { a, b, c, inequality },
            style: { color, opacity, pattern },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    if (progress < 0.5) return;
                    
                    // Calculate the boundary line and determine which side to shade
                    const corners = [
                        { x: -20, y: -20 },
                        { x: 20, y: -20 },
                        { x: 20, y: 20 },
                        { x: -20, y: 20 }
                    ];
                    
                    // Filter corners based on inequality
                    const isGreater = inequality.includes('>');
                    const shadedCorners = corners.filter(p => {
                        const value = a * p.x + b * p.y + c;
                        return isGreater ? value >= 0 : value <= 0;
                    });
                    
                    // Find intersection points with boundary line
                    const intersections = [];
                    const edges = [[0, 1], [1, 2], [2, 3], [3, 0]];
                    
                    for (const [i, j] of edges) {
                        const p1 = corners[i];
                        const p2 = corners[j];
                        const val1 = a * p1.x + b * p1.y + c;
                        const val2 = a * p2.x + b * p2.y + c;
                        
                        if (val1 * val2 < 0) {
                            // Line crosses this edge
                            const t = -val1 / (val2 - val1);
                            intersections.push({
                                x: p1.x + t * (p2.x - p1.x),
                                y: p1.y + t * (p2.y - p1.y)
                            });
                        }
                    }
                    
                    // Build polygon from shaded corners and intersections
                    const polygon = [...shadedCorners, ...intersections];
                    
                    if (polygon.length < 3) return;
                    
                    // Sort polygon points by angle from centroid
                    const cx = polygon.reduce((s, p) => s + p.x, 0) / polygon.length;
                    const cy = polygon.reduce((s, p) => s + p.y, 0) / polygon.length;
                    polygon.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
                    
                    // Draw
                    const canvasPoints = polygon.map(p => this.toCanvas(p.x, p.y));
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
                    for (let i = 1; i < canvasPoints.length; i++) {
                        ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
                    }
                    ctx.closePath();
                    
                    // Apply pattern
                    if (pattern === 'diagonal') {
                        ctx.fillStyle = this._createDiagonalPattern(color, opacity);
                    } else if (pattern === 'crosshatch') {
                        ctx.fillStyle = this._createCrossHatchPattern(color, opacity);
                    } else {
                        ctx.fillStyle = this._hexToRgba(color, opacity);
                    }
                    
                    ctx.fill();
                    ctx.restore();
                });
            }
        };
    }

    // Pattern creation helpers
    _createDiagonalPattern(color, opacity) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 10;
        patternCanvas.height = 10;
        const pctx = patternCanvas.getContext('2d');
        
        pctx.strokeStyle = this._hexToRgba(color, opacity + 0.2);
        pctx.lineWidth = 1;
        pctx.beginPath();
        pctx.moveTo(0, 10);
        pctx.lineTo(10, 0);
        pctx.stroke();
        
        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    _createCrossHatchPattern(color, opacity) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 10;
        patternCanvas.height = 10;
        const pctx = patternCanvas.getContext('2d');
        
        pctx.strokeStyle = this._hexToRgba(color, opacity + 0.2);
        pctx.lineWidth = 1;
        pctx.beginPath();
        pctx.moveTo(0, 10);
        pctx.lineTo(10, 0);
        pctx.moveTo(0, 0);
        pctx.lineTo(10, 10);
        pctx.stroke();
        
        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    _createHorizontalPattern(color, opacity) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 10;
        patternCanvas.height = 10;
        const pctx = patternCanvas.getContext('2d');
        
        pctx.strokeStyle = this._hexToRgba(color, opacity + 0.2);
        pctx.lineWidth = 1;
        pctx.beginPath();
        pctx.moveTo(0, 5);
        pctx.lineTo(10, 5);
        pctx.stroke();
        
        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    _createVerticalPattern(color, opacity) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 10;
        patternCanvas.height = 10;
        const pctx = patternCanvas.getContext('2d');
        
        pctx.strokeStyle = this._hexToRgba(color, opacity + 0.2);
        pctx.lineWidth = 1;
        pctx.beginPath();
        pctx.moveTo(5, 0);
        pctx.lineTo(5, 10);
        pctx.stroke();
        
        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    _createDotsPattern(color, opacity) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 10;
        patternCanvas.height = 10;
        const pctx = patternCanvas.getContext('2d');
        
        pctx.fillStyle = this._hexToRgba(color, opacity + 0.3);
        pctx.beginPath();
        pctx.arc(5, 5, 2, 0, Math.PI * 2);
        pctx.fill();
        
        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    _hexToRgba(hex, alpha) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
        }
        return hex;
    }

    // =================================================================
    // DRAWING TOOLS
    // =================================================================
    
    // LINE SEGMENT ON GRAPH
    drawLine(x1, y1, x2, y2, options = {}) {
        const color = this.colors[options.color] || options.color || this.colors.primary;
        
        return {
            type: 'line',
            params: { x1, y1, x2, y2 },
            style: { color },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const p1 = this.toCanvas(x1, y1);
                    const p2 = this.toCanvas(x2, y2);
                    
                    const currentX = p1.x + (p2.x - p1.x) * progress;
                    const currentY = p1.y + (p2.y - p1.y) * progress;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = options.lineWidth || 2;
                    ctx.setLineDash(options.dashed ? [5, 5] : []);
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(currentX, currentY);
                    ctx.stroke();
                });
            }
        };
    }

    // ARROW
    drawArrow(x1, y1, x2, y2, options = {}) {
        const color = this.colors[options.color] || options.color || this.colors.primary;
        
        return {
            type: 'arrow',
            params: { x1, y1, x2, y2 },
            style: { color },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const p1 = this.toCanvas(x1, y1);
                    const p2 = this.toCanvas(x2, y2);
                    
                    const currentX = p1.x + (p2.x - p1.x) * progress;
                    const currentY = p1.y + (p2.y - p1.y) * progress;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = options.lineWidth || 2;
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(currentX, currentY);
                    ctx.stroke();
                    
                    if (progress > 0.9) {
                        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                        this.drawArrowhead(ctx, currentX, currentY, angle);
                    }
                });
            }
        };
    }

    // TEXT/LABEL
    drawText(text, x, y, options = {}) {
        const color = this.colors[options.color] || options.color || '#ffffff';
        
        return {
            type: 'text',
            params: { text, x, y },
            style: { color },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    if (progress < 0.8) return;
                    
                    const point = this.toCanvas(x, y);
                    ctx.font = options.font || '14px Inter, Arial';
                    ctx.fillStyle = color;
                    ctx.textAlign = options.align || 'center';
                    ctx.textBaseline = options.baseline || 'middle';
                    ctx.fillText(text, point.x, point.y);
                });
            }
        };
    }

    // CIRCLE
    drawCircle(cx, cy, radius, options = {}) {
        const color = this.colors[options.color] || options.color || this.colors.primary;
        
        return {
            type: 'circle',
            params: { cx, cy, radius },
            style: { color },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const center = this.toCanvas(cx, cy);
                    const r = radius * this.config.scale.x;
                    
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, r, 0, Math.PI * 2 * progress);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    if (options.fill && progress === 1) {
                        ctx.fillStyle = this._hexToRgba(color, 0.2);
                        ctx.fill();
                    }
                });
            }
        };
    }

    // =================================================================
    // SPECIAL GRAPH TYPES
    // =================================================================
    
    // VELOCITY-TIME GRAPH (for equations of motion)
    plotVelocityTime(u, a, tMax, options = {}) {
        // v = u + at
        const func = (t) => u + a * t;
        const plot = this.plotFunction(func, 0, tMax, { ...options, label: 'v = u + at' });
        
        return {
            type: 'velocityTime',
            params: { u, a, tMax },
            draw: async (ctx, animate = false) => {
                await plot.draw(ctx, animate);
                
                // Mark initial velocity
                await this.plotPoint(0, u, `u = ${u}`, { color: 'green' }).draw(ctx, false);
                
                // Mark final velocity
                const v = u + a * tMax;
                await this.plotPoint(tMax, v, `v = ${v.toFixed(1)}`, { color: 'red' }).draw(ctx, false);
            }
        };
    }

    // DISPLACEMENT-TIME GRAPH
    plotDisplacementTime(u, a, tMax, options = {}) {
        // s = ut + (1/2)at²
        const func = (t) => u * t + 0.5 * a * t * t;
        return this.plotFunction(func, 0, tMax, { ...options, label: 's = ut + ½at²' });
    }

    // PARABOLA (y = ax² + bx + c)
    plotParabola(a, b, c, xMin, xMax, options = {}) {
        const func = (x) => a * x * x + b * x + c;
        return this.plotFunction(func, xMin, xMax, options);
    }

    // SINE WAVE
    plotSine(amplitude, frequency, phase, xMin, xMax, options = {}) {
        const func = (x) => amplitude * Math.sin(frequency * x + phase);
        return this.plotFunction(func, xMin, xMax, options);
    }

    // COSINE WAVE
    plotCosine(amplitude, frequency, phase, xMin, xMax, options = {}) {
        const func = (x) => amplitude * Math.cos(frequency * x + phase);
        return this.plotFunction(func, xMin, xMax, options);
    }

    // EXPONENTIAL
    plotExponential(a, b, xMin, xMax, options = {}) {
        const func = (x) => a * Math.exp(b * x);
        return this.plotFunction(func, xMin, xMax, options);
    }

    // LOGARITHM
    plotLogarithm(base, xMin, xMax, options = {}) {
        const func = (x) => x > 0 ? Math.log(x) / Math.log(base) : NaN;
        return this.plotFunction(func, Math.max(0.01, xMin), xMax, options);
    }

    // =================================================================
    // STEP MANAGEMENT
    // =================================================================
    
    addStep(description, commands) {
        this.steps.push({
            description,
            commands,
            rendered: false
        });
        this.updateStepUI();
    }

    updateStepUI() {
        const controls = this.wrapper.querySelector('.graph-controls');
        const currentSpan = this.wrapper.querySelector('.current-step');
        const totalSpan = this.wrapper.querySelector('.total-steps');
        const descSpan = this.wrapper.querySelector('.step-description');
        const dotsContainer = this.wrapper.querySelector('.step-dots');
        const prevBtn = this.wrapper.querySelector('.prev-btn');
        const nextBtn = this.wrapper.querySelector('.next-btn');
        
        if (this.steps.length > 1) {
            controls.style.display = 'block';
        }
        
        currentSpan.textContent = this.currentStep + 1;
        totalSpan.textContent = this.steps.length;
        
        if (this.steps[this.currentStep]) {
            descSpan.textContent = this.steps[this.currentStep].description;
        }
        
        dotsContainer.innerHTML = '';
        for (let i = 0; i < this.steps.length; i++) {
            const dot = document.createElement('span');
            dot.className = `step-dot ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}`;
            dot.addEventListener('click', () => this.goToStep(i));
            dotsContainer.appendChild(dot);
        }
        
        prevBtn.disabled = this.currentStep === 0;
        nextBtn.disabled = this.currentStep === this.steps.length - 1;
    }

    async goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length || this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentStep = stepIndex;
        this.updateStepUI();
        
        // Clear and redraw axes
        this.drawAxes();
        
        // Draw all steps up to current
        for (let i = 0; i <= stepIndex; i++) {
            const step = this.steps[i];
            const animate = (i === stepIndex);
            
            for (const cmd of step.commands) {
                await cmd.draw(this.ctx, animate);
            }
        }
        
        this.isAnimating = false;
    }

    async nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            await this.goToStep(this.currentStep + 1);
        }
    }

    async previousStep() {
        if (this.currentStep > 0) {
            await this.goToStep(this.currentStep - 1);
        }
    }

    // =================================================================
    // ANIMATION HELPER
    // =================================================================
    
    async _animatedDraw(ctx, animate, drawFunc) {
        if (!animate) {
            drawFunc(1);
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            const duration = this.animationSpeed;
            const startTime = performance.now();
            
            const animateFrame = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this._easeOutCubic(progress);
                
                drawFunc(eased);
                
                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animateFrame);
        });
    }

    _easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // =================================================================
    // EXECUTE JSON COMMANDS FROM LLM
    // =================================================================
    async executeCommands(commandsJson) {
        try {
            const data = typeof commandsJson === 'string' ? JSON.parse(commandsJson) : commandsJson;
            
            // Reset
            this.steps = [];
            this.currentStep = 0;
            
            // Apply config
            if (data.config) {
                if (data.config.scale) {
                    this.setScale(data.config.scale.x, data.config.scale.y, data.config.scaleLabel);
                }
                if (data.config.origin) {
                    this.setOrigin(data.config.origin.x, data.config.origin.y);
                }
            }
            
            this.drawAxes();
            
            if (data.steps) {
                for (const step of data.steps) {
                    const commands = [];
                    for (const cmd of step.commands) {
                        const drawCmd = this._parseCommand(cmd);
                        if (drawCmd) commands.push(drawCmd);
                    }
                    this.addStep(step.description || '', commands);
                }
                await this.goToStep(0);
            } else if (data.commands) {
                for (const cmd of data.commands) {
                    const drawCmd = this._parseCommand(cmd);
                    if (drawCmd) {
                        await drawCmd.draw(this.ctx, true);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error executing graph commands:', error);
        }
    }

    _parseCommand(cmd) {
        const { tool, params, style } = cmd;
        const options = style || {};
        
        switch (tool) {
            case 'function':
                const func = new Function('x', `return ${params.expression}`);
                return this.plotFunction(func, params.xMin, params.xMax, options);
            case 'linear':
                return this.plotLinear(params.a, params.b, params.c, options);
            case 'point':
                return this.plotPoint(params.x, params.y, params.label, options);
            case 'verticalLine':
                return this.drawVerticalLine(params.x, options);
            case 'horizontalLine':
                return this.drawHorizontalLine(params.y, options);
            case 'line':
                return this.drawLine(params.x1, params.y1, params.x2, params.y2, options);
            case 'arrow':
                return this.drawArrow(params.x1, params.y1, params.x2, params.y2, options);
            case 'text':
                return this.drawText(params.text, params.x, params.y, options);
            case 'circle':
                return this.drawCircle(params.cx, params.cy, params.radius, options);
            case 'connectPoints':
                return this.connectPoints(params.points, options);
            case 'shadePolygon':
                return this.shadePolygon(params.points, options);
            case 'shadeHalfPlane':
                return this.shadeHalfPlane(params.a, params.b, params.c, params.inequality, options);
            case 'parabola':
                return this.plotParabola(params.a, params.b, params.c, params.xMin, params.xMax, options);
            case 'sine':
                return this.plotSine(params.amplitude, params.frequency, params.phase || 0, params.xMin, params.xMax, options);
            case 'cosine':
                return this.plotCosine(params.amplitude, params.frequency, params.phase || 0, params.xMin, params.xMax, options);
            case 'exponential':
                return this.plotExponential(params.a, params.b, params.xMin, params.xMax, options);
            case 'logarithm':
                return this.plotLogarithm(params.base || Math.E, params.xMin, params.xMax, options);
            case 'velocityTime':
                return this.plotVelocityTime(params.u, params.a, params.tMax, options);
            case 'displacementTime':
                return this.plotDisplacementTime(params.u, params.a, params.tMax, options);
            default:
                console.warn(`Unknown graph tool: ${tool}`);
                return null;
        }
    }
}

// Export for use
window.GraphCanvas = GraphCanvas;
