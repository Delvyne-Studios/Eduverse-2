// =================================================================
// SVG DIAGRAM RENDERER - JSON to SVG Conversion
// Renders CBSE-style diagrams from structured JSON
// =================================================================

class SVGDiagramRenderer {
    constructor() {
        // Standard dimensions
        this.width = 600;
        this.height = 400;
        
        // Grid system (12 columns x 10 rows)
        this.gridCols = 12;
        this.gridRows = 10;
        this.cellWidth = this.width / this.gridCols;
        this.cellHeight = this.height / this.gridRows;
        
        // Standard color palette (consistent across all diagrams)
        this.colors = {
            primary: '#6366f1',
            secondary: '#ec4899',
            accent: '#8b5cf6',
            success: '#22c55e',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#06b6d4',
            white: '#ffffff',
            black: '#1a1a2e',
            gray: '#6b7280',
            lightGray: '#9ca3af',
            blue: '#3b82f6',
            red: '#ef4444',
            green: '#22c55e',
            orange: '#f97316',
            purple: '#a855f7',
            cyan: '#06b6d4',
            yellow: '#fbbf24',
            pink: '#ec4899'
        };
        
        // Standard styles for CBSE diagrams
        this.styles = {
            stroke: {
                width: 2,
                color: '#ffffff',
                linecap: 'round',
                linejoin: 'round'
            },
            text: {
                fontFamily: 'Inter, Arial, sans-serif',
                fontSize: 14,
                fill: '#ffffff',
                anchor: 'middle'
            },
            arrow: {
                size: 10,
                angle: 25
            },
            dashed: {
                dasharray: '8,4'
            },
            dotted: {
                dasharray: '2,4'
            }
        };
        
        // Anchor points for positioning
        this.anchors = {
            center: { x: 6, y: 5 },
            top: { x: 6, y: 1 },
            bottom: { x: 6, y: 9 },
            left: { x: 1, y: 5 },
            right: { x: 11, y: 5 },
            topLeft: { x: 1, y: 1 },
            topRight: { x: 11, y: 1 },
            bottomLeft: { x: 1, y: 9 },
            bottomRight: { x: 11, y: 9 }
        };
    }

    /**
     * Convert grid coordinates to pixel coordinates
     */
    toPixels(gridX, gridY) {
        return {
            x: gridX * this.cellWidth,
            y: gridY * this.cellHeight
        };
    }

    /**
     * Get position from anchor name or coordinates
     */
    getPosition(pos) {
        if (typeof pos === 'string' && this.anchors[pos]) {
            return this.toPixels(this.anchors[pos].x, this.anchors[pos].y);
        }
        if (typeof pos === 'object' && pos.x !== undefined && pos.y !== undefined) {
            return this.toPixels(pos.x, pos.y);
        }
        return { x: 0, y: 0 };
    }

    /**
     * Get color from palette or use direct value
     */
    getColor(colorName) {
        return this.colors[colorName] || colorName || this.colors.white;
    }

    /**
     * Render JSON diagram plan to SVG
     * @param {Object} plan - Diagram plan object
     * @returns {string} - SVG string
     */
    render(plan) {
        const elements = [];
        
        // Add defs for markers (arrows, etc.)
        elements.push(this.createDefs());
        
        // Add background
        elements.push(`<rect width="${this.width}" height="${this.height}" fill="#1a1a2e" rx="8"/>`);
        
        // Optional: Add grid
        if (plan.showGrid) {
            elements.push(this.createGrid());
        }
        
        // Render each element
        if (plan.elements && Array.isArray(plan.elements)) {
            for (const element of plan.elements) {
                const rendered = this.renderElement(element);
                if (rendered) elements.push(rendered);
            }
        }
        
        // Add title if present
        if (plan.title) {
            elements.push(`<text x="${this.width/2}" y="25" 
                fill="${this.colors.white}" 
                font-family="${this.styles.text.fontFamily}" 
                font-size="18" 
                font-weight="600" 
                text-anchor="middle">${this.escapeXml(plan.title)}</text>`);
        }
        
        return `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 ${this.width} ${this.height}" 
            width="${this.width}" height="${this.height}">
            ${elements.join('\n')}
        </svg>`;
    }

    /**
     * Create SVG defs for markers
     */
    createDefs() {
        return `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="${this.colors.white}"/>
            </marker>
            <marker id="arrowhead-primary" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="${this.colors.primary}"/>
            </marker>
            <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="${this.colors.red}"/>
            </marker>
            <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="${this.colors.blue}"/>
            </marker>
            <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="${this.colors.green}"/>
            </marker>
            <pattern id="diagonal-lines" patternUnits="userSpaceOnUse" width="8" height="8">
                <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="rgba(99,102,241,0.3)" stroke-width="1"/>
            </pattern>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>`;
    }

    /**
     * Create grid overlay
     */
    createGrid() {
        const lines = [];
        
        // Vertical lines
        for (let i = 0; i <= this.gridCols; i++) {
            const x = i * this.cellWidth;
            lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${this.height}" 
                stroke="rgba(99,102,241,0.1)" stroke-width="1"/>`);
        }
        
        // Horizontal lines
        for (let i = 0; i <= this.gridRows; i++) {
            const y = i * this.cellHeight;
            lines.push(`<line x1="0" y1="${y}" x2="${this.width}" y2="${y}" 
                stroke="rgba(99,102,241,0.1)" stroke-width="1"/>`);
        }
        
        return `<g class="grid">${lines.join('')}</g>`;
    }

    /**
     * Render a single element
     */
    renderElement(el) {
        switch (el.type) {
            case 'line': return this.renderLine(el);
            case 'arrow': return this.renderArrow(el);
            case 'ray': return this.renderRay(el);
            case 'circle': return this.renderCircle(el);
            case 'arc': return this.renderArc(el);
            case 'rectangle': return this.renderRectangle(el);
            case 'text': return this.renderText(el);
            case 'dashed-line': return this.renderDashedLine(el);
            case 'dotted-line': return this.renderDottedLine(el);
            case 'polygon': return this.renderPolygon(el);
            case 'ellipse': return this.renderEllipse(el);
            case 'path': return this.renderPath(el);
            case 'lens': return this.renderLens(el);
            case 'mirror': return this.renderMirror(el);
            case 'spring': return this.renderSpring(el);
            case 'wave': return this.renderWave(el);
            case 'capacitor': return this.renderCapacitor(el);
            case 'resistor': return this.renderResistor(el);
            case 'battery': return this.renderBattery(el);
            case 'label': return this.renderLabel(el);
            case 'group': return this.renderGroup(el);
            default:
                console.warn(`Unknown element type: ${el.type}`);
                return '';
        }
    }

    /**
     * Render a line
     */
    renderLine(el) {
        const from = this.getPosition(el.from);
        const to = this.getPosition(el.to);
        const color = this.getColor(el.color);
        const width = el.width || this.styles.stroke.width;
        
        return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" 
            stroke="${color}" stroke-width="${width}" 
            stroke-linecap="${this.styles.stroke.linecap}"/>`;
    }

    /**
     * Render an arrow
     */
    renderArrow(el) {
        const from = this.getPosition(el.from);
        const to = this.getPosition(el.to);
        const color = this.getColor(el.color);
        const width = el.width || this.styles.stroke.width;
        const markerColor = el.color || 'white';
        const markerId = this.colors[markerColor] ? `arrowhead-${markerColor}` : 'arrowhead';
        
        return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" 
            stroke="${color}" stroke-width="${width}" 
            stroke-linecap="${this.styles.stroke.linecap}"
            marker-end="url(#${markerId})"/>`;
    }

    /**
     * Render a ray (extends beyond endpoint)
     */
    renderRay(el) {
        const from = this.getPosition(el.from);
        const to = this.getPosition(el.to);
        const color = this.getColor(el.color);
        const width = el.width || this.styles.stroke.width;
        
        // Extend the ray beyond the endpoint
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const extend = el.extend || 50;
        const extendedTo = {
            x: to.x + (dx / length) * extend,
            y: to.y + (dy / length) * extend
        };
        
        return `<line x1="${from.x}" y1="${from.y}" x2="${extendedTo.x}" y2="${extendedTo.y}" 
            stroke="${color}" stroke-width="${width}" 
            stroke-linecap="${this.styles.stroke.linecap}"
            marker-end="url(#arrowhead)"/>`;
    }

    /**
     * Render a circle
     */
    renderCircle(el) {
        const center = this.getPosition(el.center);
        const radius = (el.radius || 1) * this.cellWidth;
        const color = this.getColor(el.color);
        const fillColor = el.fill ? this.getColor(el.fill) : 'none';
        const width = el.width || this.styles.stroke.width;
        
        return `<circle cx="${center.x}" cy="${center.y}" r="${radius}" 
            stroke="${color}" stroke-width="${width}" fill="${fillColor}"/>`;
    }

    /**
     * Render an arc
     */
    renderArc(el) {
        const center = this.getPosition(el.center);
        const radius = (el.radius || 1) * this.cellWidth;
        const startAngle = (el.startAngle || 0) * Math.PI / 180;
        const endAngle = (el.endAngle || 180) * Math.PI / 180;
        const color = this.getColor(el.color);
        const width = el.width || this.styles.stroke.width;
        
        const x1 = center.x + radius * Math.cos(startAngle);
        const y1 = center.y + radius * Math.sin(startAngle);
        const x2 = center.x + radius * Math.cos(endAngle);
        const y2 = center.y + radius * Math.sin(endAngle);
        
        const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
        
        return `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}" 
            stroke="${color}" stroke-width="${width}" fill="none"/>`;
    }

    /**
     * Render a rectangle
     */
    renderRectangle(el) {
        const pos = this.getPosition(el.position);
        const w = (el.width || 2) * this.cellWidth;
        const h = (el.height || 1) * this.cellHeight;
        const color = this.getColor(el.color);
        const fillColor = el.fill ? this.getColor(el.fill) : 'none';
        const strokeWidth = el.strokeWidth || this.styles.stroke.width;
        const rx = el.rounded ? 8 : 0;
        
        return `<rect x="${pos.x - w/2}" y="${pos.y - h/2}" 
            width="${w}" height="${h}" rx="${rx}"
            stroke="${color}" stroke-width="${strokeWidth}" fill="${fillColor}"/>`;
    }

    /**
     * Render text
     */
    renderText(el) {
        const pos = this.getPosition(el.position);
        const color = this.getColor(el.color);
        const fontSize = el.fontSize || this.styles.text.fontSize;
        const anchor = el.anchor || 'middle';
        const fontWeight = el.bold ? 'bold' : 'normal';
        const fontStyle = el.italic ? 'italic' : 'normal';
        
        // Handle subscript/superscript notation
        let text = el.text || '';
        text = this.processSubscripts(text);
        
        return `<text x="${pos.x}" y="${pos.y}" 
            fill="${color}" 
            font-family="${this.styles.text.fontFamily}" 
            font-size="${fontSize}" 
            font-weight="${fontWeight}"
            font-style="${fontStyle}"
            text-anchor="${anchor}" 
            dominant-baseline="middle">${this.escapeXml(text)}</text>`;
    }

    /**
     * Process subscript/superscript notation
     */
    processSubscripts(text) {
        // Convert _2 to subscript, ^2 to superscript
        const subscripts = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', 
                           '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', 
                           'n': 'ₙ', 'x': 'ₓ' };
        const superscripts = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
                              '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
                              '+': '⁺', '-': '⁻', 'n': 'ⁿ' };
        
        // Replace _X with subscript
        text = text.replace(/_(\d|n|x)/g, (_, char) => subscripts[char] || char);
        // Replace ^X with superscript
        text = text.replace(/\^(\d|\+|\-|n)/g, (_, char) => superscripts[char] || char);
        
        return text;
    }

    /**
     * Render dashed line
     */
    renderDashedLine(el) {
        const from = this.getPosition(el.from);
        const to = this.getPosition(el.to);
        const color = this.getColor(el.color);
        const width = el.width || this.styles.stroke.width;
        
        return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" 
            stroke="${color}" stroke-width="${width}" 
            stroke-dasharray="${this.styles.dashed.dasharray}"
            stroke-linecap="${this.styles.stroke.linecap}"/>`;
    }

    /**
     * Render dotted line
     */
    renderDottedLine(el) {
        const from = this.getPosition(el.from);
        const to = this.getPosition(el.to);
        const color = this.getColor(el.color);
        const width = el.width || this.styles.stroke.width;
        
        return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" 
            stroke="${color}" stroke-width="${width}" 
            stroke-dasharray="${this.styles.dotted.dasharray}"
            stroke-linecap="round"/>`;
    }

    /**
     * Render polygon
     */
    renderPolygon(el) {
        const points = (el.points || []).map(p => {
            const pos = this.getPosition(p);
            return `${pos.x},${pos.y}`;
        }).join(' ');
        
        const color = this.getColor(el.color);
        const fillColor = el.fill ? this.getColor(el.fill) : 'none';
        const width = el.width || this.styles.stroke.width;
        
        return `<polygon points="${points}" 
            stroke="${color}" stroke-width="${width}" fill="${fillColor}"/>`;
    }

    /**
     * Render ellipse
     */
    renderEllipse(el) {
        const center = this.getPosition(el.center);
        const rx = (el.radiusX || 1) * this.cellWidth;
        const ry = (el.radiusY || 0.5) * this.cellHeight;
        const color = this.getColor(el.color);
        const fillColor = el.fill ? this.getColor(el.fill) : 'none';
        const width = el.width || this.styles.stroke.width;
        
        return `<ellipse cx="${center.x}" cy="${center.y}" rx="${rx}" ry="${ry}" 
            stroke="${color}" stroke-width="${width}" fill="${fillColor}"/>`;
    }

    /**
     * Render custom SVG path
     */
    renderPath(el) {
        const color = this.getColor(el.color);
        const fillColor = el.fill ? this.getColor(el.fill) : 'none';
        const width = el.width || this.styles.stroke.width;
        
        return `<path d="${el.d}" 
            stroke="${color}" stroke-width="${width}" fill="${fillColor}"/>`;
    }

    /**
     * Render a convex/concave lens
     */
    renderLens(el) {
        const center = this.getPosition(el.center);
        const h = (el.height || 3) * this.cellHeight;
        const curvature = el.curvature || 20;
        const color = this.getColor(el.color);
        const fillColor = el.fill ? this.getColor(el.fill) : 'rgba(99,102,241,0.2)';
        
        if (el.convex !== false) {
            // Convex lens (default)
            return `<path d="M ${center.x} ${center.y - h/2} 
                Q ${center.x + curvature} ${center.y} ${center.x} ${center.y + h/2}
                Q ${center.x - curvature} ${center.y} ${center.x} ${center.y - h/2} Z"
                stroke="${color}" stroke-width="2" fill="${fillColor}"/>`;
        } else {
            // Concave lens
            return `<path d="M ${center.x - 5} ${center.y - h/2} 
                Q ${center.x + curvature/2} ${center.y} ${center.x - 5} ${center.y + h/2}
                L ${center.x + 5} ${center.y + h/2}
                Q ${center.x - curvature/2} ${center.y} ${center.x + 5} ${center.y - h/2} Z"
                stroke="${color}" stroke-width="2" fill="${fillColor}"/>`;
        }
    }

    /**
     * Render a curved mirror
     */
    renderMirror(el) {
        const center = this.getPosition(el.center);
        const h = (el.height || 3) * this.cellHeight;
        const curvature = el.curvature || 30;
        const color = this.getColor(el.color);
        const isConvex = el.convex;
        
        const curveDir = isConvex ? -1 : 1;
        
        return `<path d="M ${center.x} ${center.y - h/2} 
            Q ${center.x + curveDir * curvature} ${center.y} ${center.x} ${center.y + h/2}"
            stroke="${color}" stroke-width="3" fill="none"/>
            <line x1="${center.x}" y1="${center.y - h/2}" x2="${center.x - 8}" y2="${center.y - h/2 - 5}" 
                stroke="${color}" stroke-width="2"/>
            <line x1="${center.x}" y1="${center.y + h/2}" x2="${center.x - 8}" y2="${center.y + h/2 + 5}" 
                stroke="${color}" stroke-width="2"/>`;
    }

    /**
     * Render a spring
     */
    renderSpring(el) {
        const from = this.getPosition(el.from);
        const to = this.getPosition(el.to);
        const coils = el.coils || 6;
        const amplitude = el.amplitude || 10;
        const color = this.getColor(el.color);
        
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        let d = `M ${from.x} ${from.y}`;
        const coilLength = length / coils;
        
        for (let i = 0; i < coils; i++) {
            const x1 = from.x + (i + 0.25) * coilLength * Math.cos(angle) - amplitude * Math.sin(angle);
            const y1 = from.y + (i + 0.25) * coilLength * Math.sin(angle) + amplitude * Math.cos(angle);
            const x2 = from.x + (i + 0.75) * coilLength * Math.cos(angle) + amplitude * Math.sin(angle);
            const y2 = from.y + (i + 0.75) * coilLength * Math.sin(angle) - amplitude * Math.cos(angle);
            d += ` L ${x1} ${y1} L ${x2} ${y2}`;
        }
        d += ` L ${to.x} ${to.y}`;
        
        return `<path d="${d}" stroke="${color}" stroke-width="2" fill="none"/>`;
    }

    /**
     * Render a sine wave
     */
    renderWave(el) {
        const from = this.getPosition(el.from);
        const to = this.getPosition(el.to);
        const amplitude = (el.amplitude || 0.5) * this.cellHeight;
        const wavelength = (el.wavelength || 1) * this.cellWidth;
        const color = this.getColor(el.color);
        
        const dx = to.x - from.x;
        const points = [];
        
        for (let x = 0; x <= dx; x += 2) {
            const y = amplitude * Math.sin((2 * Math.PI * x) / wavelength);
            points.push(`${from.x + x},${from.y + y}`);
        }
        
        return `<polyline points="${points.join(' ')}" 
            stroke="${color}" stroke-width="2" fill="none"/>`;
    }

    /**
     * Render a capacitor symbol
     */
    renderCapacitor(el) {
        const center = this.getPosition(el.center);
        const size = (el.size || 0.5) * this.cellWidth;
        const color = this.getColor(el.color);
        
        return `<g>
            <line x1="${center.x - size}" y1="${center.y - size}" x2="${center.x - size}" y2="${center.y + size}" 
                stroke="${color}" stroke-width="2"/>
            <line x1="${center.x + size}" y1="${center.y - size}" x2="${center.x + size}" y2="${center.y + size}" 
                stroke="${color}" stroke-width="2"/>
        </g>`;
    }

    /**
     * Render a resistor symbol
     */
    renderResistor(el) {
        const center = this.getPosition(el.center);
        const w = (el.width || 1.5) * this.cellWidth;
        const h = (el.height || 0.4) * this.cellHeight;
        const color = this.getColor(el.color);
        
        return `<rect x="${center.x - w/2}" y="${center.y - h/2}" 
            width="${w}" height="${h}" 
            stroke="${color}" stroke-width="2" fill="none"/>`;
    }

    /**
     * Render a battery symbol
     */
    renderBattery(el) {
        const center = this.getPosition(el.center);
        const color = this.getColor(el.color);
        
        return `<g>
            <line x1="${center.x - 15}" y1="${center.y - 15}" x2="${center.x - 15}" y2="${center.y + 15}" 
                stroke="${color}" stroke-width="3"/>
            <line x1="${center.x + 15}" y1="${center.y - 8}" x2="${center.x + 15}" y2="${center.y + 8}" 
                stroke="${color}" stroke-width="2"/>
            <text x="${center.x - 20}" y="${center.y - 20}" fill="${color}" font-size="12">+</text>
            <text x="${center.x + 12}" y="${center.y - 12}" fill="${color}" font-size="12">−</text>
        </g>`;
    }

    /**
     * Render a label with background
     */
    renderLabel(el) {
        const pos = this.getPosition(el.position);
        const text = el.text || '';
        const color = this.getColor(el.color);
        const bgColor = el.background ? this.getColor(el.background) : 'rgba(0,0,0,0.7)';
        const fontSize = el.fontSize || 12;
        const padding = el.padding || 4;
        
        // Estimate text width
        const textWidth = text.length * fontSize * 0.6;
        
        return `<g>
            <rect x="${pos.x - textWidth/2 - padding}" y="${pos.y - fontSize/2 - padding}" 
                width="${textWidth + padding*2}" height="${fontSize + padding*2}" 
                rx="4" fill="${bgColor}"/>
            <text x="${pos.x}" y="${pos.y + 2}" 
                fill="${color}" 
                font-family="${this.styles.text.fontFamily}" 
                font-size="${fontSize}" 
                text-anchor="middle" 
                dominant-baseline="middle">${this.escapeXml(text)}</text>
        </g>`;
    }

    /**
     * Render a group of elements
     */
    renderGroup(el) {
        const elements = (el.elements || []).map(e => this.renderElement(e)).join('\n');
        const transform = el.transform || '';
        
        return `<g transform="${transform}">${elements}</g>`;
    }

    /**
     * Escape XML special characters
     */
    escapeXml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Create wrapper container for SVG
     */
    createContainer(svgId) {
        const wrapper = document.createElement('div');
        wrapper.className = 'svg-diagram-wrapper';
        wrapper.innerHTML = `
            <div class="svg-diagram-container" id="${svgId}"></div>
            <div class="svg-diagram-controls">
                <button class="svg-btn" onclick="window.svgDiagramRenderer.downloadSVG('${svgId}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
        return wrapper;
    }

    /**
     * Download SVG as file
     */
    downloadSVG(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Global instance
window.SVGDiagramRenderer = SVGDiagramRenderer;
window.svgDiagramRenderer = new SVGDiagramRenderer();
