// =================================================================
// PLOTLY GRAPH RENDERER - AI-Powered Python Code Execution
// Renders Plotly graphs from Python code in the browser
// =================================================================

class PlotlyRenderer {
    constructor() {
        this.defaultTheme = {
            paper_bgcolor: "#0E1117",
            plot_bgcolor: "#0E1117",
            font: {
                family: "Inter, Arial, sans-serif",
                color: "#C7C7C7"
            },
            title: {
                font: {
                    size: 20,
                    color: "#EAEAEA"
                }
            },
            xaxis: {
                gridcolor: "rgba(255,255,255,0.06)",
                zerolinecolor: "rgba(255,255,255,0.3)",
                tickfont: { color: "#C7C7C7" }
            },
            yaxis: {
                gridcolor: "rgba(255,255,255,0.06)",
                zerolinecolor: "rgba(255,255,255,0.3)",
                tickfont: { color: "#C7C7C7" }
            },
            legend: {
                bgcolor: "rgba(255,255,255,0.05)",
                bordercolor: "rgba(255,255,255,0.15)",
                borderwidth: 1,
                font: { color: "#E0E0E0" }
            },
            colorway: ["#6366f1", "#FFA657", "#7CFFB2", "#FF4C4C", "#00D4FF", "#ec4899"]
        };
    }

    /**
     * Extract Plotly figure data from Python code
     * @param {string} pythonCode - Python code containing Plotly figure
     * @returns {Object} - Plotly figure object
     */
    parsePythonToPlotly(pythonCode) {
        try {
            const figData = {
                data: [],
                layout: { ...this.defaultTheme }
            };

            // Parse traces (go.Scatter, go.Bar, etc.)
            const traceMatches = pythonCode.matchAll(/fig\.add_trace\s*\(\s*go\.(\w+)\s*\(([\s\S]*?)\)\s*\)/g);
            
            for (const match of traceMatches) {
                const traceType = match[1].toLowerCase();
                const traceArgs = match[2];
                const trace = this.parseTraceArgs(traceType, traceArgs);
                figData.data.push(trace);
            }

            // Parse layout updates
            const layoutMatch = pythonCode.match(/fig\.update_layout\s*\(([\s\S]*?)\)\s*(?=fig\.|$)/);
            if (layoutMatch) {
                const layoutUpdates = this.parseLayoutArgs(layoutMatch[1]);
                figData.layout = this.deepMerge(figData.layout, layoutUpdates);
            }

            // Extract title
            const titleMatch = pythonCode.match(/title\s*=\s*dict\s*\(\s*text\s*=\s*["']([^"']+)["']/);
            if (titleMatch) {
                figData.layout.title = {
                    text: titleMatch[1],
                    x: 0.02,
                    font: { size: 24, color: "#EAEAEA", family: "Inter, Arial" }
                };
            }

            return figData;
        } catch (error) {
            console.error('Error parsing Python to Plotly:', error);
            return null;
        }
    }

    /**
     * Parse trace arguments from Python code
     */
    parseTraceArgs(traceType, argsString) {
        const trace = { type: traceType === 'scatter' ? 'scatter' : traceType };

        // Parse x array
        const xMatch = argsString.match(/x\s*=\s*(\[[^\]]+\]|np\.[^,)]+|x(?!\w))/);
        if (xMatch) {
            trace.x = this.parseArrayValue(xMatch[1]);
        }

        // Parse y array
        const yMatch = argsString.match(/y\s*=\s*(\[[^\]]+\]|np\.[^,)]+|y\d?(?!\w))/);
        if (yMatch) {
            trace.y = this.parseArrayValue(yMatch[1]);
        }

        // Parse mode
        const modeMatch = argsString.match(/mode\s*=\s*["']([^"']+)["']/);
        if (modeMatch) {
            trace.mode = modeMatch[1];
        }

        // Parse name
        const nameMatch = argsString.match(/name\s*=\s*["']([^"']+)["']/);
        if (nameMatch) {
            trace.name = nameMatch[1];
        }

        // Parse line color
        const lineColorMatch = argsString.match(/line\s*=\s*dict\s*\([^)]*color\s*=\s*["']([^"']+)["']/);
        if (lineColorMatch) {
            trace.line = trace.line || {};
            trace.line.color = lineColorMatch[1];
        }

        // Parse line width
        const lineWidthMatch = argsString.match(/line\s*=\s*dict\s*\([^)]*width\s*=\s*(\d+)/);
        if (lineWidthMatch) {
            trace.line = trace.line || {};
            trace.line.width = parseInt(lineWidthMatch[1]);
        }

        // Parse fill
        const fillMatch = argsString.match(/fill\s*=\s*["']([^"']+)["']/);
        if (fillMatch) {
            trace.fill = fillMatch[1];
        }

        // Parse fillcolor
        const fillColorMatch = argsString.match(/fillcolor\s*=\s*["']([^"']+)["']/);
        if (fillColorMatch) {
            trace.fillcolor = fillColorMatch[1];
        }

        // Parse marker
        const markerSizeMatch = argsString.match(/marker\s*=\s*dict\s*\([^)]*size\s*=\s*(\d+)/);
        const markerColorMatch = argsString.match(/marker\s*=\s*dict\s*\([^)]*color\s*=\s*["']([^"']+)["']/);
        if (markerSizeMatch || markerColorMatch) {
            trace.marker = {};
            if (markerSizeMatch) trace.marker.size = parseInt(markerSizeMatch[1]);
            if (markerColorMatch) trace.marker.color = markerColorMatch[1];
        }

        // Parse text
        const textMatch = argsString.match(/text\s*=\s*\[["']([^"'\]]+)["']\]/);
        if (textMatch) {
            trace.text = [textMatch[1]];
        }

        // Parse textposition
        const textPosMatch = argsString.match(/textposition\s*=\s*["']([^"']+)["']/);
        if (textPosMatch) {
            trace.textposition = textPosMatch[1];
        }

        return trace;
    }

    /**
     * Parse layout arguments
     */
    parseLayoutArgs(argsString) {
        const layout = {};

        // Parse axis ranges
        const xRangeMatch = argsString.match(/xaxis\s*=\s*dict\s*\([^)]*range\s*=\s*\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]/);
        if (xRangeMatch) {
            layout.xaxis = layout.xaxis || {};
            layout.xaxis.range = [parseFloat(xRangeMatch[1]), parseFloat(xRangeMatch[2])];
        }

        const yRangeMatch = argsString.match(/yaxis\s*=\s*dict\s*\([^)]*range\s*=\s*\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]/);
        if (yRangeMatch) {
            layout.yaxis = layout.yaxis || {};
            layout.yaxis.range = [parseFloat(yRangeMatch[1]), parseFloat(yRangeMatch[2])];
        }

        // Parse axis titles
        const xTitleMatch = argsString.match(/xaxis\s*=\s*dict\s*\([^)]*title\s*=\s*dict\s*\([^)]*text\s*=\s*["']([^"']+)["']/);
        if (xTitleMatch) {
            layout.xaxis = layout.xaxis || {};
            layout.xaxis.title = { text: xTitleMatch[1], font: { size: 16, color: "#C7C7C7" } };
        }

        const yTitleMatch = argsString.match(/yaxis\s*=\s*dict\s*\([^)]*title\s*=\s*dict\s*\([^)]*text\s*=\s*["']([^"']+)["']/);
        if (yTitleMatch) {
            layout.yaxis = layout.yaxis || {};
            layout.yaxis.title = { text: yTitleMatch[1], font: { size: 16, color: "#C7C7C7" } };
        }

        // Parse dimensions
        const widthMatch = argsString.match(/width\s*=\s*(\d+)/);
        if (widthMatch) layout.width = parseInt(widthMatch[1]);

        const heightMatch = argsString.match(/height\s*=\s*(\d+)/);
        if (heightMatch) layout.height = parseInt(heightMatch[1]);

        return layout;
    }

    /**
     * Parse array values from Python syntax
     */
    parseArrayValue(value) {
        // Return sample data for numpy expressions
        if (value.includes('np.') || value === 'x' || /^y\d?$/.test(value)) {
            return this.generateSampleArray(50, 0, 10);
        }

        // Parse literal arrays
        try {
            const cleanValue = value.replace(/\s/g, '');
            const match = cleanValue.match(/\[([\d.,\-\s]+)\]/);
            if (match) {
                return match[1].split(',').map(v => parseFloat(v.trim()));
            }
        } catch (e) {
            console.error('Error parsing array:', e);
        }

        return [0, 1, 2, 3, 4, 5];
    }

    /**
     * Generate sample array for visualization
     */
    generateSampleArray(length, min, max) {
        const arr = [];
        for (let i = 0; i < length; i++) {
            arr.push(min + (max - min) * (i / (length - 1)));
        }
        return arr;
    }

    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    /**
     * Render Plotly graph in a container
     * @param {string} containerId - ID of the container element
     * @param {Object} figData - Plotly figure data object
     * @param {string} title - Graph title
     */
    render(container, figData, title = '') {
        try {
            // Apply consistent theme
            figData.layout = this.deepMerge(this.defaultTheme, figData.layout);
            
            // Override with standard dimensions for chat display
            figData.layout.width = 680;
            figData.layout.height = 450;
            figData.layout.margin = { l: 60, r: 30, t: 60, b: 50 };
            figData.layout.uirevision = "locked";

            // Create the plot
            Plotly.newPlot(container, figData.data, figData.layout, {
                responsive: true,
                displayModeBar: true,
                modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                displaylogo: false
            });

            return true;
        } catch (error) {
            console.error('Error rendering Plotly graph:', error);
            return false;
        }
    }

    /**
     * Create graph container with styling
     */
    createGraphContainer(graphId) {
        const wrapper = document.createElement('div');
        wrapper.className = 'plotly-graph-wrapper';
        wrapper.innerHTML = `
            <div class="plotly-graph-container" id="${graphId}"></div>
            <div class="plotly-graph-controls">
                <button class="plotly-btn" onclick="this.closest('.plotly-graph-wrapper').querySelector('.plotly-graph-container').requestFullscreen()">
                    <i class="fas fa-expand"></i> Fullscreen
                </button>
            </div>
        `;
        return wrapper;
    }
}

// Global instance
window.PlotlyRenderer = PlotlyRenderer;
window.plotlyRenderer = new PlotlyRenderer();
