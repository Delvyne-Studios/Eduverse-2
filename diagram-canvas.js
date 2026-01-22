// =================================================================
// DIAGRAM & GRAPH CANVAS - AI-Powered Drawing System
// Supports CBSE-style diagrams, graphs, LPP shading, step-by-step
// =================================================================

class DiagramCanvas {
    constructor(containerId, width = 450, height = 300) {
        this.containerId = containerId;
        this.width = width;
        this.height = height;
        this.canvas = null;
        this.ctx = null;
        this.steps = [];
        this.currentStep = 0;
        this.isAnimating = false;
        this.animationSpeed = 500; // ms per animation
        this.colors = {
            primary: '#6366f1',
            secondary: '#ec4899',
            accent: '#8b5cf6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            black: '#000000',
            white: '#ffffff',
            gray: '#6b7280',
            blue: '#3b82f6',
            red: '#ef4444',
            green: '#22c55e',
            orange: '#f97316',
            purple: '#a855f7',
            cyan: '#06b6d4',
            pink: '#ec4899',
            yellow: '#eab308',
            brown: '#92400e'
        };
        this.defaultStyle = {
            strokeColor: '#ffffff',
            fillColor: 'transparent',
            lineWidth: 2,
            fontSize: 14,
            fontFamily: 'Inter, Arial, sans-serif',
            lineDash: [],
            arrowSize: 10
        };
        this.currentStyle = { ...this.defaultStyle };
        
        // Grid system for spatial awareness
        this.grid = {
            cols: 12,
            rows: 10,
            cellWidth: this.width / 12,
            cellHeight: this.height / 10,
            visible: true
        };
    }

    // =================================================================
    // GRID SYSTEM
    // =================================================================
    
    toPixels(gridX, gridY) {
        // Convert grid coordinates (0-12, 0-10) to pixel coordinates
        return {
            x: gridX * this.grid.cellWidth,
            y: gridY * this.grid.cellHeight
        };
    }
    
    drawGrid() {
        if (!this.grid.visible) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        // Draw vertical lines
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.grid.cols; i++) {
            const x = i * this.grid.cellWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
            
            // Grid labels
            if (i > 0 && i < this.grid.cols) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '10px Inter, Arial';
                ctx.textAlign = 'center';
                ctx.fillText(i.toString(), x, 12);
            }
        }
        
        // Draw horizontal lines
        for (let i = 0; i <= this.grid.rows; i++) {
            const y = i * this.grid.cellHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
            
            // Grid labels
            if (i > 0 && i < this.grid.rows) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '10px Inter, Arial';
                ctx.textAlign = 'right';
                ctx.fillText(i.toString(), 12, y + 4);
            }
        }
        
        ctx.restore();
    }

    // =================================================================
    // INITIALIZATION
    // =================================================================
    create(container) {
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'diagram-wrapper';
        wrapper.innerHTML = `
            <div class="diagram-container">
                <canvas id="${this.containerId}" width="${this.width}" height="${this.height}"></canvas>
            </div>
            <div class="diagram-controls" style="display: none;">
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
        
        // Setup event listeners
        this.setupNavigation();
        
        // Initial setup
        this.clear();
        
        return this;
    }

    setupNavigation() {
        const prevBtn = this.wrapper.querySelector('.prev-btn');
        const nextBtn = this.wrapper.querySelector('.next-btn');
        
        prevBtn.addEventListener('click', () => this.previousStep());
        nextBtn.addEventListener('click', () => this.nextStep());
    }

    // =================================================================
    // CORE DRAWING TOOLS
    // =================================================================
    
    // LINE - Basic straight line
    drawLine(x1, y1, x2, y2, options = {}) {
        return {
            type: 'line',
            params: { x1, y1, x2, y2 },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const endX = x1 + (x2 - x1) * progress;
                    const endY = y1 + (y2 - y1) * progress;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(endX, endY);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                });
            }
        };
    }

    // RAY - Line starting from a point extending infinitely in one direction
    drawRay(x1, y1, x2, y2, options = {}) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const extendedX = x1 + (dx / len) * Math.max(this.width, this.height) * 2;
        const extendedY = y1 + (dy / len) * Math.max(this.width, this.height) * 2;
        
        return {
            type: 'ray',
            params: { x1, y1, x2, y2 },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const endX = x1 + (extendedX - x1) * progress;
                    const endY = y1 + (extendedY - y1) * progress;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(endX, endY);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    // Draw point at origin
                    ctx.beginPath();
                    ctx.arc(x1, y1, 4, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        };
    }

    // LINE SEGMENT - Line with endpoints marked
    drawLineSegment(x1, y1, x2, y2, label = '', options = {}) {
        return {
            type: 'lineSegment',
            params: { x1, y1, x2, y2, label },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const endX = x1 + (x2 - x1) * progress;
                    const endY = y1 + (y2 - y1) * progress;
                    
                    // Draw line
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(endX, endY);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    
                    // Draw endpoints
                    ctx.beginPath();
                    ctx.arc(x1, y1, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    if (progress === 1) {
                        ctx.beginPath();
                        ctx.arc(x2, y2, 4, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Draw label if provided
                        if (label) {
                            const midX = (x1 + x2) / 2;
                            const midY = (y1 + y2) / 2 - 10;
                            this._drawText(ctx, label, midX, midY, { ...this.currentStyle, ...options });
                        }
                    }
                });
            }
        };
    }

    // ARROW - Line with arrowhead
    drawArrow(x1, y1, x2, y2, options = {}) {
        const arrowSize = options.arrowSize || this.defaultStyle.arrowSize;
        
        return {
            type: 'arrow',
            params: { x1, y1, x2, y2 },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const endX = x1 + (x2 - x1) * progress;
                    const endY = y1 + (y2 - y1) * progress;
                    
                    // Draw line
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(endX, endY);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    
                    // Draw arrowhead at current end point
                    if (progress > 0.9) {
                        const angle = Math.atan2(y2 - y1, x2 - x1);
                        ctx.beginPath();
                        ctx.moveTo(endX, endY);
                        ctx.lineTo(
                            endX - arrowSize * Math.cos(angle - Math.PI / 6),
                            endY - arrowSize * Math.sin(angle - Math.PI / 6)
                        );
                        ctx.lineTo(
                            endX - arrowSize * Math.cos(angle + Math.PI / 6),
                            endY - arrowSize * Math.sin(angle + Math.PI / 6)
                        );
                        ctx.closePath();
                        ctx.fill();
                    }
                });
            }
        };
    }

    // DOUBLE ARROW - Arrow on both ends
    drawDoubleArrow(x1, y1, x2, y2, options = {}) {
        const arrowSize = options.arrowSize || this.defaultStyle.arrowSize;
        
        return {
            type: 'doubleArrow',
            params: { x1, y1, x2, y2 },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const startX = x1 + (x2 - x1) * (1 - progress) * 0.5;
                    const startY = y1 + (y2 - y1) * (1 - progress) * 0.5;
                    const endX = x1 + (x2 - x1) * (0.5 + progress * 0.5);
                    const endY = y1 + (y2 - y1) * (0.5 + progress * 0.5);
                    
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    
                    if (progress === 1) {
                        // Arrow at start
                        const angle1 = Math.atan2(y2 - y1, x2 - x1);
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(
                            x1 + arrowSize * Math.cos(angle1 - Math.PI / 6),
                            y1 + arrowSize * Math.sin(angle1 - Math.PI / 6)
                        );
                        ctx.lineTo(
                            x1 + arrowSize * Math.cos(angle1 + Math.PI / 6),
                            y1 + arrowSize * Math.sin(angle1 + Math.PI / 6)
                        );
                        ctx.closePath();
                        ctx.fill();
                        
                        // Arrow at end
                        ctx.beginPath();
                        ctx.moveTo(x2, y2);
                        ctx.lineTo(
                            x2 - arrowSize * Math.cos(angle1 - Math.PI / 6),
                            y2 - arrowSize * Math.sin(angle1 - Math.PI / 6)
                        );
                        ctx.lineTo(
                            x2 - arrowSize * Math.cos(angle1 + Math.PI / 6),
                            y2 - arrowSize * Math.sin(angle1 + Math.PI / 6)
                        );
                        ctx.closePath();
                        ctx.fill();
                    }
                });
            }
        };
    }

    // CURVE - Bezier curve
    drawCurve(x1, y1, cx1, cy1, cx2, cy2, x2, y2, options = {}) {
        return {
            type: 'curve',
            params: { x1, y1, cx1, cy1, cx2, cy2, x2, y2 },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    // Use De Casteljau's algorithm for partial bezier
                    this._drawPartialBezier(ctx, x1, y1, cx1, cy1, cx2, cy2, x2, y2, progress);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                });
            }
        };
    }

    // QUADRATIC CURVE - Simple curve with one control point
    drawQuadraticCurve(x1, y1, cx, cy, x2, y2, options = {}) {
        return {
            type: 'quadraticCurve',
            params: { x1, y1, cx, cy, x2, y2 },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    const t = progress;
                    const endX = (1-t)*(1-t)*x1 + 2*(1-t)*t*cx + t*t*x2;
                    const endY = (1-t)*(1-t)*y1 + 2*(1-t)*t*cy + t*t*y2;
                    ctx.quadraticCurveTo(cx, cy, endX, endY);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                });
            }
        };
    }

    // ARC - Partial circle
    drawArc(x, y, radius, startAngle, endAngle, options = {}) {
        return {
            type: 'arc',
            params: { x, y, radius, startAngle, endAngle },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const currentEnd = startAngle + (endAngle - startAngle) * progress;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, startAngle, currentEnd);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                });
            }
        };
    }

    // CIRCLE
    drawCircle(x, y, radius, options = {}) {
        return {
            type: 'circle',
            params: { x, y, radius },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2 * progress);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    if (options.fill) {
                        ctx.fill();
                    }
                    ctx.stroke();
                });
            }
        };
    }

    // ELLIPSE
    drawEllipse(x, y, radiusX, radiusY, rotation = 0, options = {}) {
        return {
            type: 'ellipse',
            params: { x, y, radiusX, radiusY, rotation },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    ctx.beginPath();
                    ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2 * progress);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    if (options.fill) {
                        ctx.fill();
                    }
                    ctx.stroke();
                });
            }
        };
    }

    // RECTANGLE
    drawRectangle(x, y, width, height, options = {}) {
        return {
            type: 'rectangle',
            params: { x, y, width, height },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const currentWidth = width * progress;
                    const currentHeight = height * progress;
                    ctx.beginPath();
                    ctx.rect(x, y, currentWidth, currentHeight);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    if (options.fill) {
                        ctx.fill();
                    }
                    ctx.stroke();
                });
            }
        };
    }

    // ROUNDED RECTANGLE
    drawRoundedRect(x, y, width, height, radius, options = {}) {
        return {
            type: 'roundedRect',
            params: { x, y, width, height, radius },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    ctx.beginPath();
                    ctx.roundRect(x, y, width * progress, height * progress, radius);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    if (options.fill) {
                        ctx.fill();
                    }
                    ctx.stroke();
                });
            }
        };
    }

    // POLYGON
    drawPolygon(points, options = {}) {
        return {
            type: 'polygon',
            params: { points },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const numPoints = Math.ceil(points.length * progress);
                    if (numPoints < 2) return;
                    
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < numPoints; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                    if (progress === 1 && options.close !== false) {
                        ctx.closePath();
                    }
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    if (options.fill) {
                        ctx.fill();
                    }
                    ctx.stroke();
                });
            }
        };
    }

    // TRIANGLE
    drawTriangle(x1, y1, x2, y2, x3, y3, options = {}) {
        return this.drawPolygon([
            { x: x1, y: y1 },
            { x: x2, y: y2 },
            { x: x3, y: y3 }
        ], options);
    }

    // TEXT
    drawText(text, x, y, options = {}) {
        return {
            type: 'text',
            params: { text, x, y },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const visibleLength = Math.ceil(text.length * progress);
                    const visibleText = text.substring(0, visibleLength);
                    this._drawText(ctx, visibleText, x, y, { ...this.currentStyle, ...options });
                });
            }
        };
    }

    // LABEL with box
    drawLabel(text, x, y, options = {}) {
        return {
            type: 'label',
            params: { text, x, y },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    if (progress < 1) return;
                    
                    const fontSize = options.fontSize || this.defaultStyle.fontSize;
                    ctx.font = `${fontSize}px ${options.fontFamily || this.defaultStyle.fontFamily}`;
                    const metrics = ctx.measureText(text);
                    const padding = 6;
                    const boxWidth = metrics.width + padding * 2;
                    const boxHeight = fontSize + padding * 2;
                    
                    // Draw background box
                    ctx.fillStyle = options.backgroundColor || 'rgba(0,0,0,0.7)';
                    ctx.fillRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight);
                    
                    // Draw border
                    ctx.strokeStyle = options.borderColor || 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight);
                    
                    // Draw text
                    ctx.fillStyle = options.strokeColor || '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, x, y);
                });
            }
        };
    }

    // POINT - Single point with optional label
    drawPoint(x, y, label = '', options = {}) {
        return {
            type: 'point',
            params: { x, y, label },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const radius = (options.pointRadius || 4) * progress;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options, fill: true });
                    ctx.fill();
                    
                    if (label && progress === 1) {
                        const labelX = x + 10;
                        const labelY = y - 10;
                        this._drawText(ctx, label, labelX, labelY, { ...this.currentStyle, ...options });
                    }
                });
            }
        };
    }

    // DASHED LINE
    drawDashedLine(x1, y1, x2, y2, dashPattern = [5, 5], options = {}) {
        return this.drawLine(x1, y1, x2, y2, { ...options, lineDash: dashPattern });
    }

    // DOTTED LINE
    drawDottedLine(x1, y1, x2, y2, options = {}) {
        return this.drawLine(x1, y1, x2, y2, { ...options, lineDash: [2, 4] });
    }

    // ANGLE MARKER
    drawAngle(x, y, radius, startAngle, endAngle, label = '', options = {}) {
        return {
            type: 'angle',
            params: { x, y, radius, startAngle, endAngle, label },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const currentEnd = startAngle + (endAngle - startAngle) * progress;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, startAngle, currentEnd);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    
                    if (label && progress === 1) {
                        const midAngle = (startAngle + endAngle) / 2;
                        const labelX = x + (radius + 15) * Math.cos(midAngle);
                        const labelY = y + (radius + 15) * Math.sin(midAngle);
                        this._drawText(ctx, label, labelX, labelY, { ...this.currentStyle, ...options });
                    }
                });
            }
        };
    }

    // RIGHT ANGLE MARKER (90 degree square)
    drawRightAngle(x, y, size, rotation = 0, options = {}) {
        return {
            type: 'rightAngle',
            params: { x, y, size, rotation },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    if (progress < 1) return;
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(rotation);
                    
                    ctx.beginPath();
                    ctx.moveTo(size, 0);
                    ctx.lineTo(size, size);
                    ctx.lineTo(0, size);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    
                    ctx.restore();
                });
            }
        };
    }

    // DIMENSION LINE (for measurements)
    drawDimension(x1, y1, x2, y2, label, offset = 20, options = {}) {
        return {
            type: 'dimension',
            params: { x1, y1, x2, y2, label, offset },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    const perpAngle = angle + Math.PI / 2;
                    
                    const ox = offset * Math.cos(perpAngle);
                    const oy = offset * Math.sin(perpAngle);
                    
                    const px1 = x1 + ox;
                    const py1 = y1 + oy;
                    const px2 = x2 + ox;
                    const py2 = y2 + oy;
                    
                    // Extension lines
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(px1, py1);
                    ctx.moveTo(x2, y2);
                    ctx.lineTo(px2, py2);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options, lineWidth: 1 });
                    ctx.stroke();
                    
                    // Main dimension line with arrows
                    const arrowSize = 6;
                    ctx.beginPath();
                    ctx.moveTo(px1, py1);
                    ctx.lineTo(px2 * progress + px1 * (1 - progress), py2 * progress + py1 * (1 - progress));
                    ctx.stroke();
                    
                    if (progress === 1) {
                        // Arrowheads
                        this._drawArrowhead(ctx, px2, py2, angle + Math.PI, arrowSize);
                        this._drawArrowhead(ctx, px1, py1, angle, arrowSize);
                        
                        // Label
                        const midX = (px1 + px2) / 2;
                        const midY = (py1 + py2) / 2 - 8;
                        this._drawText(ctx, label, midX, midY, { ...this.currentStyle, ...options, textAlign: 'center' });
                    }
                });
            }
        };
    }

    // PARALLEL LINES MARKER
    drawParallelMark(x, y, angle, options = {}) {
        return {
            type: 'parallelMark',
            params: { x, y, angle },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    if (progress < 1) return;
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle);
                    
                    const size = 8;
                    ctx.beginPath();
                    ctx.moveTo(-size/2, -3);
                    ctx.lineTo(size/2, -3);
                    ctx.moveTo(-size/2, 3);
                    ctx.lineTo(size/2, 3);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    
                    ctx.restore();
                });
            }
        };
    }

    // TICK MARKS (for equal lengths)
    drawTickMark(x, y, angle, count = 1, options = {}) {
        return {
            type: 'tickMark',
            params: { x, y, angle, count },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    if (progress < 1) return;
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle + Math.PI / 2);
                    
                    const tickSize = 8;
                    const spacing = 4;
                    const totalWidth = (count - 1) * spacing;
                    
                    for (let i = 0; i < count; i++) {
                        const tx = -totalWidth/2 + i * spacing;
                        ctx.beginPath();
                        ctx.moveTo(tx, -tickSize/2);
                        ctx.lineTo(tx, tickSize/2);
                        this._applyStyle(ctx, { ...this.currentStyle, ...options });
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                });
            }
        };
    }

    // SPRING (for physics diagrams)
    drawSpring(x1, y1, x2, y2, coils = 10, options = {}) {
        return {
            type: 'spring',
            params: { x1, y1, x2, y2, coils },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    
                    ctx.save();
                    ctx.translate(x1, y1);
                    ctx.rotate(angle);
                    
                    const amplitude = options.amplitude || 10;
                    const segments = coils * 4;
                    const segmentLen = len / segments;
                    
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    
                    const numSegments = Math.floor(segments * progress);
                    for (let i = 1; i <= numSegments; i++) {
                        const x = i * segmentLen;
                        const y = (i % 2 === 0 ? 0 : (i % 4 === 1 ? amplitude : -amplitude));
                        ctx.lineTo(x, y);
                    }
                    
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    ctx.restore();
                });
            }
        };
    }

    // RESISTOR (zigzag for circuit diagrams)
    drawResistor(x1, y1, x2, y2, options = {}) {
        return {
            type: 'resistor',
            params: { x1, y1, x2, y2 },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    
                    ctx.save();
                    ctx.translate(x1, y1);
                    ctx.rotate(angle);
                    
                    const leadLen = len * 0.2;
                    const zigzagLen = len * 0.6;
                    const amplitude = 8;
                    const peaks = 6;
                    
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(leadLen * Math.min(progress * 5, 1), 0);
                    
                    if (progress > 0.2) {
                        const zigProgress = (progress - 0.2) / 0.6;
                        const numPeaks = Math.floor(peaks * 2 * zigProgress);
                        for (let i = 1; i <= numPeaks; i++) {
                            const x = leadLen + (zigzagLen / (peaks * 2)) * i;
                            const y = (i % 2 === 0 ? 0 : (i % 4 === 1 ? amplitude : -amplitude));
                            ctx.lineTo(x, y);
                        }
                    }
                    
                    if (progress > 0.8) {
                        ctx.lineTo(leadLen + zigzagLen, 0);
                        ctx.lineTo(len * Math.min((progress - 0.8) * 5 + 0.8, 1), 0);
                    }
                    
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    ctx.restore();
                });
            }
        };
    }

    // CAPACITOR
    drawCapacitor(x1, y1, x2, y2, options = {}) {
        return {
            type: 'capacitor',
            params: { x1, y1, x2, y2 },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    const plateHeight = 20;
                    const gap = 6;
                    
                    ctx.save();
                    ctx.translate(midX, midY);
                    ctx.rotate(angle);
                    
                    // Lead lines
                    ctx.beginPath();
                    ctx.moveTo(-Math.sqrt((midX-x1)**2 + (midY-y1)**2), 0);
                    ctx.lineTo(-gap/2, 0);
                    ctx.moveTo(gap/2, 0);
                    ctx.lineTo(Math.sqrt((x2-midX)**2 + (y2-midY)**2), 0);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    
                    // Plates
                    ctx.beginPath();
                    ctx.moveTo(-gap/2, -plateHeight/2 * progress);
                    ctx.lineTo(-gap/2, plateHeight/2 * progress);
                    ctx.moveTo(gap/2, -plateHeight/2 * progress);
                    ctx.lineTo(gap/2, plateHeight/2 * progress);
                    ctx.stroke();
                    
                    ctx.restore();
                });
            }
        };
    }

    // GROUND SYMBOL
    drawGround(x, y, options = {}) {
        return {
            type: 'ground',
            params: { x, y },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    if (progress < 1) return;
                    
                    const lineLen = [16, 10, 4];
                    const spacing = 4;
                    
                    ctx.beginPath();
                    for (let i = 0; i < 3; i++) {
                        const yPos = y + i * spacing;
                        ctx.moveTo(x - lineLen[i]/2, yPos);
                        ctx.lineTo(x + lineLen[i]/2, yPos);
                    }
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                });
            }
        };
    }

    // BATTERY
    drawBattery(x1, y1, x2, y2, options = {}) {
        return {
            type: 'battery',
            params: { x1, y1, x2, y2 },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    
                    ctx.save();
                    ctx.translate(midX, midY);
                    ctx.rotate(angle);
                    
                    const longPlate = 16;
                    const shortPlate = 8;
                    const gap = 4;
                    
                    // Lead lines
                    ctx.beginPath();
                    ctx.moveTo(-30, 0);
                    ctx.lineTo(-gap, 0);
                    ctx.moveTo(gap, 0);
                    ctx.lineTo(30, 0);
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    
                    // Plates (long = negative, short = positive)
                    ctx.beginPath();
                    ctx.moveTo(-gap, -longPlate/2 * progress);
                    ctx.lineTo(-gap, longPlate/2 * progress);
                    ctx.moveTo(gap, -shortPlate/2 * progress);
                    ctx.lineTo(gap, shortPlate/2 * progress);
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    
                    // Labels
                    if (progress === 1) {
                        ctx.font = '10px Arial';
                        ctx.fillStyle = options.strokeColor || '#ffffff';
                        ctx.fillText('-', -gap - 8, 4);
                        ctx.fillText('+', gap + 4, 4);
                    }
                    
                    ctx.restore();
                });
            }
        };
    }

    // WAVE (sine wave)
    drawWave(x1, y1, x2, y2, wavelength = 50, amplitude = 20, options = {}) {
        return {
            type: 'wave',
            params: { x1, y1, x2, y2, wavelength, amplitude },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    
                    ctx.save();
                    ctx.translate(x1, y1);
                    ctx.rotate(angle);
                    
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    
                    const currentLen = len * progress;
                    for (let x = 0; x <= currentLen; x += 2) {
                        const y = amplitude * Math.sin((x / wavelength) * Math.PI * 2);
                        if (x === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    ctx.restore();
                });
            }
        };
    }

    // LENS (convex or concave)
    drawLens(x, y, height, type = 'convex', options = {}) {
        return {
            type: 'lens',
            params: { x, y, height, type },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const h = height * progress;
                    const curvature = type === 'convex' ? 15 : -15;
                    
                    ctx.beginPath();
                    // Left curve
                    ctx.moveTo(x, y - h/2);
                    ctx.quadraticCurveTo(x + curvature, y, x, y + h/2);
                    // Right curve
                    ctx.moveTo(x, y - h/2);
                    ctx.quadraticCurveTo(x - curvature, y, x, y + h/2);
                    
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                    
                    // Principal axis marker
                    if (progress === 1) {
                        ctx.beginPath();
                        ctx.moveTo(x - 5, y);
                        ctx.lineTo(x + 5, y);
                        ctx.stroke();
                    }
                });
            }
        };
    }

    // MIRROR (plane, concave, convex)
    drawMirror(x, y, height, type = 'plane', options = {}) {
        return {
            type: 'mirror',
            params: { x, y, height, type },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    const h = height * progress;
                    
                    ctx.beginPath();
                    if (type === 'plane') {
                        ctx.moveTo(x, y - h/2);
                        ctx.lineTo(x, y + h/2);
                        // Hatching for mirror back
                        for (let i = -h/2; i < h/2; i += 8) {
                            ctx.moveTo(x, y + i);
                            ctx.lineTo(x + 5, y + i + 5);
                        }
                    } else {
                        const curvature = type === 'concave' ? 20 : -20;
                        ctx.moveTo(x, y - h/2);
                        ctx.quadraticCurveTo(x + curvature, y, x, y + h/2);
                    }
                    
                    this._applyStyle(ctx, { ...this.currentStyle, ...options, lineWidth: 3 });
                    ctx.stroke();
                });
            }
        };
    }

    // FREEHAND PATH
    drawFreehand(points, options = {}) {
        return {
            type: 'freehand',
            params: { points },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return this._animatedDraw(ctx, animate, (progress) => {
                    if (points.length < 2) return;
                    
                    const numPoints = Math.ceil(points.length * progress);
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    
                    for (let i = 1; i < numPoints; i++) {
                        const xc = (points[i].x + points[i-1].x) / 2;
                        const yc = (points[i].y + points[i-1].y) / 2;
                        ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
                    }
                    
                    this._applyStyle(ctx, { ...this.currentStyle, ...options });
                    ctx.stroke();
                });
            }
        };
    }

    // IMAGE (for including diagrams)
    drawImage(src, x, y, width, height, options = {}) {
        const img = new Image();
        img.src = src;
        
        return {
            type: 'image',
            params: { src, x, y, width, height },
            style: { ...this.currentStyle, ...options },
            draw: (ctx, animate = false) => {
                return new Promise((resolve) => {
                    if (img.complete) {
                        ctx.globalAlpha = animate ? 0 : 1;
                        ctx.drawImage(img, x, y, width, height);
                        ctx.globalAlpha = 1;
                        resolve();
                    } else {
                        img.onload = () => {
                            ctx.drawImage(img, x, y, width, height);
                            resolve();
                        };
                    }
                });
            }
        };
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================
    
    _applyStyle(ctx, style) {
        ctx.strokeStyle = this.colors[style.strokeColor] || style.strokeColor || this.defaultStyle.strokeColor;
        ctx.fillStyle = this.colors[style.fillColor] || style.fillColor || ctx.strokeStyle;
        ctx.lineWidth = style.lineWidth || this.defaultStyle.lineWidth;
        ctx.setLineDash(style.lineDash || []);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    _drawText(ctx, text, x, y, style) {
        const fontSize = style.fontSize || this.defaultStyle.fontSize;
        ctx.font = `${style.fontWeight || 'normal'} ${fontSize}px ${style.fontFamily || this.defaultStyle.fontFamily}`;
        ctx.fillStyle = this.colors[style.strokeColor] || style.strokeColor || '#ffffff';
        ctx.textAlign = style.textAlign || 'center';
        ctx.textBaseline = style.textBaseline || 'middle';
        ctx.fillText(text, x, y);
    }

    _drawArrowhead(ctx, x, y, angle, size) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x - size * Math.cos(angle - Math.PI / 6),
            y - size * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            x - size * Math.cos(angle + Math.PI / 6),
            y - size * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }

    _drawPartialBezier(ctx, x1, y1, cx1, cy1, cx2, cy2, x2, y2, t) {
        // Split bezier curve at parameter t
        const x12 = x1 + (cx1 - x1) * t;
        const y12 = y1 + (cy1 - y1) * t;
        const x23 = cx1 + (cx2 - cx1) * t;
        const y23 = cy1 + (cy2 - cy1) * t;
        const x34 = cx2 + (x2 - cx2) * t;
        const y34 = cy2 + (y2 - cy2) * t;
        const x123 = x12 + (x23 - x12) * t;
        const y123 = y12 + (y23 - y12) * t;
        const x234 = x23 + (x34 - x23) * t;
        const y234 = y23 + (y34 - y23) * t;
        const x1234 = x123 + (x234 - x123) * t;
        const y1234 = y123 + (y234 - y123) * t;
        
        ctx.bezierCurveTo(x12, y12, x123, y123, x1234, y1234);
    }

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
        const controls = this.wrapper.querySelector('.diagram-controls');
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
        
        // Update dots
        dotsContainer.innerHTML = '';
        for (let i = 0; i < this.steps.length; i++) {
            const dot = document.createElement('span');
            dot.className = `step-dot ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}`;
            dot.addEventListener('click', () => this.goToStep(i));
            dotsContainer.appendChild(dot);
        }
        
        // Update buttons
        prevBtn.disabled = this.currentStep === 0;
        nextBtn.disabled = this.currentStep === this.steps.length - 1;
    }

    async goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length || this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentStep = stepIndex;
        this.updateStepUI();
        
        // Clear and redraw up to current step
        this.clear();
        
        for (let i = 0; i <= stepIndex; i++) {
            const step = this.steps[i];
            const animate = (i === stepIndex); // Only animate the last step
            
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
    // CANVAS OPERATIONS
    // =================================================================
    
    clear() {
        this.ctx.fillStyle = '#2a2d3a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid system
        this.drawGrid();
        
        // Draw subtle background grid (finer)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        const gridSize = 20;
        
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    setStyle(options) {
        this.currentStyle = { ...this.currentStyle, ...options };
    }

    resetStyle() {
        this.currentStyle = { ...this.defaultStyle };
    }

    // =================================================================
    // EXECUTE JSON COMMANDS FROM LLM
    // =================================================================
    async executeCommands(commandsJson) {
        try {
            const data = typeof commandsJson === 'string' ? JSON.parse(commandsJson) : commandsJson;
            
            // Reset canvas
            this.steps = [];
            this.currentStep = 0;
            this.clear();
            
            if (data.steps) {
                // Step-by-step mode
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
                // Single diagram mode
                for (const cmd of data.commands) {
                    const drawCmd = this._parseCommand(cmd);
                    if (drawCmd) {
                        await drawCmd.draw(this.ctx, true);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error executing diagram commands:', error);
        }
    }

    _parseCommand(cmd) {
        const { tool, params, style } = cmd;
        
        if (style) {
            this.setStyle(style);
        }
        
        // Convert grid coordinates to pixels if provided
        const convertedParams = this._convertGridCoords(params);
        
        switch (tool) {
            case 'line':
                return this.drawLine(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, style);
            case 'ray':
                return this.drawRay(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, style);
            case 'lineSegment':
                return this.drawLineSegment(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, convertedParams.label, style);
            case 'arrow':
                return this.drawArrow(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, style);
            case 'doubleArrow':
                return this.drawDoubleArrow(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, style);
            case 'curve':
                return this.drawCurve(convertedParams.x1, convertedParams.y1, convertedParams.cx1, convertedParams.cy1, convertedParams.cx2, convertedParams.cy2, convertedParams.x2, convertedParams.y2, style);
            case 'quadraticCurve':
                return this.drawQuadraticCurve(convertedParams.x1, convertedParams.y1, convertedParams.cx, convertedParams.cy, convertedParams.x2, convertedParams.y2, style);
            case 'arc':
                return this.drawArc(convertedParams.x, convertedParams.y, convertedParams.radius, convertedParams.startAngle, convertedParams.endAngle, style);
            case 'circle':
                return this.drawCircle(convertedParams.x, convertedParams.y, convertedParams.radius, style);
            case 'ellipse':
                return this.drawEllipse(convertedParams.x, convertedParams.y, convertedParams.radiusX, convertedParams.radiusY, convertedParams.rotation, style);
            case 'rectangle':
                return this.drawRectangle(convertedParams.x, convertedParams.y, convertedParams.width, convertedParams.height, style);
            case 'roundedRect':
                return this.drawRoundedRect(convertedParams.x, convertedParams.y, convertedParams.width, convertedParams.height, convertedParams.radius, style);
            case 'polygon':
                return this.drawPolygon(convertedParams.points, style);
            case 'triangle':
                return this.drawTriangle(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, convertedParams.x3, convertedParams.y3, style);
            case 'text':
                return this.drawText(convertedParams.text, convertedParams.x, convertedParams.y, style);
            case 'label':
                return this.drawLabel(convertedParams.text, convertedParams.x, convertedParams.y, style);
            case 'point':
                return this.drawPoint(convertedParams.x, convertedParams.y, convertedParams.label, style);
            case 'dashedLine':
                return this.drawDashedLine(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, convertedParams.dashPattern, style);
            case 'dottedLine':
                return this.drawDottedLine(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, style);
            case 'angle':
                return this.drawAngle(convertedParams.x, convertedParams.y, convertedParams.radius, convertedParams.startAngle, convertedParams.endAngle, convertedParams.label, style);
            case 'rightAngle':
                return this.drawRightAngle(convertedParams.x, convertedParams.y, convertedParams.size, convertedParams.rotation, style);
            case 'dimension':
                return this.drawDimension(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, convertedParams.label, convertedParams.offset, style);
            case 'parallelMark':
                return this.drawParallelMark(convertedParams.x, convertedParams.y, convertedParams.angle, style);
            case 'tickMark':
                return this.drawTickMark(convertedParams.x, convertedParams.y, convertedParams.angle, convertedParams.count, style);
            case 'spring':
                return this.drawSpring(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, convertedParams.coils, style);
            case 'resistor':
                return this.drawResistor(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, style);
            case 'capacitor':
                return this.drawCapacitor(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, style);
            case 'ground':
                return this.drawGround(convertedParams.x, convertedParams.y, style);
            case 'battery':
                return this.drawBattery(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, style);
            case 'wave':
                return this.drawWave(convertedParams.x1, convertedParams.y1, convertedParams.x2, convertedParams.y2, convertedParams.wavelength, convertedParams.amplitude, style);
            case 'lens':
                return this.drawLens(convertedParams.x, convertedParams.y, convertedParams.height, convertedParams.type, style);
            case 'mirror':
                return this.drawMirror(convertedParams.x, convertedParams.y, convertedParams.height, convertedParams.type, style);
            default:
                console.warn(`Unknown tool: ${tool}`);
                return null;
        }
    }
    
    _convertGridCoords(params) {
        // Convert grid coordinates (gx, gy) to pixel coordinates (x, y)
        const converted = { ...params };
        
        // Convert single point
        if (params.gx !== undefined && params.gy !== undefined) {
            const pixel = this.toPixels(params.gx, params.gy);
            converted.x = pixel.x;
            converted.y = pixel.y;
        }
        
        // Convert pairs (x1,y1), (x2,y2)
        if (params.gx1 !== undefined && params.gy1 !== undefined) {
            const pixel1 = this.toPixels(params.gx1, params.gy1);
            converted.x1 = pixel1.x;
            converted.y1 = pixel1.y;
        }
        if (params.gx2 !== undefined && params.gy2 !== undefined) {
            const pixel2 = this.toPixels(params.gx2, params.gy2);
            converted.x2 = pixel2.x;
            converted.y2 = pixel2.y;
        }
        
        // Convert third point
        if (params.gx3 !== undefined && params.gy3 !== undefined) {
            const pixel3 = this.toPixels(params.gx3, params.gy3);
            converted.x3 = pixel3.x;
            converted.y3 = pixel3.y;
        }
        
        // Convert control points
        if (params.gcx !== undefined && params.gcy !== undefined) {
            const pixelC = this.toPixels(params.gcx, params.gcy);
            converted.cx = pixelC.x;
            converted.cy = pixelC.y;
        }
        if (params.gcx1 !== undefined && params.gcy1 !== undefined) {
            const pixelC1 = this.toPixels(params.gcx1, params.gcy1);
            converted.cx1 = pixelC1.x;
            converted.cy1 = pixelC1.y;
        }
        if (params.gcx2 !== undefined && params.gcy2 !== undefined) {
            const pixelC2 = this.toPixels(params.gcx2, params.gcy2);
            converted.cx2 = pixelC2.x;
            converted.cy2 = pixelC2.y;
        }
        
        // Convert radius from grid units to pixels
        if (params.radius !== undefined && params.gx !== undefined) {
            converted.radius = params.radius * this.grid.cellWidth;
        }
        
        // Convert width/height from grid units
        if (params.width !== undefined && converted.x !== undefined) {
            converted.width = params.width * this.grid.cellWidth;
        }
        if (params.height !== undefined && converted.y !== undefined) {
            converted.height = params.height * this.grid.cellHeight;
        }
        
        // Convert points array
        if (params.points && Array.isArray(params.points)) {
            converted.points = params.points.map(p => {
                if (p.gx !== undefined && p.gy !== undefined) {
                    return this.toPixels(p.gx, p.gy);
                }
                return p;
            });
        }
        
        return converted;
    }
}

// Export for use
window.DiagramCanvas = DiagramCanvas;
