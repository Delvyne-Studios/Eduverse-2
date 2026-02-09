// Tools Page Functionality

// Helper function to identify chapter using AI
async function identifyChapterWithAI(topic) {
    try {
        const chapterList = getChapterListForAI();
        const prompt = `You are an AI assistant helping with NCERT Class 11 studies.

Here is the COMPLETE list of available NCERT chapters:

${chapterList}

User wants to generate content for: "${topic}"

TASK: Analyze the topic and determine which SINGLE chapter is most relevant. Respond with ONLY the path shown in brackets (e.g., physics-part1/keph107.pdf).

If the topic relates to multiple chapters, choose the MOST relevant one.
If no specific chapter is needed (general topic), respond with: NONE

Your response (path only):`;

        const response = await fetch('/api/openrouter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'z-ai/glm-4.5-air:free',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 100
            })
        });

        if (!response.ok) return null;

        const data = await response.json();
        const aiDecision = data.choices[0].message.content.trim();
        
        console.log(`🤖 AI identified: ${aiDecision}`);
        
        if (aiDecision === 'NONE' || aiDecision.includes('NONE')) {
            return null;
        }

        const chapterPath = parseChapterSelection(aiDecision);
        if (!chapterPath) return null;

        const chapterData = await pdfReader.loadChapterFromPath(chapterPath);
        return chapterData;

    } catch (error) {
        console.error('Error identifying chapter:', error);
        return null;
    }
}

function openTool(toolId) {
    // Hide the tools grid
    document.getElementById('toolsGrid').style.display = 'none';
    
    // Show the selected tool
    const toolMap = {
        'unit-converter': 'unitConverterTool',
        'periodic-table': 'periodicTableTool',
        'log-table': 'logTableTool',
        'mock-test': 'mockTestTool',
        'cheat-sheet': 'cheatSheetTool',
        'mindmap': 'mindmapTool',
        'study-planner': 'studyPlannerTool',
        'ai-notes': 'aiNotesTool'
    };
    
    const toolElement = document.getElementById(toolMap[toolId]);
    if (toolElement) {
        toolElement.style.display = 'block';
        
        // Award XP for using tool
        if (window.gamification) {
            const toolNames = {
                'unit-converter': 'Unit Converter',
                'periodic-table': 'Periodic Table',
                'log-table': 'Log Calculator',
                'mock-test': 'Mock Test',
                'cheat-sheet': 'Cheat Sheet',
                'mindmap': 'Mind Map',
                'study-planner': 'Study Planner',
                'ai-notes': 'AI Notes'
            };
            window.gamification.addXP(5, `Used ${toolNames[toolId]}`);
        }
        
        // Initialize tools
        if (toolId === 'mindmap') {
            initMindmapMaker();
        } else if (toolId === 'unit-converter') {
            convertUnits(); // Initialize conversion
        } else if (toolId === 'log-table') {
            calculateLog(); // Initialize calculation
        }
    }
}

function closeTool() {
    // Hide all tool fullscreens
    document.querySelectorAll('.tool-fullscreen').forEach(tool => {
        tool.style.display = 'none';
    });
    
    // Show the tools grid again
    document.getElementById('toolsGrid').style.display = 'grid';
}

// =================================================================
// PERIODIC TABLE INTERACTIVITY
// =================================================================

const ELEMENT_DATA = {
    1: {name: 'Hydrogen', symbol: 'H', atomicMass: 1.008, electronConfig: '1s¹', category: 'Nonmetal', group: 1, period: 1, state: 'Gas'},
    2: {name: 'Helium', symbol: 'He', atomicMass: 4.003, electronConfig: '1s²', category: 'Noble Gas', group: 18, period: 1, state: 'Gas'},
    3: {name: 'Lithium', symbol: 'Li', atomicMass: 6.941, electronConfig: '[He] 2s¹', category: 'Alkali Metal', group: 1, period: 2, state: 'Solid'},
    4: {name: 'Beryllium', symbol: 'Be', atomicMass: 9.012, electronConfig: '[He] 2s²', category: 'Alkaline Earth', group: 2, period: 2, state: 'Solid'},
    5: {name: 'Boron', symbol: 'B', atomicMass: 10.81, electronConfig: '[He] 2s² 2p¹', category: 'Metalloid', group: 13, period: 2, state: 'Solid'},
    6: {name: 'Carbon', symbol: 'C', atomicMass: 12.01, electronConfig: '[He] 2s² 2p²', category: 'Nonmetal', group: 14, period: 2, state: 'Solid'},
    7: {name: 'Nitrogen', symbol: 'N', atomicMass: 14.01, electronConfig: '[He] 2s² 2p³', category: 'Nonmetal', group: 15, period: 2, state: 'Gas'},
    8: {name: 'Oxygen', symbol: 'O', atomicMass: 16.00, electronConfig: '[He] 2s² 2p⁴', category: 'Nonmetal', group: 16, period: 2, state: 'Gas'},
    9: {name: 'Fluorine', symbol: 'F', atomicMass: 19.00, electronConfig: '[He] 2s² 2p⁵', category: 'Halogen', group: 17, period: 2, state: 'Gas'},
    10: {name: 'Neon', symbol: 'Ne', atomicMass: 20.18, electronConfig: '[He] 2s² 2p⁶', category: 'Noble Gas', group: 18, period: 2, state: 'Gas'},
    11: {name: 'Sodium', symbol: 'Na', atomicMass: 22.99, electronConfig: '[Ne] 3s¹', category: 'Alkali Metal', group: 1, period: 3, state: 'Solid'},
    12: {name: 'Magnesium', symbol: 'Mg', atomicMass: 24.31, electronConfig: '[Ne] 3s²', category: 'Alkaline Earth', group: 2, period: 3, state: 'Solid'},
    13: {name: 'Aluminium', symbol: 'Al', atomicMass: 26.98, electronConfig: '[Ne] 3s² 3p¹', category: 'Post-transition Metal', group: 13, period: 3, state: 'Solid'},
    14: {name: 'Silicon', symbol: 'Si', atomicMass: 28.09, electronConfig: '[Ne] 3s² 3p²', category: 'Metalloid', group: 14, period: 3, state: 'Solid'},
    15: {name: 'Phosphorus', symbol: 'P', atomicMass: 30.97, electronConfig: '[Ne] 3s² 3p³', category: 'Nonmetal', group: 15, period: 3, state: 'Solid'},
    16: {name: 'Sulfur', symbol: 'S', atomicMass: 32.07, electronConfig: '[Ne] 3s² 3p⁴', category: 'Nonmetal', group: 16, period: 3, state: 'Solid'},
    17: {name: 'Chlorine', symbol: 'Cl', atomicMass: 35.45, electronConfig: '[Ne] 3s² 3p⁵', category: 'Halogen', group: 17, period: 3, state: 'Gas'},
    18: {name: 'Argon', symbol: 'Ar', atomicMass: 39.95, electronConfig: '[Ne] 3s² 3p⁶', category: 'Noble Gas', group: 18, period: 3, state: 'Gas'},
    19: {name: 'Potassium', symbol: 'K', atomicMass: 39.10, electronConfig: '[Ar] 4s¹', category: 'Alkali Metal', group: 1, period: 4, state: 'Solid'},
    20: {name: 'Calcium', symbol: 'Ca', atomicMass: 40.08, electronConfig: '[Ar] 4s²', category: 'Alkaline Earth', group: 2, period: 4, state: 'Solid'},
    21: {name: 'Scandium', symbol: 'Sc', atomicMass: 44.96, electronConfig: '[Ar] 3d¹ 4s²', category: 'Transition Metal', group: 3, period: 4, state: 'Solid'},
    22: {name: 'Titanium', symbol: 'Ti', atomicMass: 47.87, electronConfig: '[Ar] 3d² 4s²', category: 'Transition Metal', group: 4, period: 4, state: 'Solid'},
    23: {name: 'Vanadium', symbol: 'V', atomicMass: 50.94, electronConfig: '[Ar] 3d³ 4s²', category: 'Transition Metal', group: 5, period: 4, state: 'Solid'},
    24: {name: 'Chromium', symbol: 'Cr', atomicMass: 52.00, electronConfig: '[Ar] 3d⁵ 4s¹', category: 'Transition Metal', group: 6, period: 4, state: 'Solid'},
    25: {name: 'Manganese', symbol: 'Mn', atomicMass: 54.94, electronConfig: '[Ar] 3d⁵ 4s²', category: 'Transition Metal', group: 7, period: 4, state: 'Solid'},
    26: {name: 'Iron', symbol: 'Fe', atomicMass: 55.85, electronConfig: '[Ar] 3d⁶ 4s²', category: 'Transition Metal', group: 8, period: 4, state: 'Solid'},
    27: {name: 'Cobalt', symbol: 'Co', atomicMass: 58.93, electronConfig: '[Ar] 3d⁷ 4s²', category: 'Transition Metal', group: 9, period: 4, state: 'Solid'},
    28: {name: 'Nickel', symbol: 'Ni', atomicMass: 58.69, electronConfig: '[Ar] 3d⁸ 4s²', category: 'Transition Metal', group: 10, period: 4, state: 'Solid'},
    29: {name: 'Copper', symbol: 'Cu', atomicMass: 63.55, electronConfig: '[Ar] 3d¹⁰ 4s¹', category: 'Transition Metal', group: 11, period: 4, state: 'Solid'},
    30: {name: 'Zinc', symbol: 'Zn', atomicMass: 65.38, electronConfig: '[Ar] 3d¹⁰ 4s²', category: 'Transition Metal', group: 12, period: 4, state: 'Solid'}
};

// Initialize periodic table click handlers
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.element');
    elements.forEach(el => {
        el.addEventListener('click', () => {
            const atomicNum = parseInt(el.querySelector('.atomic-number').textContent);
            showElementDetails(atomicNum);
        });
    });
});

function showElementDetails(atomicNumber) {
    const data = ELEMENT_DATA[atomicNumber];
    if (!data) {
        showToast('Element data not available', 'info');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content glass-effect" style="max-width: 500px;">
            <div class="modal-header">
                <h2><i class="fas fa-atom"></i> ${data.name}</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="element-details" style="padding: var(--spacing-md);">
                    <div class="element-symbol-large" style="font-size: 4rem; font-weight: 700; text-align: center; color: var(--accent); margin-bottom: var(--spacing-md);">
                        ${data.symbol}
                    </div>
                    <div class="element-info" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                        <p><strong>Atomic Number:</strong> ${atomicNumber}</p>
                        <p><strong>Atomic Mass:</strong> ${data.atomicMass} u</p>
                        <p><strong>Electron Configuration:</strong> ${data.electronConfig}</p>
                        <p><strong>Category:</strong> ${data.category}</p>
                        <p><strong>Group:</strong> ${data.group}</p>
                        <p><strong>Period:</strong> ${data.period}</p>
                        <p><strong>State:</strong> ${data.state}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// =================================================================
// UNIT CONVERTER - Real-time conversion
// =================================================================

const unitConversions = {
    Length: {
        Meters: 1,
        Kilometers: 0.001,
        Miles: 0.000621371,
        Feet: 3.28084,
        Inches: 39.3701,
        Centimeters: 100,
        Millimeters: 1000
    },
    Mass: {
        Kilograms: 1,
        Grams: 1000,
        Milligrams: 1000000,
        Pounds: 2.20462,
        Ounces: 35.274,
        Tons: 0.001
    },
    Temperature: {
        Celsius: 'C',
        Fahrenheit: 'F',
        Kelvin: 'K'
    },
    Time: {
        Seconds: 1,
        Minutes: 0.0166667,
        Hours: 0.000277778,
        Days: 0.0000115741,
        Weeks: 0.00000165344,
        Years: 3.1689e-8
    }
};

function updateUnitConverter() {
    const type = document.getElementById('conversionType').value;
    const fromSelect = document.getElementById('fromUnit');
    const toSelect = document.getElementById('toUnit');
    
    // Clear existing options
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Add new options based on type
    const units = Object.keys(unitConversions[type] || {});
    units.forEach(unit => {
        fromSelect.innerHTML += `<option>${unit}</option>`;
        toSelect.innerHTML += `<option>${unit}</option>`;
    });
    
    // Set different default units
    if (units.length > 1) {
        toSelect.selectedIndex = 1;
    }
    
    convertUnits();
}

function convertUnits() {
    const input = parseFloat(document.getElementById('converterInput').value);
    const type = document.getElementById('conversionType').value;
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;
    const outputEl = document.getElementById('converterOutput');
    
    if (isNaN(input)) {
        outputEl.value = '';
        return;
    }
    
    if (type === 'Temperature') {
        outputEl.value = convertTemperature(input, fromUnit, toUnit).toFixed(2);
    } else {
        const conversions = unitConversions[type];
        if (!conversions) return;
        
        // Convert to base unit first, then to target unit
        const inBaseUnit = input / conversions[fromUnit];
        const result = inBaseUnit * conversions[toUnit];
        outputEl.value = result.toFixed(6);
    }
}

function convertTemperature(value, from, to) {
    // Convert to Celsius first
    let celsius = value;
    if (from === 'Fahrenheit') celsius = (value - 32) * 5/9;
    else if (from === 'Kelvin') celsius = value - 273.15;
    
    // Convert from Celsius to target
    if (to === 'Celsius') return celsius;
    if (to === 'Fahrenheit') return (celsius * 9/5) + 32;
    if (to === 'Kelvin') return celsius + 273.15;
    
    return value;
}

// =================================================================
// LOGARITHM CALCULATOR - Real-time calculation
// =================================================================

function calculateLog() {
    const input = parseFloat(document.getElementById('logInput').value);
    const type = document.getElementById('logType').value;
    const resultEl = document.getElementById('logResult');
    
    if (isNaN(input) || input <= 0) {
        resultEl.innerHTML = '<p style="color: var(--text-tertiary);">Enter a positive number</p>';
        return;
    }
    
    let result;
    let displayType;
    
    if (type.includes('log₁₀')) {
        result = Math.log10(input);
        displayType = 'log₁₀';
    } else if (type.includes('ln')) {
        result = Math.log(input);
        displayType = 'ln';
    } else if (type.includes('log₂')) {
        result = Math.log2(input);
        displayType = 'log₂';
    }
    
    resultEl.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: var(--accent); margin-bottom: var(--spacing-sm);">${result.toFixed(8)}</h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">${displayType}(${input}) = ${result.toFixed(8)}</p>
            <p style="color: var(--text-tertiary); font-size: 0.85rem; margin-top: var(--spacing-sm);">
                Antilog: ${displayType === 'ln' ? 'e' : (displayType === 'log₂' ? '2' : '10')}<sup>${result.toFixed(4)}</sup> = ${input}
            </p>
        </div>
    `;
}

// =================================================================
// MINDMAP MAKER - Full Canvas Implementation
// =================================================================

let mindmapState = {
    nodes: [],
    edges: [],
    selectedNode: null,
    currentMindmapId: null,
    currentMindmapName: '',
    isDragging: false,
    dragNode: null,
    dragOffset: { x: 0, y: 0 },
    canvas: null,
    ctx: null,
    initialized: false
};

const LEVEL_COLORS = {
    0: { bg: '#e3f2fd', border: '#2196F3', text: '#1565c0' },  // Root - Blue
    1: { bg: '#c8e6c9', border: '#4CAF50', text: '#2e7d32' },  // Branch - Green
    2: { bg: '#fff3e0', border: '#FF9800', text: '#e65100' },  // Sub - Orange
    3: { bg: '#fff9c4', border: '#FFC107', text: '#f57f17' }   // Detail - Yellow
};

function initMindmapMaker() {
    if (mindmapState.initialized) {
        renderMindmap();
        return;
    }
    
    const container = document.getElementById('mindmapCanvasContainer');
    const canvas = document.getElementById('mindmapCanvas');
    
    if (!canvas || !container) return;
    
    // Set canvas size
    resizeMindmapCanvas();
    
    mindmapState.canvas = canvas;
    mindmapState.ctx = canvas.getContext('2d');
    
    // Load saved mindmaps
    loadSavedMindmaps();
    
    // Add event listeners
    container.addEventListener('mousedown', handleMindmapMouseDown);
    container.addEventListener('mousemove', handleMindmapMouseMove);
    container.addEventListener('mouseup', handleMindmapMouseUp);
    container.addEventListener('dblclick', handleMindmapDblClick);
    
    // Handle resize
    window.addEventListener('resize', resizeMindmapCanvas);
    
    // Node text input enter key
    const nodeInput = document.getElementById('nodeTextInput');
    if (nodeInput) {
        nodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const level = mindmapState.selectedNode ? mindmapState.selectedNode.level + 1 : 0;
                addMindmapNode(Math.min(level, 3));
            }
        });
    }
    
    mindmapState.initialized = true;
    renderMindmap();
}

function resizeMindmapCanvas() {
    const container = document.getElementById('mindmapCanvasContainer');
    const canvas = document.getElementById('mindmapCanvas');
    if (!container || !canvas) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    if (mindmapState.ctx) {
        renderMindmap();
    }
}

function calculateNodeSize(text, isDetail = false) {
    const minWidth = 100;
    const maxWidth = isDetail ? 280 : 200;
    const charWidth = 8;
    const padding = 30;
    
    let width = Math.min(maxWidth, Math.max(minWidth, text.length * charWidth + padding));
    
    const charsPerLine = Math.floor((width - padding) / charWidth);
    const numLines = Math.ceil(text.length / charsPerLine);
    const lineHeight = 20;
    const verticalPadding = 20;
    let height = Math.max(40, (numLines * lineHeight) + verticalPadding);
    
    return { width, height };
}

function addMindmapNode(level) {
    const input = document.getElementById('nodeTextInput');
    const text = input.value.trim();
    
    if (!text) {
        showToast('Please enter node text', 'error');
        return;
    }
    
    // Validation for levels
    if (level > 0 && !mindmapState.selectedNode) {
        showToast('Select a parent node first', 'error');
        return;
    }
    
    if (level > 0 && mindmapState.selectedNode.level !== level - 1) {
        showToast(`Select a Level ${level - 1} node to add Level ${level}`, 'error');
        return;
    }
    
    const { width, height } = calculateNodeSize(text, level === 3);
    const colors = LEVEL_COLORS[level];
    
    // Calculate position
    let x, y;
    if (level === 0) {
        // Root node - center
        const container = document.getElementById('mindmapCanvasContainer');
        x = (container.clientWidth / 2) - (width / 2);
        y = 60;
    } else {
        // Position relative to parent
        const parent = mindmapState.selectedNode;
        const siblings = mindmapState.nodes.filter(n => n.parentId === parent.id);
        const siblingIndex = siblings.length;
        
        const spacing = 180;
        const totalWidth = siblingIndex * spacing;
        x = parent.x + (parent.width / 2) - (width / 2) + (siblingIndex - siblings.length / 2) * spacing;
        y = parent.y + parent.height + 60 + (level * 20);
    }
    
    const newNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: text,
        level: level,
        parentId: level > 0 ? mindmapState.selectedNode.id : null,
        x: x,
        y: y,
        width: width,
        height: height,
        colors: colors
    };
    
    mindmapState.nodes.push(newNode);
    
    // Create edge if not root
    if (level > 0) {
        mindmapState.edges.push({
            id: `edge_${Date.now()}`,
            source: mindmapState.selectedNode.id,
            target: newNode.id
        });
    }
    
    input.value = '';
    renderMindmap();
    updateEmptyState();
}

function deleteMindmapNode() {
    if (!mindmapState.selectedNode) {
        showToast('Select a node to delete', 'error');
        return;
    }
    
    const nodeId = mindmapState.selectedNode.id;
    
    // Get all descendant nodes
    const getDescendants = (id) => {
        const children = mindmapState.nodes.filter(n => n.parentId === id);
        let descendants = [...children];
        children.forEach(child => {
            descendants = [...descendants, ...getDescendants(child.id)];
        });
        return descendants;
    };
    
    const descendants = getDescendants(nodeId);
    const nodesToDelete = [nodeId, ...descendants.map(n => n.id)];
    
    // Remove nodes and edges
    mindmapState.nodes = mindmapState.nodes.filter(n => !nodesToDelete.includes(n.id));
    mindmapState.edges = mindmapState.edges.filter(e => 
        !nodesToDelete.includes(e.source) && !nodesToDelete.includes(e.target)
    );
    
    mindmapState.selectedNode = null;
    updateSelectionInfo();
    renderMindmap();
    updateEmptyState();
}

function renderMindmap() {
    const canvas = mindmapState.canvas;
    const ctx = mindmapState.ctx;
    const nodesContainer = document.getElementById('mindmapNodes');
    
    if (!canvas || !ctx || !nodesContainer) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    
    mindmapState.edges.forEach(edge => {
        const sourceNode = mindmapState.nodes.find(n => n.id === edge.source);
        const targetNode = mindmapState.nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
            const startX = sourceNode.x + sourceNode.width / 2;
            const startY = sourceNode.y + sourceNode.height;
            const endX = targetNode.x + targetNode.width / 2;
            const endY = targetNode.y;
            
            // Draw curved line
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            const midY = (startY + endY) / 2;
            ctx.bezierCurveTo(startX, midY, endX, midY, endX, endY);
            
            ctx.strokeStyle = targetNode.colors.border;
            ctx.stroke();
        }
    });
    
    // Render nodes as HTML elements
    nodesContainer.innerHTML = '';
    
    mindmapState.nodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = `mindmap-node level-${node.level}${mindmapState.selectedNode?.id === node.id ? ' selected' : ''}`;
        nodeEl.dataset.nodeId = node.id;
        nodeEl.style.cssText = `
            left: ${node.x}px;
            top: ${node.y}px;
            width: ${node.width}px;
            min-height: ${node.height}px;
            background: ${node.colors.bg};
            border: 2px solid ${node.colors.border};
            color: ${node.colors.text};
        `;
        nodeEl.innerHTML = `<span class="node-text">${node.text}</span>`;
        
        nodesContainer.appendChild(nodeEl);
    });
}

function handleMindmapMouseDown(e) {
    const nodeEl = e.target.closest('.mindmap-node');
    
    if (nodeEl) {
        const nodeId = nodeEl.dataset.nodeId;
        const node = mindmapState.nodes.find(n => n.id === nodeId);
        
        if (node) {
            mindmapState.selectedNode = node;
            mindmapState.isDragging = true;
            mindmapState.dragNode = node;
            
            const rect = nodeEl.getBoundingClientRect();
            mindmapState.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            updateSelectionInfo();
            renderMindmap();
        }
    } else {
        mindmapState.selectedNode = null;
        updateSelectionInfo();
        renderMindmap();
    }
}

function handleMindmapMouseMove(e) {
    if (mindmapState.isDragging && mindmapState.dragNode) {
        const container = document.getElementById('mindmapCanvasContainer');
        const rect = container.getBoundingClientRect();
        
        mindmapState.dragNode.x = e.clientX - rect.left - mindmapState.dragOffset.x;
        mindmapState.dragNode.y = e.clientY - rect.top - mindmapState.dragOffset.y;
        
        // Keep within bounds
        mindmapState.dragNode.x = Math.max(0, Math.min(container.clientWidth - mindmapState.dragNode.width, mindmapState.dragNode.x));
        mindmapState.dragNode.y = Math.max(0, Math.min(container.clientHeight - mindmapState.dragNode.height, mindmapState.dragNode.y));
        
        renderMindmap();
    }
}

function handleMindmapMouseUp(e) {
    mindmapState.isDragging = false;
    mindmapState.dragNode = null;
}

function handleMindmapDblClick(e) {
    const nodeEl = e.target.closest('.mindmap-node');
    
    if (nodeEl) {
        const nodeId = nodeEl.dataset.nodeId;
        const node = mindmapState.nodes.find(n => n.id === nodeId);
        
        if (node) {
            const newText = prompt('Edit node text:', node.text);
            if (newText && newText.trim()) {
                node.text = newText.trim();
                const { width, height } = calculateNodeSize(node.text, node.level === 3);
                node.width = width;
                node.height = height;
                renderMindmap();
            }
        }
    }
}

function updateSelectionInfo() {
    const infoEl = document.getElementById('selectionInfo');
    if (!infoEl) return;
    
    if (mindmapState.selectedNode) {
        const levelNames = ['Root', 'Branch', 'Sub-Branch', 'Detail'];
        infoEl.innerHTML = `<span class="selected-label">Selected:</span> ${mindmapState.selectedNode.text.substring(0, 30)}${mindmapState.selectedNode.text.length > 30 ? '...' : ''} <span class="level-badge level-${mindmapState.selectedNode.level}">${levelNames[mindmapState.selectedNode.level]}</span>`;
    } else {
        infoEl.innerHTML = '<span>No node selected</span>';
    }
}

function updateEmptyState() {
    const emptyState = document.getElementById('canvasEmptyState');
    if (emptyState) {
        emptyState.style.display = mindmapState.nodes.length === 0 ? 'flex' : 'none';
    }
}

function saveMindmap() {
    if (mindmapState.nodes.length === 0) {
        showToast('Cannot save empty mindmap', 'error');
        return;
    }
    
    const nameInput = document.getElementById('mindmapNameInput');
    let name = nameInput.value.trim() || mindmapState.currentMindmapName;
    
    if (!name) {
        name = prompt('Enter mindmap name:');
        if (!name || !name.trim()) return;
        name = name.trim();
    }
    
    const savedMindmaps = JSON.parse(localStorage.getItem('eduverse_mindmaps') || '[]');
    
    const mindmap = {
        id: mindmapState.currentMindmapId || `mindmap_${Date.now()}`,
        name: name,
        nodes: mindmapState.nodes,
        edges: mindmapState.edges,
        updatedAt: new Date().toISOString()
    };
    
    // Update or add
    const existingIndex = savedMindmaps.findIndex(m => m.id === mindmap.id);
    if (existingIndex >= 0) {
        savedMindmaps[existingIndex] = mindmap;
    } else {
        savedMindmaps.unshift(mindmap);
    }
    
    localStorage.setItem('eduverse_mindmaps', JSON.stringify(savedMindmaps));
    
    mindmapState.currentMindmapId = mindmap.id;
    mindmapState.currentMindmapName = name;
    nameInput.value = name;
    
    loadSavedMindmaps();
    showToast('Mindmap saved!', 'success');
}

function loadSavedMindmaps() {
    const savedMindmaps = JSON.parse(localStorage.getItem('eduverse_mindmaps') || '[]');
    const listEl = document.getElementById('savedMindmapsList');
    const countEl = document.getElementById('mindmapCount');
    
    if (!listEl) return;
    
    if (countEl) countEl.textContent = savedMindmaps.length;
    
    if (savedMindmaps.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No saved mindmaps yet</p>';
        return;
    }
    
    listEl.innerHTML = savedMindmaps.map(m => `
        <div class="saved-mindmap-item" onclick="loadMindmapById('${m.id}')">
            <div class="mindmap-item-info">
                <span class="mindmap-name">${m.name}</span>
                <span class="mindmap-meta">${m.nodes.length} nodes</span>
            </div>
            <button class="btn-delete-mindmap" onclick="event.stopPropagation(); deleteSavedMindmap('${m.id}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function loadMindmapById(id) {
    const savedMindmaps = JSON.parse(localStorage.getItem('eduverse_mindmaps') || '[]');
    const mindmap = savedMindmaps.find(m => m.id === id);
    
    if (mindmap) {
        mindmapState.nodes = mindmap.nodes;
        mindmapState.edges = mindmap.edges;
        mindmapState.currentMindmapId = mindmap.id;
        mindmapState.currentMindmapName = mindmap.name;
        mindmapState.selectedNode = null;
        
        const nameInput = document.getElementById('mindmapNameInput');
        if (nameInput) nameInput.value = mindmap.name;
        
        updateSelectionInfo();
        renderMindmap();
        updateEmptyState();
        showToast(`Loaded: ${mindmap.name}`, 'success');
    }
}

function deleteSavedMindmap(id) {
    if (!confirm('Delete this mindmap?')) return;
    
    let savedMindmaps = JSON.parse(localStorage.getItem('eduverse_mindmaps') || '[]');
    savedMindmaps = savedMindmaps.filter(m => m.id !== id);
    localStorage.setItem('eduverse_mindmaps', JSON.stringify(savedMindmaps));
    
    if (mindmapState.currentMindmapId === id) {
        clearMindmap(true);
    }
    
    loadSavedMindmaps();
    showToast('Mindmap deleted', 'success');
}

function clearMindmap(skipConfirm = false) {
    if (!skipConfirm && mindmapState.nodes.length > 0) {
        if (!confirm('Clear the entire mindmap?')) return;
    }
    
    mindmapState.nodes = [];
    mindmapState.edges = [];
    mindmapState.selectedNode = null;
    mindmapState.currentMindmapId = null;
    mindmapState.currentMindmapName = '';
    
    const nameInput = document.getElementById('mindmapNameInput');
    if (nameInput) nameInput.value = '';
    
    updateSelectionInfo();
    renderMindmap();
    updateEmptyState();
}

// =================================================================
// CHEAT SHEET GENERATOR
// =================================================================

// Use the same API configuration as chat assistant (secure proxy)
const API_CONFIG = {
    url: '/api/openrouter',
    model: 'z-ai/glm-4.5-air:free'
};

async function generateCheatSheet() {
    const topicInput = document.getElementById('cheatSheetTopic');
    const contentEl = document.getElementById('cheatSheetContent');
    const generateBtn = document.getElementById('generateCheatBtn');
    
    const topic = topicInput.value.trim();
    if (!topic) {
        showToast('Please enter a topic', 'error');
        return;
    }
    
    // Disable button to prevent multiple clicks
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.6';
    }
    
    contentEl.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> 🤖 Asking AI to identify chapter...</div>';
    
    // Ask AI to identify and load chapter
    let chapterContext = null;
    try {
        chapterContext = await identifyChapterWithAI(topic);
        if (chapterContext) {
            contentEl.innerHTML = `<div class="loading-state"><i class="fas fa-book-open"></i> 📖 Loaded: ${chapterContext.info.chapter}<br><i class="fas fa-spinner fa-spin"></i> Generating cheat sheet...</div>`;
        } else {
            contentEl.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Generating cheat sheet...</div>';
        }
    } catch (error) {
        console.warn('Could not load chapter context:', error);
        contentEl.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Generating cheat sheet...</div>';
    }
    
    const systemPrompt = `You are a top-grade Class 11 CBSE NCERT formula generator. Your task is to generate ALL formulas, laws, and important equations related to the topic.

STRICT RULES:
1. Stick ONLY to NCERT content - no external sources
2. Include EVERY formula mentioned in NCERT for this topic
3. If asked for a whole chapter, cover EVERYTHING
${chapterContext ? `\n4. YOU HAVE THE COMPLETE NCERT CHAPTER! Use it as your primary source.\n\n=== CHAPTER CONTENT ===\n${chapterContext.text.slice(0, 50000)}\n\n` : ''}

FORMAT REQUIREMENTS (VERY IMPORTANT):
1. Start with a KEY/LEGEND section listing all variables used:
   - v = velocity
   - V = volume  
   - a = acceleration
   - etc.

2. For DIVISION: Use a horizontal line (fraction bar), NOT "/"
   Example:
        Distance
   v = ─────────
         Time

3. Organize formulas by subtopic/concept

4. For each formula:
   - State the formula clearly
   - Mention when to use it
   - If multiple formulas exist for the same quantity, explain when to use each

5. Include ALL laws with their:
   - Statement
   - Mathematical expression
   - Conditions/Applications

6. Use proper symbols:
   - Greek letters: α, β, γ, δ, θ, λ, μ, ρ, σ, ω, Δ
   - Subscripts: v₁, v₂, T₁, T₂
   - Superscripts: x², x³
   - Arrows: →, ⇌, ↔

7. Formatting:
   - Leave blank lines between sections
   - Use clear headings
   - Bullet points for lists
   - Box or highlight important formulas

EXAMPLE FORMAT:
═══════════════════════════════════════
📘 TOPIC: [Topic Name]
═══════════════════════════════════════

📋 KEY (Variables Used):
───────────────────────
• v = velocity (m/s)
• s = displacement (m)
• t = time (s)
• a = acceleration (m/s²)

═══════════════════════════════════════
📌 SUBTOPIC 1: [Name]
═══════════════════════════════════════

Formula 1: [Name]
┌─────────────────┐
│      s          │
│  v = ───        │
│      t          │
└─────────────────┘
Use when: [explanation]

... and so on

Remember: Include EVERYTHING from NCERT. Be comprehensive.`;

    try {
        // Build user message with chapter context if available
        let userMessage = `Generate a complete formula cheat sheet for: ${topic}. Include ALL formulas, ALL laws, and their applications from NCERT Class 11.`;
        
        if (chapterContext) {
            userMessage += `\n\n📖 COMPLETE NCERT CHAPTER PROVIDED:\n**${chapterContext.info.subject}${chapterContext.info.part} - ${chapterContext.info.chapter}**\n\nFull Chapter Content:\n${chapterContext.text}\n\n⚠️ Use the above chapter as your PRIMARY source. Extract ALL formulas, laws, and important equations from it.`;
        }
        
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error:', response.status, errorData);
            throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        contentEl.innerHTML = `<div class="cheatsheet-content">${formatCheatSheet(content)}</div>`;
        
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
        }
        
    } catch (error) {
        console.error('Cheat sheet error:', error);
        contentEl.innerHTML = '<p class="error-state"><i class="fas fa-exclamation-circle"></i> Failed to generate. Please try again.</p>';
        
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
        }
    }
}

function formatCheatSheet(text) {
    let formatted = text
        .replace(/═+/g, '<hr class="section-divider">')
        .replace(/─+/g, '<hr class="subsection-divider">')
        .replace(/📘|📋|📌|📝|⚡|💡/g, match => `<span class="emoji">${match}</span>`)
        .replace(/\n/g, '<br>')
        .replace(/┌[─┐]+/g, '<div class="formula-box">')
        .replace(/└[─┘]+/g, '</div>')
        .replace(/│/g, '')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/•/g, '<span class="bullet">•</span>');
    
    return formatted;
}

// =================================================================
// MOCK TEST GENERATOR
// =================================================================

let mockTestData = {
    questions: [],
    startTime: null,
    timerInterval: null
};

async function generateMockTest() {
    const topic = document.getElementById('mockTestTopic').value.trim();
    const count = parseInt(document.getElementById('mockTestCount').value) || 10;
    const difficulty = document.getElementById('mockTestDifficulty').value;
    
    const includeMCQ = document.getElementById('mockMCQ').checked;
    const includeShort = document.getElementById('mockShort').checked;
    const includeLong = document.getElementById('mockLong').checked;
    const includeNumerical = document.getElementById('mockNumerical').checked;
    
    if (!topic) {
        showToast('Please enter a topic', 'error');
        return;
    }
    
    const questionTypes = [];
    if (includeMCQ) questionTypes.push('MCQ (Multiple Choice)');
    if (includeShort) questionTypes.push('Short Answer (2-3 marks)');
    if (includeLong) questionTypes.push('Long Answer (5 marks)');
    if (includeNumerical) questionTypes.push('Numerical Problems');
    
    if (questionTypes.length === 0) {
        showToast('Select at least one question type', 'error');
        return;
    }
    
    document.getElementById('mockTestConfig').style.display = 'none';
    document.getElementById('mockTestContent').style.display = 'block';
    document.getElementById('mockTestQuestions').innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> 🤖 Asking AI to identify chapter...</div>';
    
    // Ask AI to identify and load chapter
    let chapterContext = null;
    try {
        chapterContext = await identifyChapterWithAI(topic);
        if (chapterContext) {
            document.getElementById('mockTestQuestions').innerHTML = `<div class="loading-state"><i class="fas fa-book-open"></i> 📖 Loaded: ${chapterContext.info.chapter}<br><i class="fas fa-spinner fa-spin"></i> Generating questions...</div>`;
        } else {
            document.getElementById('mockTestQuestions').innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Generating questions...</div>';
        }
    } catch (error) {
        console.warn('Could not load chapter context:', error);
        document.getElementById('mockTestQuestions').innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Generating questions...</div>';
    }
    
    const systemPrompt = `You are an expert CBSE Class 11 examiner creating mock tests. Generate questions that exactly match CBSE board exam and NCERT pattern.

RULES:
1. Questions MUST be from NCERT Class 11 syllabus only
2. Match the exact style of CBSE board questions
3. Include a good mix of conceptual and application-based questions
4. For numerical problems, use realistic values
${chapterContext ? `5. YOU HAVE THE COMPLETE NCERT CHAPTER! Base questions directly on it.\n\n=== CHAPTER CONTENT ===\n${chapterContext.text.slice(0, 50000)}\n\n` : ''}

DIFFICULTY LEVELS:
- Easy: Direct NCERT questions, basic definitions, simple formulas
- Medium: Board exam level, application of concepts, moderate numericals
- Hard: JEE/NEET level, tricky concepts, complex problems, multi-step numericals
- Mixed: Combination of all levels

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "Mock Test: [Topic]",
  "questions": [
    {
      "id": 1,
      "type": "MCQ",
      "question": "Question text here",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "answer": "B",
      "explanation": "Brief explanation of correct answer",
      "marks": 1
    },
    {
      "id": 2,
      "type": "Short",
      "question": "Question text here",
      "answer": "Model answer here",
      "marks": 2
    },
    {
      "id": 3,
      "type": "Numerical",
      "question": "Problem statement with given values",
      "answer": "Step-by-step solution",
      "marks": 3
    }
  ]
}

Include proper formatting:
- Use subscripts: H₂O, CO₂
- Use proper symbols: →, ⇌, ×, ÷
- For fractions, show numerator over denominator clearly`;

    try {
        // Build user message with chapter context if available
        let userMessage = `Generate a mock test for Class 11 CBSE on: ${topic}
Number of questions: ${count}
Difficulty: ${difficulty}
Question types to include: ${questionTypes.join(', ')}

Make sure questions are exam-oriented and follow NCERT pattern exactly.`;
        
        if (chapterContext) {
            userMessage += `\n\n📖 COMPLETE NCERT CHAPTER PROVIDED:\n**${chapterContext.info.subject}${chapterContext.info.part} - ${chapterContext.info.chapter}**\n\nFull Chapter Content:\n${chapterContext.text}\n\n⚠️ Use the above chapter as your PRIMARY source. Generate questions directly from this NCERT content.`;
        }
        
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error:', response.status, errorData);
            throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        let content = data.choices[0].message.content;
        
        // Extract JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid response format');
        
        const testData = JSON.parse(jsonMatch[0]);
        mockTestData.questions = testData.questions;
        
        document.getElementById('mockTestTitle').textContent = testData.title || `Mock Test: ${topic}`;
        
        // Render questions
        renderMockTestQuestions();
        
        // Start timer
        startMockTestTimer();
        
    } catch (error) {
        console.error('Mock test error:', error);
        document.getElementById('mockTestQuestions').innerHTML = '<p class="error-state"><i class="fas fa-exclamation-circle"></i> Failed to generate test. Please try again.</p>';
    }
}

function renderMockTestQuestions() {
    const container = document.getElementById('mockTestQuestions');
    
    container.innerHTML = mockTestData.questions.map((q, index) => {
        let questionHTML = `
            <div class="test-question" data-qid="${q.id}">
                <div class="question-header">
                    <span class="question-number">Q${index + 1}</span>
                    <span class="question-type">${q.type}</span>
                    <span class="question-marks">${q.marks} mark${q.marks > 1 ? 's' : ''}</span>
                </div>
                <div class="question-text">${q.question}</div>
        `;
        
        if (q.type === 'MCQ' && q.options) {
            questionHTML += `<div class="mcq-options">`;
            q.options.forEach((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                questionHTML += `
                    <label class="mcq-option">
                        <input type="radio" name="q${q.id}" value="${letter}">
                        <span>${opt}</span>
                    </label>
                `;
            });
            questionHTML += `</div>`;
        } else {
            questionHTML += `
                <textarea class="answer-input" placeholder="Write your answer here..." data-qid="${q.id}"></textarea>
            `;
        }
        
        questionHTML += `</div>`;
        return questionHTML;
    }).join('');
}

function startMockTestTimer() {
    mockTestData.startTime = Date.now();
    const timerEl = document.getElementById('mockTestTimer');
    
    if (mockTestData.timerInterval) {
        clearInterval(mockTestData.timerInterval);
    }
    
    mockTestData.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - mockTestData.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timerEl.textContent = `⏱️ ${minutes}:${seconds}`;
    }, 1000);
}

function submitMockTest() {
    if (mockTestData.timerInterval) {
        clearInterval(mockTestData.timerInterval);
    }
    
    const resultsEl = document.getElementById('mockTestResults');
    const contentEl = document.getElementById('mockTestContent');
    
    let totalMarks = 0;
    let scoredMarks = 0;
    
    const results = mockTestData.questions.map(q => {
        totalMarks += q.marks;
        
        let userAnswer = '';
        if (q.type === 'MCQ') {
            const selected = document.querySelector(`input[name="q${q.id}"]:checked`);
            userAnswer = selected ? selected.value : '';
        } else {
            const textarea = document.querySelector(`textarea[data-qid="${q.id}"]`);
            userAnswer = textarea ? textarea.value.trim() : '';
        }
        
        let isCorrect = false;
        if (q.type === 'MCQ') {
            isCorrect = userAnswer.toUpperCase() === q.answer.toUpperCase();
            if (isCorrect) scoredMarks += q.marks;
        }
        
        return {
            ...q,
            userAnswer,
            isCorrect
        };
    });
    
    contentEl.style.display = 'none';
    resultsEl.style.display = 'block';
    
    const percentage = Math.round((scoredMarks / totalMarks) * 100);
    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';
    
    resultsEl.innerHTML = `
        <div class="results-header">
            <h3><i class="fas fa-chart-bar"></i> Test Results</h3>
            <div class="score-summary">
                <div class="score-circle ${percentage >= 50 ? 'pass' : 'fail'}">
                    <span class="score-value">${percentage}%</span>
                    <span class="score-grade">Grade: ${grade}</span>
                </div>
                <div class="score-details">
                    <p>Score: ${scoredMarks}/${totalMarks} marks</p>
                    <p>MCQ Correct: ${results.filter(r => r.type === 'MCQ' && r.isCorrect).length}/${results.filter(r => r.type === 'MCQ').length}</p>
                </div>
            </div>
        </div>
        <div class="results-details">
            <h4>Answer Key & Explanations</h4>
            ${results.map((r, i) => `
                <div class="result-item ${r.type === 'MCQ' ? (r.isCorrect ? 'correct' : 'incorrect') : ''}">
                    <div class="result-question">
                        <strong>Q${i + 1}:</strong> ${r.question}
                    </div>
                    ${r.type === 'MCQ' ? `
                        <div class="result-answer">
                            <span class="your-answer">Your answer: ${r.userAnswer || 'Not answered'}</span>
                            <span class="correct-answer">Correct: ${r.answer}</span>
                        </div>
                    ` : ''}
                    <div class="result-explanation">
                        <strong>Answer/Solution:</strong><br>
                        ${r.answer}
                    </div>
                    ${r.explanation ? `<div class="result-explanation"><em>${r.explanation}</em></div>` : ''}
                </div>
            `).join('')}
        </div>
        <div class="results-actions">
            <button class="btn-primary" onclick="showMockTestConfig()"><i class="fas fa-redo"></i> Take Another Test</button>
        </div>
    `;
}

function showMockTestConfig() {
    document.getElementById('mockTestConfig').style.display = 'block';
    document.getElementById('mockTestContent').style.display = 'none';
    document.getElementById('mockTestResults').style.display = 'none';
    
    if (mockTestData.timerInterval) {
        clearInterval(mockTestData.timerInterval);
    }
    
    mockTestData.questions = [];
}

// Toast notification helper
function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =================================================================
// AI NOTES GENERATOR - YouTube Video to Detailed Notes
// =================================================================

let aiNotesState = {
    currentVideoId: null,
    currentTitle: null,
    currentTranscript: null,
    currentNotes: null,
    chatHistory: []
};

async function generateAINotes() {
    const urlInput = document.getElementById('youtubeUrl');
    const generateBtn = document.getElementById('generateNotesBtn');
    const loadingEl = document.getElementById('aiNotesLoading');
    const displayEl = document.getElementById('aiNotesDisplay');
    const emptyEl = document.getElementById('aiNotesEmpty');
    const loadingMsg = document.getElementById('loadingMessage');
    
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('Please enter a YouTube URL', 'error');
        return;
    }
    
    // Extract video ID from URL
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
        showToast('Invalid YouTube URL', 'error');
        return;
    }
    
    // Disable button
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.6';
    }
    
    // Show loading, hide others
    emptyEl.style.display = 'none';
    displayEl.style.display = 'none';
    loadingEl.style.display = 'block';
    loadingMsg.textContent = 'Extracting transcript from video...';
    
    try {
        // Step 1: Fetch transcript
        const transcriptData = await fetchYouTubeTranscript(videoId);
        
        aiNotesState.currentVideoId = videoId;
        aiNotesState.currentTitle = transcriptData.title;
        aiNotesState.currentTranscript = transcriptData.transcript;
        aiNotesState.chatHistory = [];
        
        loadingMsg.textContent = 'Generating detailed notes with AI...';
        
        // Step 2: Generate notes with AI
        const notes = await generateNotesFromTranscript(transcriptData.transcript, transcriptData.title);
        
        aiNotesState.currentNotes = notes;
        
        // Step 3: Display results
        displayNotes(transcriptData, notes);
        
        // Award XP
        if (window.gamification) {
            window.gamification.addXP(15, 'Generated AI Notes');
        }
        
        showToast('Notes generated successfully! 🎉', 'success');
        
    } catch (error) {
        console.error('Error generating notes:', error);
        showToast(error.message || 'Failed to generate notes', 'error');
        emptyEl.style.display = 'block';
    } finally {
        // Re-enable button
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
        }
        loadingEl.style.display = 'none';
    }
}

function extractYouTubeVideoId(url) {
    // Support multiple YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/\s]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    
    return null;
}

async function fetchYouTubeTranscript(videoId) {
    const response = await fetch(`/api/youtube-transcript?videoId=${videoId}`);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch transcript');
    }
    
    return await response.json();
}

async function generateNotesFromTranscript(transcript, title) {
    const prompt = `You are an expert note-taker and educator. Your task is to generate COMPREHENSIVE, DETAILED, and WELL-STRUCTURED notes from a YouTube video transcript.

VIDEO TITLE: ${title}

TRANSCRIPT:
${transcript.slice(0, 100000)} 

INSTRUCTIONS:
1. Create detailed notes that capture ALL important information from the video
2. Structure the notes with clear headings, subheadings, and bullet points
3. Include:
   - Main concepts and key points
   - Definitions and explanations
   - Examples and illustrations mentioned
   - Step-by-step processes or procedures
   - Important facts, figures, and data
   - Formulas or equations (if applicable)
   - Tips, tricks, and best practices
   
4. Format requirements:
   - Use markdown-style formatting (## for headings, ### for subheadings, - for bullets)
   - Use **bold** for important terms and concepts
   - Use *italics* for emphasis
   - Number steps in procedures
   - Box key takeaways with ═══ borders
   
5. Organization:
   - Start with a brief overview/summary (2-3 sentences)
   - Organize content logically by topics/sections
   - End with "Key Takeaways" section listing 5-7 most important points
   
6. BE THOROUGH - these notes should allow someone to understand the video content without watching it

Generate the notes now:`;

    const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: API_CONFIG.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate notes with AI');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function displayNotes(transcriptData, notes) {
    const displayEl = document.getElementById('aiNotesDisplay');
    const videoTitleEl = document.getElementById('videoTitle');
    const videoMetaEl = document.getElementById('videoMeta');
    const notesEl = document.getElementById('generatedNotes');
    const followUpChat = document.getElementById('followUpChat');
    const followUpMessages = document.getElementById('followUpChatMessages');
    
    // Display video info
    videoTitleEl.textContent = transcriptData.title;
    videoMetaEl.innerHTML = `<i class="fab fa-youtube"></i> Video ID: ${transcriptData.videoId} | Language: ${transcriptData.language}`;
    
    // Display notes with formatting
    notesEl.innerHTML = formatNotes(notes);
    
    // Reset follow-up chat
    followUpChat.style.display = 'none';
    followUpMessages.innerHTML = '';
    
    // Show display section
    displayEl.style.display = 'block';
}

function formatNotes(notes) {
    // Convert markdown-style formatting to HTML
    let formatted = notes
        // Headers
        .replace(/### (.*?)(\n|$)/g, '<h4 style="color: var(--accent); margin-top: var(--spacing-md); margin-bottom: var(--spacing-sm);">$1</h4>')
        .replace(/## (.*?)(\n|$)/g, '<h3 style="color: var(--accent); margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm);">$1</h3>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary);">$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Bullets
        .replace(/^- (.*?)$/gm, '<div style="margin-left: var(--spacing-md); margin-bottom: var(--spacing-xs);">• $1</div>')
        // Numbers
        .replace(/^(\d+)\. (.*?)$/gm, '<div style="margin-left: var(--spacing-md); margin-bottom: var(--spacing-xs);"><strong>$1.</strong> $2</div>')
        // Line breaks
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
    
    return formatted;
}

function copyNotes() {
    const notes = aiNotesState.currentNotes;
    if (!notes) return;
    
    navigator.clipboard.writeText(notes).then(() => {
        showToast('Notes copied to clipboard! 📋', 'success');
    }).catch(() => {
        showToast('Failed to copy notes', 'error');
    });
}

function downloadNotes() {
    const notes = aiNotesState.currentNotes;
    const title = aiNotesState.currentTitle;
    
    if (!notes) return;
    
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Notes downloaded! 📥', 'success');
}

function toggleFollowUpChat() {
    const chatEl = document.getElementById('followUpChat');
    const isVisible = chatEl.style.display !== 'none';
    chatEl.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        // Scroll to chat
        chatEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

async function sendFollowUpQuestion() {
    const input = document.getElementById('followUpInput');
    const messagesEl = document.getElementById('followUpChatMessages');
    const question = input.value.trim();
    
    if (!question) return;
    
    if (!aiNotesState.currentTranscript) {
        showToast('No video loaded', 'error');
        return;
    }
    
    // Add user message
    addChatMessage('user', question, messagesEl);
    input.value = '';
    
    // Add loading message
    const loadingId = 'loading_' + Date.now();
    addChatMessage('assistant', '<i class="fas fa-spinner fa-spin"></i> Thinking...', messagesEl, loadingId);
    
    try {
        // Build conversation context
        const messages = [
            {
                role: 'system',
                content: `You are a helpful assistant answering questions about a YouTube video. Here is the video transcript:\n\n${aiNotesState.currentTranscript.slice(0, 50000)}\n\nAnswer questions based on this transcript.`
            },
            ...aiNotesState.chatHistory,
            { role: 'user', content: question }
        ];
        
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: messages,
                temperature: 0.5,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get response');
        }
        
        const data = await response.json();
        const answer = data.choices[0].message.content;
        
        // Remove loading message
        const loadingMsg = document.getElementById(loadingId);
        if (loadingMsg) loadingMsg.remove();
        
        // Add assistant message
        addChatMessage('assistant', answer, messagesEl);
        
        // Update chat history
        aiNotesState.chatHistory.push({ role: 'user', content: question });
        aiNotesState.chatHistory.push({ role: 'assistant', content: answer });
        
    } catch (error) {
        console.error('Error sending question:', error);
        const loadingMsg = document.getElementById(loadingId);
        if (loadingMsg) loadingMsg.remove();
        addChatMessage('assistant', '❌ Failed to get response. Please try again.', messagesEl);
    }
}

function addChatMessage(role, content, container, id = null) {
    const msgDiv = document.createElement('div');
    msgDiv.id = id || `msg_${Date.now()}`;
    msgDiv.style.cssText = `
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
        border-radius: var(--border-radius);
        ${role === 'user' ? 'background: var(--accent-transparent); margin-left: var(--spacing-xl); text-align: right;' : 'background: var(--bg-secondary); margin-right: var(--spacing-xl);'}
    `;
    msgDiv.innerHTML = `
        <div style="font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--text-secondary); font-size: 0.85rem;">
            ${role === 'user' ? '👤 You' : '🤖 AI Assistant'}
        </div>
        <div style="color: var(--text-primary);">${content}</div>
    `;
    
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// Handle Enter key in follow-up input
document.addEventListener('DOMContentLoaded', () => {
    const followUpInput = document.getElementById('followUpInput');
    if (followUpInput) {
        followUpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendFollowUpQuestion();
            }
        });
    }
});
