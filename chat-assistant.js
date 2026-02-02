// =================================================================
// AI CHAT ASSISTANT - CHATBOT INTERFACE
// OpenRouter API Integration with Vision Support
// =================================================================

class ChatAssistant {
    constructor() {
        // OpenRouter API Configuration (now using secure proxy)
        this.apiKey = null; // No longer needed - using serverless function
        this.apiUrl = '/api/openrouter'; // Vercel serverless function proxy
        this.model = 'z-ai/glm-4.5-air:free';
        
        // DOM Elements
        this.chatMessages = document.querySelector('.chat-messages');
        this.chatInput = document.querySelector('.chat-input');
        this.sendBtn = document.querySelector('.send-btn');
        this.imageBtn = document.querySelectorAll('.input-icon-btn')[0];
        this.voiceBtn = document.querySelectorAll('.input-icon-btn')[1];
        this.newChatBtn = document.querySelector('.new-chat-btn');
        this.clearHistoryBtn = document.querySelector('.clear-history-btn');
        this.historyList = document.querySelector('.history-list');
        this.imagePreviewContainer = document.querySelector('.image-preview-container');
        this.imagePreview = document.querySelector('.image-preview');
        this.removeImageBtn = document.querySelector('.remove-image-btn');
        
        // State
        this.currentChatId = this.generateChatId();
        this.currentMessages = [];
        this.uploadedImage = null;
        this.isRecording = false;
        this.recognition = null;
        this.chatHistory = this.loadChatHistory();
        this.processedFollowUps = new WeakSet();
        
        this.init();
    }
    
    init() {
        // Event Listeners
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.chatInput.addEventListener('input', () => this.autoResizeTextarea());
        
        this.imageBtn.addEventListener('click', () => this.handleImageUpload());
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.clearHistoryBtn.addEventListener('click', () => this.clearAllHistory());
        this.removeImageBtn.addEventListener('click', () => this.removeImage());
        
        // Initialize Speech Recognition
        this.initSpeechRecognition();
        
        // Load context database
        this.loadContextDB();
        
        // Render chat history
        this.renderChatHistory();
        
        // Setup output controls
        this.setupOutputControls();
        
        // Start follow-up suggestion monitoring
        this.startFollowUpMonitoring();
    }
    
    // =================================================================
    // OUTPUT CONTROLS - SINGLE LINE ABOVE INPUT
    // =================================================================
    setupOutputControls() {
        const inputCard = document.querySelector('.chat-input-card');
        if (!inputCard) return;
        
        // Check if already exists
        if (document.querySelector('.output-controls-bar')) return;
        
        // Create controls bar
        const controlsBar = document.createElement('div');
        controlsBar.className = 'output-controls-bar';
        controlsBar.innerHTML = `
            <div class="output-controls-container">
                <select class="output-control-select" id="oc-length">
                    <option value="none">Length</option>
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                    <option value="extremely-long">Extremely Long</option>
                </select>
                
                <select class="output-control-select" id="oc-depth">
                    <option value="none">Depth</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                </select>
                
                <select class="output-control-select" id="oc-examples">
                    <option value="none">Examples</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                
                <select class="output-control-select" id="oc-accuracy">
                    <option value="none">Accuracy</option>
                    <option value="confident">Confident Only</option>
                    <option value="highlight-uncertainties">Show Uncertainties</option>
                </select>
                
                <select class="output-control-select" id="oc-creativity">
                    <option value="none">Creativity</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
        `;
        
        // Insert directly before the input card (above it)
        inputCard.parentNode.insertBefore(controlsBar, inputCard);
        console.log('✅ Output controls initialized above input box');
    }
    
    // =================================================================
    // MESSAGE FORMATTING
    // =================================================================
    formatSolution(text) {
        if (!text) return '';
        return this.escapeHtml(text);
    }
    
    finalFormatSolution(text) {
        if (!text) return '';
        
        // Check if libraries are loaded
        if (typeof marked === 'undefined') {
            console.error('Marked not loaded!');
            return this.escapeHtml(text);
        }
        if (typeof renderMathInElement === 'undefined') {
            console.error('KaTeX auto-render not loaded!');
            return this.escapeHtml(text);
        }
        
        try {
            // Configure marked
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false,
                tables: true,
                pedantic: false,
                smartLists: true,
                smartypants: false
            });
            
            // Render markdown first
            const html = marked.parse(text);
            
            // Create temporary div
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Apply KaTeX auto-render
            renderMathInElement(tempDiv, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\[', right: '\\]', display: true},
                    {left: '\\(', right: '\\)', display: false}
                ],
                throwOnError: false,
                trust: true,
                strict: false
            });
            
            return tempDiv.innerHTML;
        } catch (error) {
            console.error('Formatting failed:', error);
            return this.escapeHtml(text);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // =================================================================
    // DIAGRAM & GRAPH PROCESSING
    // =================================================================
    async processVisualContent(fullResponse, contentDiv) {
        let remainingText = fullResponse;
        
        // Extract different content types
        const plotlyRegex = /```python\s*([\s\S]*?plotly[\s\S]*?)```/gi;
        const jsonDiagramRegex = /```json-diagram\s*([\s\S]*?)```/gi;
        const diagramRegex = /```diagram\s*([\s\S]*?)```/gi;
        const graphRegex = /```graph\s*([\s\S]*?)```/gi;
        
        let visualCount = 0;
        
        // Store all visual elements for later rendering
        const visualElements = [];
        
        // DEBUG: Log raw response to check what format AI is using
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📊 VISUAL CONTENT DETECTION - RAW AI RESPONSE:');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🔍 Checking for Plotly (```python with plotly):', plotlyRegex.test(fullResponse));
        plotlyRegex.lastIndex = 0; // Reset regex
        console.log('🔍 Checking for JSON diagrams (```json-diagram):', jsonDiagramRegex.test(fullResponse));
        jsonDiagramRegex.lastIndex = 0;
        console.log('🔍 Checking for SVG diagrams (```diagram):', diagramRegex.test(fullResponse));
        diagramRegex.lastIndex = 0;
        console.log('🔍 Checking for SVG graphs (```graph):', graphRegex.test(fullResponse));
        graphRegex.lastIndex = 0;
        console.log('═══════════════════════════════════════════════════════════════');
        
        // Process Plotly Python code
        remainingText = remainingText.replace(plotlyRegex, (match, pythonCode) => {
            try {
                const plotlyId = `plotly-${Date.now()}-${visualCount++}`;
                
                console.log('🐍 PLOTLY PYTHON CODE DETECTED:');
                console.log('─────────────────────────────────────────');
                console.log(pythonCode.trim());
                console.log('─────────────────────────────────────────');
                
                visualElements.push({
                    type: 'plotly',
                    id: plotlyId,
                    content: pythonCode.trim()
                });
                
                return `<div class="inline-plotly-placeholder" data-plotly-id="${plotlyId}"></div>`;
            } catch (e) {
                console.error('Failed to process Plotly code:', e);
                return match;
            }
        });
        
        // Process JSON diagram plans
        remainingText = remainingText.replace(jsonDiagramRegex, (match, jsonContent) => {
            try {
                const diagramId = `svg-diagram-${Date.now()}-${visualCount++}`;
                
                console.log('📐 JSON DIAGRAM PLAN DETECTED:');
                console.log('─────────────────────────────────────────');
                console.log(jsonContent.trim());
                console.log('─────────────────────────────────────────');
                
                visualElements.push({
                    type: 'json-diagram',
                    id: diagramId,
                    content: jsonContent.trim()
                });
                
                return `<div class="inline-svg-diagram-placeholder" data-json-diagram-id="${diagramId}"></div>`;
            } catch (e) {
                console.error('Failed to process JSON diagram:', e);
                return match;
            }
        });
        
        // Process SVG diagrams (legacy support)
        remainingText = remainingText.replace(diagramRegex, (match, svgContent) => {
            try {
                const diagramId = `diagram-${Date.now()}-${visualCount++}`;
                const titleMatch = svgContent.match(/<!--\s*title:\s*(.+?)\s*-->/i);
                const title = titleMatch ? titleMatch[1] : 'Visual Diagram';
                
                console.log('🎨 SVG DIAGRAM CODE (Legacy Format):');
                console.log('─────────────────────────────────────────');
                console.log(svgContent.trim());
                console.log('─────────────────────────────────────────');
                
                visualElements.push({
                    type: 'diagram',
                    id: diagramId,
                    content: svgContent.trim(),
                    title: title
                });
                
                return `<div class="inline-diagram-placeholder" data-diagram-id="${diagramId}"></div>`;
            } catch (e) {
                console.error('Failed to process diagram:', e);
                return match;
            }
        });
        
        // Process graphs (legacy support)
        remainingText = remainingText.replace(graphRegex, (match, svgContent) => {
            try {
                const graphId = `graph-${Date.now()}-${visualCount++}`;
                const titleMatch = svgContent.match(/<!--\s*title:\s*(.+?)\s*-->/i);
                const title = titleMatch ? titleMatch[1] : 'Mathematical Graph';
                
                console.log('📈 SVG GRAPH CODE (Legacy Format):');
                console.log('─────────────────────────────────────────');
                console.log(svgContent.trim());
                console.log('─────────────────────────────────────────');
                
                visualElements.push({
                    type: 'graph',
                    id: graphId,
                    content: svgContent.trim(),
                    title: title
                });
                
                return `<div class="inline-graph-placeholder" data-graph-id="${graphId}"></div>`;
            } catch (e) {
                console.error('Failed to process graph:', e);
                return match;
            }
        });
        
        // Log summary
        console.log('📊 VISUAL ELEMENTS SUMMARY:');
        visualElements.forEach((el, i) => {
            console.log(`  ${i+1}. Type: ${el.type}, ID: ${el.id}`);
        });
        console.log('═══════════════════════════════════════════════════════════════');
        
        // Render visual elements after DOM is ready
        setTimeout(() => {
            visualElements.forEach(element => {
                this.renderVisualElement(element, contentDiv);
            });
        }, 100);
        
        return { text: remainingText };
    }
    
    /**
     * Render a single visual element
     */
    renderVisualElement(element, contentDiv) {
        let placeholder;
        
        switch (element.type) {
            case 'plotly':
                placeholder = contentDiv.querySelector(`[data-plotly-id="${element.id}"]`);
                if (placeholder && window.plotlyRenderer) {
                    const wrapper = window.plotlyRenderer.createGraphContainer(element.id);
                    placeholder.replaceWith(wrapper);
                    
                    const figData = window.plotlyRenderer.parsePythonToPlotly(element.content);
                    if (figData) {
                        const container = wrapper.querySelector('.plotly-graph-container');
                        window.plotlyRenderer.render(container, figData);
                        console.log('✅ Plotly graph rendered:', element.id);
                    }
                }
                break;
                
            case 'json-diagram':
                placeholder = contentDiv.querySelector(`[data-json-diagram-id="${element.id}"]`);
                if (placeholder && window.svgDiagramRenderer) {
                    try {
                        const plan = JSON.parse(element.content);
                        const wrapper = window.svgDiagramRenderer.createContainer(element.id);
                        placeholder.replaceWith(wrapper);
                        
                        const svgString = window.svgDiagramRenderer.render(plan);
                        const container = wrapper.querySelector('.svg-diagram-container');
                        container.innerHTML = svgString;
                        console.log('✅ JSON diagram rendered:', element.id);
                    } catch (e) {
                        console.error('Failed to parse JSON diagram:', e);
                        placeholder.innerHTML = `<div class="error-message">Invalid diagram format</div>`;
                    }
                }
                break;
                
            case 'diagram':
            case 'graph':
                placeholder = contentDiv.querySelector(
                    element.type === 'diagram' 
                        ? `[data-diagram-id="${element.id}"]`
                        : `[data-graph-id="${element.id}"]`
                );
                if (placeholder) {
                    this.renderRawSVG(placeholder, element);
                }
                break;
        }
    }
    
    /**
     * ABSOLUTE SIMPLEST - Just replace placeholder with AI's exact output
     * NO containers, NO wrappers, NOTHING
     */
    renderRawSVG(placeholder, element) {
        // Get EXACT content from AI
        const exactContent = element.content.trim();
        
        // Log it so you can verify
        console.log('═══════════════════════════════════════');
        console.log('🎨 EXACT AI OUTPUT (being injected as-is):');
        console.log(exactContent);
        console.log('═══════════════════════════════════════');
        
        // Create a temporary div to hold the content
        const temp = document.createElement('div');
        temp.innerHTML = exactContent;
        
        // Get the actual SVG element (or whatever the AI outputted)
        const content = temp.firstElementChild || temp;
        
        // Replace placeholder with the exact content
        placeholder.replaceWith(content);
        
        console.log('✅ Injected exactly as AI outputted');
    }
    
    // =================================================================
    // MESSAGE HANDLING
    // =================================================================
    async sendMessage(messageOverride = null) {
        const message = (messageOverride || this.chatInput.value).trim();
        
        if (!message && !this.uploadedImage) {
            this.showToast('Please enter a message or upload an image', 'error');
            return;
        }
        
        // Clear input
        this.chatInput.value = '';
        this.autoResizeTextarea();
        
        // Add user message to UI
        this.addMessage('user', message, this.uploadedImage);
        
        // Add to current messages for API
        const userMessage = {
            role: 'user',
            content: []
        };
        
        if (message) {
            userMessage.content.push({
                type: 'text',
                text: message
            });
        }
        
        if (this.uploadedImage) {
            userMessage.content.push({
                type: 'image_url',
                image_url: {
                    url: this.uploadedImage
                }
            });
        }
        
        this.currentMessages.push(userMessage);
        
        // Clear uploaded image
        const imageForHistory = this.uploadedImage;
        this.removeImage();
        
        // Show typing indicator
        const typingDiv = this.showTypingIndicator();
        
        // Get AI response
        try {
            // Search for relevant context
            const context = await this.searchRelevantContext(message);
            
            console.log('🔍 Context found:', context);
            console.log('📚 Subtopics to display:', context.subtopics);
            
            // Show chapter loaded indicator if chapter-based
            if (context.chapterBased && context.chapter) {
                const chapterBadge = document.createElement('div');
                chapterBadge.className = 'chapter-loaded-badge';
                chapterBadge.innerHTML = `
                    <i class="fas fa-book-open"></i>
                    <span>Loaded: ${context.chapter.subject}${context.chapter.part} - ${context.chapter.chapter}</span>
                `;
                typingDiv.parentElement.insertBefore(chapterBadge, typingDiv);
            }
            
            // Build system prompt with context
            const systemPrompt = this.buildSystemPromptWithContext(context);
            
            // Call API with streaming
            await this.callOpenRouterAPIWithStreaming(systemPrompt, typingDiv, context.subtopics);
            
            // Award XP for asking question
            if (window.gamification) {
                window.gamification.addXP(10, 'Asked a question');
            }
            
            // Save chat to history
            this.saveChatToHistory(message, imageForHistory);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            typingDiv.remove();
            this.addMessage('assistant', '❌ Sorry, I encountered an error. Please try again.');
            this.showToast('Failed to get response', 'error');
        }
    }
    
    addMessage(role, text, image = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = role === 'user' 
            ? '<i class="fas fa-user"></i>' 
            : '<i class="fas fa-robot"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (image) {
            const imgElement = document.createElement('img');
            imgElement.src = image;
            imgElement.className = 'message-image';
            contentDiv.appendChild(imgElement);
        }
        
        if (text) {
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';
            bubbleDiv.innerHTML = role === 'assistant' ? this.formatSolution(text) : text;
            contentDiv.appendChild(bubbleDiv);
        }
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();
        contentDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        // Remove welcome message if exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    showTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message-bubble typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        contentDiv.appendChild(typingDiv);
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }

    showChapterLoadedBadge(chapterInfo) {
        // Show a badge indicating which chapter was loaded
        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'chapter-loaded-badge';
        badgeDiv.innerHTML = `
            <i class="fas fa-book-open"></i>
            <span>📖 Loaded: ${chapterInfo.subject}${chapterInfo.part} - ${chapterInfo.chapter}</span>
        `;
        
        this.chatMessages.appendChild(badgeDiv);
        this.scrollToBottom();
        
        // Remove badge after 5 seconds
        setTimeout(() => {
            badgeDiv.style.opacity = '0';
            setTimeout(() => badgeDiv.remove(), 300);
        }, 5000);
    }
    
    // =================================================================
    // OPENROUTER API WITH STREAMING
    // =================================================================
    async callOpenRouterAPIWithStreaming(systemPrompt, typingDiv, readSubtopics = [], retryCount = 0) {
        const maxRetries = 3;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.currentMessages
        ];
        
        try {
            console.log(`🔄 Attempting API call (attempt ${retryCount + 1}/${maxRetries + 1})`);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    stream: true,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }
            
            console.log('✅ API connection successful');
            
            // Setup streaming reader
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            // Setup message elements
            const contentDiv = typingDiv.querySelector('.message-content');
            contentDiv.innerHTML = '';
            
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';
            contentDiv.appendChild(bubbleDiv);
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = this.getCurrentTime();
            contentDiv.appendChild(timeDiv);
            
            let fullResponse = '';
            let buffer = '';
            let isStreaming = true;
            
            // Add typing cursor during streaming
            const addTypingCursor = () => {
                if (isStreaming) {
                    bubbleDiv.textContent = fullResponse;
                    const cursor = document.createElement('span');
                    cursor.className = 'typing-cursor';
                    cursor.textContent = '|';
                    bubbleDiv.appendChild(cursor);
                }
            };
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;;
                
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const json = JSON.parse(data);
                            const content = json.choices?.[0]?.delta?.content;
                            
                            if (content) {
                                fullResponse += content;
                                addTypingCursor();
                                this.scrollToBottom();
                            }
                            
                            const finishReason = json.choices?.[0]?.finish_reason;
                            if (finishReason) {
                                console.log('⚠️ Stream finished with reason:', finishReason);
                            }
                        } catch (e) {
                            console.warn('Parse error (non-critical):', e.message);
                        }
                    }
                }
            }
            
            // Streaming complete
            isStreaming = false;
            console.log('🎨 Formatting response...');
            
            // Process diagrams/graphs first
            const processedResponse = await this.processVisualContent(fullResponse, contentDiv);
            
            // Format with markdown and KaTeX auto-render
            bubbleDiv.innerHTML = this.finalFormatSolution(processedResponse.text);
            console.log('✅ Formatting complete!');
            
            // Add context log if available
            if (readSubtopics && Array.isArray(readSubtopics) && readSubtopics.length > 0) {
                const contextLog = document.createElement('div');
                contextLog.className = 'context-log';
                contextLog.innerHTML = `
                    <strong>📚 DATABASE CONTEXT USED:</strong><br>
                    ${readSubtopics.map(s => `• ${s}`).join('<br>')}
                `;
                contentDiv.appendChild(contextLog);
            }
            
            // Add context usage display
            if (window.chatManager) {
                const usageHtml = window.chatManager.getContextUsageDisplay(
                    systemPrompt,
                    this.currentMessages,
                    null
                );
                const usageDiv = document.createElement('div');
                usageDiv.className = 'message-context-usage';
                usageDiv.innerHTML = usageHtml;
                contentDiv.appendChild(usageDiv);
            }
            
            // Store message
            this.currentMessages.push({
                role: 'assistant',
                content: fullResponse
            });
            
            // Save to history and generate summary
            await this.saveAIResponseToHistory(fullResponse);
            
        } catch (error) {
            console.error(`❌ API Error (attempt ${retryCount + 1}):`, error);
            
            if (retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`⏳ Retrying in ${delay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.callOpenRouterAPIWithStreaming(systemPrompt, typingDiv, readSubtopics, retryCount + 1);
            } else {
                // Show error to user
                const avatarDiv = typingDiv.querySelector('.message-avatar');
                const contentDiv = typingDiv.querySelector('.message-content');
                contentDiv.innerHTML = '';
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message-bubble error-message';
                errorDiv.innerHTML = `
                    <div style="color: #ef4444; font-weight: 600; margin-bottom: 8px;">
                        <i class="fas fa-exclamation-triangle"></i> Connection Error
                    </div>
                    <div style="color: rgba(255,255,255,0.8); font-size: 14px;">
                        Failed to get AI response after ${maxRetries + 1} attempts.<br>
                        <strong>Error:</strong> ${error.message}<br><br>
                        <em>Please check your internet connection and try again.</em>
                    </div>
                `;
                contentDiv.appendChild(errorDiv);
                
                const timeDiv = document.createElement('div');
                timeDiv.className = 'message-time';
                timeDiv.textContent = this.getCurrentTime();
                contentDiv.appendChild(timeDiv);
                
                throw error;
            }
        }
    }
    
    // =================================================================
    // CONTEXT DATABASE & INTELLIGENT SEARCH
    // =================================================================
    async loadContextDB() {
        if (this._contextDB) return this._contextDB;
        
        // Try to load from global variable first (chem_db.js)
        if (window.__CHEMISTRY_DB__) {
            console.log('✅ Loaded context from window.__CHEMISTRY_DB__');
            this._contextDB = window.__CHEMISTRY_DB__;
            return this._contextDB;
        }
        
        // Fallback to fetch
        try {
            const res = await fetch('chem_db.json');
            this._contextDB = await res.json();
            console.log('✅ Loaded context from chem_db.json');
        } catch (e) {
            console.warn('Could not load chem_db.json', e);
            this._contextDB = {};
        }
        
        return this._contextDB;
    }
    
    async searchRelevantContext(query) {
        // Direct AI chapter identification
        console.log('🔍 Finding relevant NCERT chapter using AI...');

        try {
            const chapterList = getChapterListForAI();
            const simplePrompt = `QUESTION: "${query}"

AVAILABLE CHAPTERS:
${chapterList}

INSTRUCTIONS:
- If you find a matching chapter, reply with ONLY the path (like "chemistry-part1/kech101.pdf")
- If no chapter matches the topic, reply with ONLY "NONE"
- Do not add any other text, explanations, or formatting

EXAMPLE:
Question: "What is atomic structure?"
Answer: chemistry-part1/kech102.pdf

Question: "How to bake a cake?"
Answer: NONE

Your answer:`;

            console.log('🤖 Asking AI to identify chapter...');
            console.log('📝 Prompt:', simplePrompt);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: simplePrompt }],
                    temperature: 0.1,
                    max_tokens: 50
                })
            });

            if (!response.ok) {
                console.warn('AI identification failed, using general knowledge');
                return { subtopics: [], context: "I can help with NCERT Class 11 Chemistry, Physics, and Mathematics. What specific topic would you like to learn?", allContext: [] };
            }

            const data = await response.json();
            console.log('📡 AI response data:', data);

            const aiResponse = data.choices?.[0]?.message?.content?.trim() || '';
            console.log(`🤖 AI raw response: "${aiResponse}"`);

            // Extract chapter path from AI response
            let chapterPath = null;

            // First try parseChapterSelection (for bracketed responses)
            if (parseChapterSelection) {
                chapterPath = parseChapterSelection(aiResponse);
            }

            // If that fails, try to extract any valid path from the response
            if (!chapterPath) {
                const pathPatterns = [
                    /(chemistry-part[12]|physics-part[12]|mathematics)\/ke[cpm]h[12]?\d{2}\.pdf/gi,
                    /ke[cpm]h[12]?\d{2}\.pdf/gi
                ];

                for (const pattern of pathPatterns) {
                    const match = aiResponse.match(pattern);
                    if (match) {
                        const foundPath = match[0];
                        // If it's just the filename, try to construct full path
                        if (foundPath.startsWith('ke')) {
                            // Determine subject from filename
                            if (foundPath.startsWith('kech')) {
                                const part = foundPath.charAt(4) === '1' ? 'part1' : 'part2';
                                chapterPath = `chemistry-${part}/${foundPath}`;
                            } else if (foundPath.startsWith('keph')) {
                                const part = foundPath.charAt(4) === '1' ? 'part1' : 'part2';
                                chapterPath = `physics-${part}/${foundPath}`;
                            } else if (foundPath.startsWith('kemh')) {
                                chapterPath = `mathematics/${foundPath}`;
                            }
                        } else {
                            chapterPath = foundPath;
                        }
                        break;
                    }
                }
            }

            console.log(`🎯 Extracted chapter path: "${chapterPath}"`);

            // Check if we got a valid path and it's not NONE
            if (chapterPath && chapterPath !== 'NONE' && chapterPath.includes('.pdf')) {
                console.log(`📖 Loading: ${chapterPath}`);
                const chapterData = await pdfReader.loadChapterFromPath(chapterPath);

                if (chapterData) {
                    this.showChapterLoadedBadge(chapterData.info);
                    return {
                        chapterBased: true,
                        chapter: chapterData.info,
                        content: chapterData.text,
                        summary: `Full chapter: ${chapterData.info.subject}${chapterData.info.part} - ${chapterData.info.chapter}`,
                        subtopics: [`📖 ${chapterData.info.subject}${chapterData.info.part} - ${chapterData.info.chapter}`],
                        context: chapterData.text
                    };
                } else {
                    console.warn(`Failed to load chapter: ${chapterPath}`);
                }
            }

            // Fallback to general knowledge
            console.log('📚 Using general knowledge (no valid chapter found)');
            return { subtopics: [], context: "I can help with NCERT Class 11 Chemistry, Physics, and Mathematics. What specific topic would you like to learn?", allContext: [] };

        } catch (error) {
            console.error('Chapter identification error:', error);
            return { subtopics: [], context: "I can help with NCERT Class 11 Chemistry, Physics, and Mathematics. What specific topic would you like to learn?", allContext: [] };
        }
    }

    // Fast direct chapter matching with comprehensive keywords
    async tryDirectChapterMatch(query) {
        const queryLower = query.toLowerCase();

        // Comprehensive keyword mappings - expanded for better matching
        const chapterMappings = {
            // Chemistry Part 1
            'kech101.pdf': ['basic concepts', 'chemistry', 'mole', 'molar mass', 'stoichiometry', 'mole concept', 'molecular mass', 'formula mass', 'percentage composition', 'empirical formula', 'molecular formula'],
            'kech102.pdf': ['atomic structure', 'atom', 'electron', 'proton', 'neutron', 'bohr', 'quantum', 'energy levels', 'orbitals', 'subatomic particles', 'rutherford', 'thomson', 'dalton'],
            'kech103.pdf': ['periodic table', 'periodic classification', 'mendeleev', 'modern periodic law', 'groups', 'periods', 'periodic trends', 'atomic radius', 'ionization energy', 'electronegativity'],
            'kech104.pdf': ['chemical bonding', 'bond', 'ionic', 'covalent', 'metallic', 'bonding', 'lewis structure', 'valence electrons', 'octet rule', 'bond length', 'bond energy'],
            'kech105.pdf': ['states of matter', 'gas laws', 'kinetic theory', 'solid', 'liquid', 'gas', 'boyle', 'charles', 'gay lussac', 'ideal gas', 'real gas', 'van der waals'],
            'kech106.pdf': ['thermodynamics', 'enthalpy', 'entropy', 'heat', 'energy', 'first law', 'second law', 'spontaneous', 'gibbs', 'hess law', 'thermochemistry'],
            'kech107.pdf': ['equilibrium', 'chemical equilibrium', 'le chatelier', 'equilibrium constant', 'kc', 'kp', 'reaction quotient', 'acid base equilibrium', 'solubility product'],

            // Chemistry Part 2
            'kech201.pdf': ['redox reactions', 'oxidation', 'reduction', 'electrode', 'redox', 'oxidizing agent', 'reducing agent', 'half reactions', 'cell potential'],
            'kech202.pdf': ['hydrogen', 'water', 'hydrides', 'dihydrogen', 'heavy water', 'hydrides', 'hydrogen peroxide', 'h2o2'],
            'kech203.pdf': ['s-block elements', 'alkali', 'alkaline earth', 'sodium', 'potassium', 'magnesium', 'calcium', 'group 1', 'group 2'],
            'kech204.pdf': ['p-block elements', 'boron', 'carbon', 'nitrogen', 'oxygen', 'halogens', 'noble gases', 'group 13', 'group 14', 'group 15', 'group 16', 'group 17', 'group 18'],
            'kech205.pdf': ['organic chemistry', 'hydrocarbons', 'alkane', 'alkene', 'alkyne', 'functional groups', 'isomerism', 'nomenclature', 'ethane', 'ethene', 'ethyne'],
            'kech206.pdf': ['environmental chemistry', 'pollution', 'ozone', 'greenhouse', 'acid rain', 'photochemical smog', 'catalytic converter', 'stratospheric ozone'],

            // Physics Part 1
            'keph101.pdf': ['physical world', 'physics', 'measurement', 'units', 'dimensions', 'accuracy', 'precision', 'significant figures', 'dimensional analysis'],
            'keph102.pdf': ['units measurements', 'si units', 'dimensional analysis', 'error analysis', 'vernier caliper', 'screw gauge', 'least count'],
            'keph103.pdf': ['motion straight line', 'kinematics', 'velocity', 'acceleration', 'distance', 'displacement', 'speed', 'uniform motion', 'non uniform motion'],
            'keph104.pdf': ['motion plane', 'vector', 'projectile', 'relative velocity', 'vector addition', 'scalar', 'vector quantities', 'resolution of vectors'],
            'keph105.pdf': ['laws motion', 'newton', 'force', 'inertia', 'momentum', 'impulse', 'conservation of momentum', 'friction', 'circular motion'],
            'keph106.pdf': ['work energy power', 'work', 'energy', 'power', 'kinetic energy', 'potential energy', 'conservation of energy', 'elastic collision'],
            'keph107.pdf': ['system particles', 'center mass', 'momentum', 'angular momentum', 'torque', 'equilibrium', 'rigid body', 'rotational motion'],

            // Physics Part 2
            'keph201.pdf': ['oscillations', 'waves', 'simple harmonic motion', 'shm', 'pendulum', 'spring', 'wave motion', 'transverse waves', 'longitudinal waves'],
            'keph202.pdf': ['mechanical properties', 'elasticity', 'stress', 'strain', 'young modulus', 'bulk modulus', 'shear modulus', 'poisson ratio'],
            'keph203.pdf': ['thermal properties', 'heat', 'temperature', 'thermal expansion', 'calorimetry', 'specific heat', 'latent heat', 'thermal conductivity'],
            'keph204.pdf': ['thermodynamics', 'heat engine', 'carnot', 'refrigerator', 'second law', 'entropy', 'heat pump', 'efficiency'],
            'keph205.pdf': ['kinetic theory', 'gas laws', 'ideal gas', 'rms speed', 'kinetic energy', 'maxwell distribution', 'brownian motion'],
            'keph206.pdf': ['ray optics', 'reflection', 'refraction', 'lens', 'mirror', 'spherical mirror', 'thin lens', 'lens formula', 'mirror formula'],
            'keph207.pdf': ['optical instruments', 'microscope', 'telescope', 'magnification', 'resolving power', 'astronomical telescope', 'compound microscope'],

            // Mathematics
            'kemh101.pdf': ['sets', 'relations', 'functions', 'domain', 'range', 'types of functions', 'composite functions', 'inverse functions'],
            'kemh102.pdf': ['complex numbers', 'imaginary', 'complex', 'argand plane', 'polar form', 'euler form', 'de moivre theorem'],
            'kemh103.pdf': ['quadratic equations', 'quadratic', 'discriminant', 'nature of roots', 'sum product of roots', 'quadratic formula'],
            'kemh104.pdf': ['linear inequalities', 'inequalities', 'solution of inequalities', 'graphical solution', 'interval notation'],
            'kemh105.pdf': ['permutation combination', 'permutation', 'combination', 'factorial', 'circular permutation', 'fundamental principle'],
            'kemh106.pdf': ['binomial theorem', 'binomial', 'pascal triangle', 'general term', 'middle term', 'expansion'],
            'kemh107.pdf': ['sequence series', 'sequence', 'series', 'arithmetic', 'geometric', 'harmonic', 'infinite series', 'convergence'],
            'kemh108.pdf': ['straight lines', 'coordinate geometry', 'line', 'slope', 'intercept', 'distance formula', 'section formula'],
            'kemh109.pdf': ['conic sections', 'circle', 'parabola', 'ellipse', 'hyperbola', 'eccentricity', 'directrix', 'focus'],
            'kemh110.pdf': ['3d geometry', 'three dimensional', 'direction cosines', 'planes', 'straight lines in space'],
            'kemh111.pdf': ['limits derivatives', 'limit', 'derivative', 'differentiation', 'chain rule', 'product rule', 'quotient rule'],
            'kemh112.pdf': ['mathematical reasoning', 'logic', 'proof', 'contradiction', 'converse', 'inverse', 'contrapositive'],
            'kemh113.pdf': ['statistics', 'mean', 'median', 'mode', 'variance', 'standard deviation', 'correlation', 'regression'],
            'kemh114.pdf': ['probability', 'random', 'event', 'sample space', 'conditional probability', 'bayes theorem', 'binomial distribution']
        };

        // Find best matching chapter
        let bestMatch = null;
        let bestScore = 0;

        for (const [pdfFile, keywords] of Object.entries(chapterMappings)) {
            let score = 0;
            for (const keyword of keywords) {
                if (queryLower.includes(keyword)) {
                    score += keyword.length; // Longer matches get higher score
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = pdfFile;
            }
        }

        if (bestMatch && bestScore > 0) {
            // Determine subject and construct path
            let subject, part, fullPath;

            if (bestMatch.startsWith('kech1')) {
                subject = 'chemistry';
                part = 'part1';
                fullPath = `chemistry-part1/${bestMatch}`;
            } else if (bestMatch.startsWith('kech2')) {
                subject = 'chemistry';
                part = 'part2';
                fullPath = `chemistry-part2/${bestMatch}`;
            } else if (bestMatch.startsWith('keph1')) {
                subject = 'physics';
                part = 'part1';
                fullPath = `physics-part1/${bestMatch}`;
            } else if (bestMatch.startsWith('keph2')) {
                subject = 'physics';
                part = 'part2';
                fullPath = `physics-part2/${bestMatch}`;
            } else if (bestMatch.startsWith('kemh')) {
                subject = 'mathematics';
                part = '';
                fullPath = `mathematics/${bestMatch}`;
            }

            if (fullPath) {
                console.log(`🎯 Direct match: ${fullPath} (score: ${bestScore})`);
                try {
                    const chapterData = await pdfReader.loadChapterFromPath(fullPath);
                    if (chapterData) {
                        this.showChapterLoadedBadge(chapterData.info);
                        return {
                            chapterBased: true,
                            chapter: chapterData.info,
                            content: chapterData.text,
                            summary: `Full chapter: ${chapterData.info.subject}${chapterData.info.part} - ${chapterData.info.chapter}`,
                            subtopics: [`📖 ${chapterData.info.subject}${chapterData.info.part} - ${chapterData.info.chapter}`],
                            context: chapterData.text
                        };
                    }
                } catch (e) {
                    console.warn(`Failed to load matched chapter ${fullPath}:`, e);
                }
            }
        }

        // No match found
        return { chapterBased: false, subtopics: [], context: '', allContext: [] };
    }

    // Database fallback when no chapter is identified
    async useDatabaseFallback() {
        console.log('📚 Using database fallback...');
        const db = await this.loadContextDB();
        
        // Extract all subjects, chapters, and topics structure
        const availableContext = [];
        
        for (const [subjectName, subjectData] of Object.entries(db)) {
            if (!subjectData || typeof subjectData !== 'object') continue;
            
            for (const [chapterName, chapterData] of Object.entries(subjectData)) {
                if (!chapterData.topics) continue;
                
                for (const [topicName, topicData] of Object.entries(chapterData.topics)) {
                    if (!topicData || typeof topicData !== 'object') continue;
                    
                    for (const [subtopicName, subtopicData] of Object.entries(topicData)) {
                        if (subtopicData.context && subtopicData.context.length > 0) {
                            availableContext.push({
                                subject: subjectName,
                                chapter: chapterName,
                                topic: topicName,
                                subtopic: subtopicName,
                                context: subtopicData.context
                            });
                        }
                    }
                }
            }
        }
        
        console.log(`📚 Total available context entries: ${availableContext.length}`);
        
        // Return ALL context - let AI decide what's relevant
        return {
            subtopics: availableContext.slice(0, 10).map(c => `${c.chapter} → ${c.topic} → ${c.subtopic}`),
            context: availableContext.slice(0, 10).flatMap(c => c.context).join('\n\n'),
            allContext: availableContext
        };
    }
    
    buildSystemPromptWithContext(contextData) {
        // Get output control instructions
        const outputControlPrompt = this.generateOutputControlPrompt();
        
        const diagramInstructions = this.getDiagramAndGraphInstructions();
        
        const basePrompt = `You are a TOP-GRADE Class 11 CBSE TEACHER - the BEST in your field! You specialize in NCERT curriculum for Chemistry, Physics, and Mathematics.

🎭 YOUR PERSONALITY:
- You're enthusiastic and passionate about your subjects
- You make students feel comfortable asking "dumb" questions
- You celebrate when students understand concepts ("Yesss! You got it!")

📚 TEACHING PHILOSOPHY:
- NCERT is your Bible - stick to NCERT content strictly and use NCERT language/terminology
- When you have the FULL CHAPTER TEXT, teach comprehensively covering everything
- Use real-life examples that Indian students can relate to

${outputControlPrompt}

${diagramInstructions}

🎯 WHEN STUDENT ASKS TO LEARN A TOPIC/CHAPTER:
${contextData.chapterBased ? `
🔥 YOU HAVE THE COMPLETE NCERT CHAPTER! Use it wisely:
1. Start with the chapter introduction from NCERT
2. Cover ALL subtopics EXACTLY as they appear in NCERT
3. Use the EXACT definitions, formulas, and examples from the chapter
4. Explain every concept thoroughly - this is the full source material
5. Include ALL NCERT intext questions and their solutions
6. Include ALL end-chapter questions you can find in the text
7. Highlight important points NCERT emphasizes
8. Maintain NCERT's language style and flow
9. Cover EVERYTHING - don't skip anything from the chapter
` : `
2. Cover main subtopics systematically
3. Explain each concept thoroughly
4. Give solved examples after each concept
5. Highlight important points for exams
6. End with practice questions
`}

⚠️ EXCEPTION HANDLING:
- If asked something OUTSIDE Class 11 CBSE syllabus → Tell them politely: "This is outside Class 11 syllabus, but let me help anyway..."
- If asked non-academic questions → Politely redirect: "I'm your study buddy! Let's focus on studies 📚"
- If student seems confused → Use simpler analogies, break it down further
- If student asks same thing again → Explain differently, be patient

📝 FORMATTING RULES (MANDATORY):

1. **Headers & Sections:**
   - Use ### for main headers
   - Use ** for bold/important terms

2. **Mathematical Expressions:**
   - Subscripts: H₂O, CO₂
   - Superscripts: x², x³
   - Division: Use horizontal fraction bars or ÷
   - Multiplication: ×
   - Fractions: (numerator)/(denominator)

3. **Tables:**
   | Column 1 | Column 2 | Column 3 |
   |----------|----------|----------|
   | Data 1   | Data 2   | Data 3   |

4. **Chemical Formulas:**
   - Always use subscripts: H₂SO₄, NaCl
   - Show charges: Fe²⁺, SO₄²⁻
   - Balance equations properly

5. **Step-by-Step Solutions:**
   - Number each step
   - Show ALL work
   - Highlight final answers in **bold**
   - Add "💡 Pro tip:" for exam tricks

6. **Exam Tips:**
   - Highlight what's important for boards
   - Mention common mistakes students make
   - Include "📝 Remember for exam:" sections

🧠 Memory: Reference previous conversation when relevant.

✨ Your Goal: Make students LOVE studying and score great marks!`;

        if (contextData.chapterBased && contextData.content) {
            // PDF-based context
            return `${basePrompt}

📖 COMPLETE NCERT CHAPTER LOADED:
**${contextData.chapter.subject}${contextData.chapter.part} - ${contextData.chapter.chapter}**

Full Chapter Content:
${contextData.content}

⚠️ CRITICAL INSTRUCTION: The above is the COMPLETE NCERT chapter text. Use it as your primary source. Teach EXACTLY from this content. Don't add anything that's not in NCERT unless specifically asked for additional explanation.`;
        } else if (contextData.context && contextData.context.trim().length > 0) {
            // Database context (fallback)
            return `${basePrompt}

📚 NCERT Database Context (use intelligently):
${contextData.context}

Important: Use this context as guidance. If the question goes beyond what's provided, use your full knowledge to give a complete, accurate answer. Always prioritize NCERT content for Class 11 CBSE.`;
        }
        
        return basePrompt;
    }
    // =================================================================
    // TEXT FORMATTING WITH PROPER SYMBOLS
    // =================================================================
    formatSolution(text) {
        let formatted = text;
        
        // Replace common text symbols with proper mathematical/scientific symbols
        // Division: / → ÷
        formatted = formatted.replace(/(\d+)\s*\/\s*(\d+)/g, '$1 ÷ $2');
        
        // Multiplication: x or * → ×
        formatted = formatted.replace(/(\d+)\s*[x*×]\s*(\d+)/gi, '$1 × $2');
        
        // Arrows
        formatted = formatted.replace(/\->/g, '→');
        formatted = formatted.replace(/<\-/g, '←');
        formatted = formatted.replace(/<\->/g, '↔');
        
        // Degrees
        formatted = formatted.replace(/(\d+)\s*degrees?/gi, '$1°');
        formatted = formatted.replace(/(\d+)\s*deg/gi, '$1°');
        
        // Plus-minus
        formatted = formatted.replace(/\+\-/g, '±');
        formatted = formatted.replace(/\+\/\-/g, '±');
        
        // Greater than or equal to, less than or equal to
        formatted = formatted.replace(/>=/g, '≥');
        formatted = formatted.replace(/<=/g, '≤');
        formatted = formatted.replace(/!=/g, '≠');
        
        // Infinity
        formatted = formatted.replace(/infinity/gi, '∞');
        
        // Greek letters (common in physics/chemistry)
        formatted = formatted.replace(/\balpha\b/g, 'α');
        formatted = formatted.replace(/\bbeta\b/g, 'β');
        formatted = formatted.replace(/\bgamma\b/g, 'γ');
        formatted = formatted.replace(/\bdelta\b/g, 'Δ');
        formatted = formatted.replace(/\btheta\b/g, 'θ');
        formatted = formatted.replace(/\blambda\b/g, 'λ');
        formatted = formatted.replace(/\bmu\b/g, 'μ');
        formatted = formatted.replace(/\bpi\b/g, 'π');
        formatted = formatted.replace(/\bsigma\b/g, 'σ');
        formatted = formatted.replace(/\bomega\b/g, 'ω');
        
        // Superscripts for powers (^2, ^3, etc.)
        formatted = formatted.replace(/\^2\b/g, '²');
        formatted = formatted.replace(/\^3\b/g, '³');
        formatted = formatted.replace(/\^(\d+)/g, '<sup>$1</sup>');
        
        // Bold text **text** (must be before chemical formulas)
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="highlight">$1</strong>');
        
        // Section headers (### or ## at start of line)
        formatted = formatted.replace(/^###\s+(.+)$/gm, '<div class="section-header-small">$1</div>');
        formatted = formatted.replace(/^##\s+(.+)$/gm, '<div class="section-header">$1</div>');
        formatted = formatted.replace(/^#\s+(.+)$/gm, '<div class="section-header-large">$1</div>');
        
        // Chemical formulas with subscripts: H2O, CO2, etc.
        formatted = formatted.replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>');
        
        // Fraction bars (horizontal division)
        formatted = formatted.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '<div class="fraction"><span class="numerator">$1</span><span class="fraction-bar"></span><span class="denominator">$2</span></div>');
        
        // Math formulas in LaTeX-like syntax
        formatted = formatted.replace(/\$(.+?)\$/g, '<span class="formula">$1</span>');
        
        // Numbered lists
        formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="numbered-item"><span class="number">$1.</span> $2</div>');
        
        // Bullet points
        formatted = formatted.replace(/^[\-\*]\s+(.+)$/gm, '<div class="bullet-item">• $1</div>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }
    
    // =================================================================
    // IMAGE HANDLING
    // =================================================================
    handleImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.uploadedImage = event.target.result;
                    this.imagePreview.src = this.uploadedImage;
                    this.imagePreviewContainer.style.display = 'block';
                    this.showToast('Image uploaded! AI will analyze it.', 'success');
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }
    
    removeImage() {
        this.uploadedImage = null;
        this.imagePreviewContainer.style.display = 'none';
        this.imagePreview.src = '';
    }
    
    // =================================================================
    // VOICE INPUT
    // =================================================================
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-IN';
            
            this.recognition.onstart = () => {
                this.isRecording = true;
                this.voiceBtn.classList.add('recording');
                this.showToast('Listening... Speak now', 'info');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.chatInput.value = transcript;
                this.autoResizeTextarea();
                this.showToast('Voice input captured!', 'success');
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showToast('Voice input failed', 'error');
                this.resetVoiceButton();
            };
            
            this.recognition.onend = () => {
                this.resetVoiceButton();
            };
        }
    }
    
    toggleVoiceInput() {
        if (!this.recognition) {
            this.showToast('Voice input not supported', 'error');
            return;
        }
        
        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }
    
    resetVoiceButton() {
        this.isRecording = false;
        this.voiceBtn.classList.remove('recording');
    }
    
    // =================================================================
    // CHAT HISTORY
    // =================================================================
    loadChatHistory() {
        const saved = localStorage.getItem('chatHistory');
        return saved ? JSON.parse(saved) : [];
    }
    
    async saveChatToHistory(message, image, isNewChat = false) {
        const chatIndex = this.chatHistory.findIndex(c => c.id === this.currentChatId);
        
        if (chatIndex >= 0) {
            // Update existing chat
            this.chatHistory[chatIndex].messages.push({ role: 'user', text: message, image });
            this.chatHistory[chatIndex].lastMessage = message;
            this.chatHistory[chatIndex].date = new Date().toISOString();
        } else {
            // Create new chat - auto-generate name
            let chatName = null;
            if (window.chatManager) {
                chatName = await window.chatManager.generateChatName(message, this);
            }
            
            this.chatHistory.unshift({
                id: this.currentChatId,
                name: chatName,
                messages: [{ role: 'user', text: message, image }],
                lastMessage: message,
                date: new Date().toISOString()
            });
        }
        
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        this.renderChatHistory();
    }
    
    /**
     * Save AI response to history and generate summary
     */
    async saveAIResponseToHistory(aiResponse) {
        const chatIndex = this.chatHistory.findIndex(c => c.id === this.currentChatId);
        
        if (chatIndex >= 0) {
            const chat = this.chatHistory[chatIndex];
            chat.messages.push({ role: 'assistant', text: aiResponse });
            chat.date = new Date().toISOString();
            
            // Generate and save summary for the exchange
            if (window.chatManager && chat.messages.length >= 2) {
                const lastUserMsg = chat.messages[chat.messages.length - 2];
                if (lastUserMsg && lastUserMsg.role === 'user') {
                    const summary = await window.chatManager.generateMessageSummary(
                        lastUserMsg.text, 
                        aiResponse, 
                        this
                    );
                    const messageIndex = Math.floor(chat.messages.length / 2);
                    window.chatManager.addSummary(this.currentChatId, summary, messageIndex);
                }
            }
            
            localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        }
    }
    
    renderChatHistory() {
        this.historyList.innerHTML = '';
        
        this.chatHistory.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'history-item';
            if (chat.id === this.currentChatId) {
                item.classList.add('active');
            }
            
            // Check if this chat is referenced
            const isReferenced = window.chatManager && window.chatManager.isReferenced(chat.id);
            
            const date = new Date(chat.date);
            const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            
            // Use chat name if available, otherwise use message preview
            const displayName = chat.name || chat.lastMessage.substring(0, 40);
            
            item.innerHTML = `
                <div class="history-item-content">
                    <div class="history-item-name">${displayName}${displayName.length > 40 ? '...' : ''}</div>
                    <div class="history-item-date">${dateStr}</div>
                </div>
                <div class="history-item-actions">
                    ${isReferenced ? '<span class="reference-badge"><i class="fas fa-link"></i></span>' : ''}
                    <button class="history-menu-btn" data-chat-id="${chat.id}">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
                <div class="history-item-menu" id="menu-${chat.id}" style="display: none;">
                    <button class="menu-option rename-chat" data-chat-id="${chat.id}">
                        <i class="fas fa-edit"></i> Rename
                    </button>
                    <button class="menu-option reference-chat" data-chat-id="${chat.id}">
                        <i class="fas fa-link"></i> ${isReferenced ? 'Unreference' : 'Reference'}
                    </button>
                    <button class="menu-option delete-chat" data-chat-id="${chat.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            // Click to load chat
            item.querySelector('.history-item-content').addEventListener('click', () => this.loadChat(chat.id));
            
            // Menu button click
            const menuBtn = item.querySelector('.history-menu-btn');
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleChatMenu(chat.id);
            });
            
            // Menu options
            item.querySelector('.rename-chat').addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameChatPrompt(chat.id);
            });
            
            item.querySelector('.reference-chat').addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleReferenceChat(chat.id);
            });
            
            item.querySelector('.delete-chat').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChat(chat.id);
            });
            
            this.historyList.appendChild(item);
        });
        
        // Close menus when clicking outside
        document.addEventListener('click', () => this.closeAllChatMenus());
    }
    
    toggleChatMenu(chatId) {
        this.closeAllChatMenus();
        const menu = document.getElementById(`menu-${chatId}`);
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    closeAllChatMenus() {
        document.querySelectorAll('.history-item-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
    
    renameChatPrompt(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (!chat) return;
        
        const newName = prompt('Enter new chat name:', chat.name || chat.lastMessage.substring(0, 40));
        if (newName && newName.trim()) {
            this.renameChat(chatId, newName.trim());
        }
        this.closeAllChatMenus();
    }
    
    renameChat(chatId, newName) {
        const chatIndex = this.chatHistory.findIndex(c => c.id === chatId);
        if (chatIndex >= 0) {
            this.chatHistory[chatIndex].name = newName;
            localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
            this.renderChatHistory();
            this.showToast('Chat renamed', 'success');
        }
    }
    
    toggleReferenceChat(chatId) {
        if (!window.chatManager) return;
        
        if (window.chatManager.isReferenced(chatId)) {
            window.chatManager.removeReferenceChat(chatId);
            this.showToast('Chat unreferenced', 'info');
        } else {
            window.chatManager.addReferenceChat(chatId);
            this.showToast('Chat referenced - context will be included', 'success');
        }
        this.closeAllChatMenus();
        this.renderChatHistory();
    }
    
    deleteChat(chatId) {
        if (!confirm('Delete this chat?')) return;
        
        this.chatHistory = this.chatHistory.filter(c => c.id !== chatId);
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        
        // Also delete summaries
        if (window.chatManager) {
            window.chatManager.deleteChatSummaries(chatId);
        }
        
        // If deleting current chat, start new
        if (chatId === this.currentChatId) {
            this.startNewChat();
        }
        
        this.renderChatHistory();
        this.closeAllChatMenus();
        this.showToast('Chat deleted', 'success');
    }
    
    loadChat(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (!chat) return;
        
        this.currentChatId = chatId;
        this.chatMessages.innerHTML = '';
        this.currentMessages = [];
        
        chat.messages.forEach(msg => {
            this.addMessage(msg.role, msg.text, msg.image);
            
            if (msg.role === 'user') {
                const userMessage = { role: 'user', content: [] };
                if (msg.text) userMessage.content.push({ type: 'text', text: msg.text });
                if (msg.image) userMessage.content.push({ type: 'image_url', image_url: { url: msg.image } });
                this.currentMessages.push(userMessage);
            } else {
                this.currentMessages.push({ role: 'assistant', content: msg.text });
            }
        });
    }
    
    startNewChat() {
        this.currentChatId = this.generateChatId();
        this.currentMessages = [];
        this.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h3>Welcome to AI Assistant</h3>
                <p>Ask me anything about Chemistry, Physics, or Math!</p>
                <p>I can help with concepts, solve problems, and explain topics from your NCERT curriculum.</p>
            </div>
        `;
        this.showToast('Started new chat', 'success');
    }
    
    clearAllHistory() {
        if (confirm('Are you sure you want to clear all chat history?')) {
            this.chatHistory = [];
            localStorage.removeItem('chatHistory');
            this.renderChatHistory();
            this.startNewChat();
            this.showToast('Chat history cleared', 'success');
        }
    }
    
    // =================================================================
    // UTILITY FUNCTIONS
    // =================================================================
    generateChatId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    autoResizeTextarea() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 150) + 'px';
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    showToast(message, type = 'info') {
        // Simple toast notification (reuse from existing implementation)
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    // =================================================================
    // OUTPUT CONTROLS
    // =================================================================
    setupOutputControls() {
        const chatMain = document.querySelector('.chat-main-card');
        if (!chatMain) return;
        
        // Check if already exists
        if (document.querySelector('.output-controls-bar')) return;
        
        // Create controls bar
        const controlsBar = document.createElement('div');
        controlsBar.className = 'output-controls-bar';
        controlsBar.innerHTML = `
            <div class="output-controls-container">
                <select class="output-control-select" id="oc-length">
                    <option value="none">Length</option>
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                    <option value="extremely-long">Extremely Long</option>
                </select>
                
                <select class="output-control-select" id="oc-depth">
                    <option value="none">Depth</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                </select>
                
                <select class="output-control-select" id="oc-examples">
                    <option value="none">Examples</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                
                <select class="output-control-select" id="oc-accuracy">
                    <option value="none">Accuracy</option>
                    <option value="confident">Confident Only</option>
                    <option value="highlight-uncertainties">Show Uncertainties</option>
                </select>
                
                <select class="output-control-select" id="oc-creativity">
                    <option value="none">Creativity</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
        `;
        
        // Insert as floating panel in chat main area
        chatMain.appendChild(controlsBar);
        console.log('✅ Output controls initialized as floating panel');
    }
    
    getOutputControlValues() {
        return {
            length: document.getElementById('oc-length')?.value || 'none',
            depth: document.getElementById('oc-depth')?.value || 'none',
            examples: document.getElementById('oc-examples')?.value || 'none',
            accuracy: document.getElementById('oc-accuracy')?.value || 'none',
            creativity: document.getElementById('oc-creativity')?.value || 'none'
        };
    }
    
    // =================================================================
    // SVG DIAGRAM & GRAPH AI INSTRUCTIONS
    // =================================================================
    getDiagramAndGraphInstructions() {
        return `
═══════════════════════════════════════════════════════════════
📊 PLOTLY GRAPHS - FOR MATHEMATICAL PLOTS & DATA VISUALIZATION
═══════════════════════════════════════════════════════════════

For **mathematical graphs**, **functions**, **LPP problems**, **data plots**, use Plotly Python code!
The system will automatically render it with a beautiful dark theme.

🎯 WHEN TO USE PLOTLY:
- Function plots (y = x², sin(x), log(x), etc.)
- Linear Programming Problems (feasible regions, constraints)
- Statistical data (histograms, scatter plots)
- Calculus visualizations (derivatives, integrals, area under curve)
- Coordinate geometry (lines, circles, conics)
- Sequences and series plots

📝 HOW TO CREATE A PLOTLY GRAPH:
Wrap Python Plotly code in \`\`\`python ... \`\`\`

✅ EXAMPLE - LPP with Feasible Region (BEAUTIFUL AESTHETIC):
\`\`\`python
import plotly.graph_objects as go
import numpy as np

# Create figure
fig = go.Figure()

# X range
x = np.linspace(0, 10, 100)

# Constraint lines
fig.add_trace(go.Scatter(x=x, y=4-x, mode='lines', name='x + y = 4', 
    line=dict(color='#FF6B6B', width=2)))
fig.add_trace(go.Scatter(x=x, y=6-2*x, mode='lines', name='2x + y = 6', 
    line=dict(color='#4ECDC4', width=2)))

# Feasible region (shaded polygon)
fig.add_trace(go.Scatter(x=[0, 0, 2, 4], y=[6, 4, 2, 0], fill='toself', 
    fillcolor='rgba(78, 205, 196, 0.3)', line=dict(color='rgba(0,0,0,0)'),
    name='Feasible Region'))

# Corner points
fig.add_trace(go.Scatter(x=[0, 2, 4, 0], y=[6, 2, 0, 4], mode='markers+text',
    marker=dict(size=12, color='#FFE66D', symbol='diamond'),
    text=['A(0,6)', 'B(2,2)', 'C(4,0)', 'D(0,4)'],
    textposition='top right', textfont=dict(color='#FFE66D', size=12),
    name='Corner Points'))

# Optimal point highlight
fig.add_trace(go.Scatter(x=[2], y=[2], mode='markers',
    marker=dict(size=20, color='#FF6B6B', symbol='star'),
    name='Optimal: (2,2)'))

fig.update_layout(
    title='Minimize Z = 3x + 5y',
    xaxis_title='x',
    yaxis_title='y',
    showlegend=True
)
fig.show()
\`\`\`

✅ EXAMPLE - Function Plot (Quadratic):
\`\`\`python
import plotly.graph_objects as go
import numpy as np

x = np.linspace(-5, 5, 200)
y = x**2 - 4*x + 3

fig = go.Figure()
fig.add_trace(go.Scatter(x=x, y=y, mode='lines', name='y = x² - 4x + 3',
    line=dict(color='#3B82F6', width=3)))

# Mark roots
fig.add_trace(go.Scatter(x=[1, 3], y=[0, 0], mode='markers+text',
    marker=dict(size=12, color='#EF4444'), text=['(1,0)', '(3,0)'],
    textposition='top center', name='Roots'))

# Mark vertex
fig.add_trace(go.Scatter(x=[2], y=[-1], mode='markers+text',
    marker=dict(size=12, color='#22C55E'), text=['Vertex (2,-1)'],
    textposition='bottom center', name='Vertex'))

fig.update_layout(title='Quadratic Function', xaxis_title='x', yaxis_title='y')
fig.show()
\`\`\`

🎨 PLOTLY COLOR PALETTE (Use these for consistency):
- Primary: #FF6B6B (red), #4ECDC4 (teal), #45B7D1 (blue), #96CEB4 (green)
- Accents: #FFE66D (yellow), #DDA0DD (plum), #F7DC6F (gold)
- Fill colors: Use rgba() with 0.2-0.4 opacity for regions

═══════════════════════════════════════════════════════════════
🔬 JSON DIAGRAM PLANS - FOR PHYSICS & CHEMISTRY DIAGRAMS
═══════════════════════════════════════════════════════════════

For **physics diagrams** (optics, circuits, forces) and **chemistry diagrams** (molecular structures, orbitals), use JSON diagram plans!

🎯 WHEN TO USE JSON DIAGRAMS:
- Ray diagrams (lenses, mirrors, prisms)
- Circuit diagrams (resistors, capacitors, batteries)
- Force diagrams (vectors, free body diagrams)
- Wave diagrams (interference, diffraction)
- Molecular geometry (VSEPR, orbital diagrams)
- Atomic models (Bohr model, electron configurations)

📝 HOW TO CREATE A JSON DIAGRAM:
Wrap the JSON in \`\`\`json-diagram ... \`\`\`

📐 GRID SYSTEM (12 × 10):
- X: 0-12 (left to right), Y: 0-10 (top to bottom)
- Center: (6, 5)
- Each grid unit = ~50px when rendered

✅ EXAMPLE - Convex Lens Ray Diagram:
\`\`\`json-diagram
{
  "title": "Image Formation by Convex Lens",
  "elements": [
    {"type": "line", "from": [0, 5], "to": [12, 5], "color": "white", "label": "Principal Axis"},
    {"type": "lens", "position": [6, 5], "height": 4, "type": "convex"},
    {"type": "text", "position": [3, 5.3], "content": "F", "color": "yellow"},
    {"type": "circle", "center": [3, 5], "radius": 0.15, "color": "yellow", "fill": true},
    {"type": "text", "position": [9, 5.3], "content": "F'", "color": "yellow"},
    {"type": "circle", "center": [9, 5], "radius": 0.15, "color": "yellow", "fill": true},
    {"type": "arrow", "from": [2, 5], "to": [2, 3], "color": "green", "label": "Object"},
    {"type": "ray", "from": [2, 3], "to": [6, 3], "color": "red"},
    {"type": "ray", "from": [6, 3], "to": [10, 7], "color": "red"},
    {"type": "ray", "from": [2, 3], "to": [6, 5], "color": "orange"},
    {"type": "ray", "from": [6, 5], "to": [10, 7], "color": "orange"},
    {"type": "arrow", "from": [10, 5], "to": [10, 7], "color": "blue", "label": "Image"},
    {"type": "text", "position": [10, 7.8], "content": "(Real, Inverted)", "color": "cyan", "size": "small"}
  ],
  "steps": [
    {"elements": [0, 1, 2, 3, 4, 5], "description": "Setup: Principal axis with convex lens and focal points"},
    {"elements": [6], "description": "Object placed beyond 2F"},
    {"elements": [7, 8, 9, 10], "description": "Ray tracing through lens"},
    {"elements": [11, 12], "description": "Real, inverted image formed between F and 2F"}
  ]
}
\`\`\`

✅ EXAMPLE - Simple Circuit:
\`\`\`json-diagram
{
  "title": "Series Circuit with Resistors",
  "elements": [
    {"type": "battery", "position": [2, 5], "orientation": "vertical", "label": "V = 12V"},
    {"type": "line", "from": [2, 3], "to": [5, 3], "color": "white"},
    {"type": "resistor", "position": [5, 3], "orientation": "horizontal", "label": "R₁ = 4Ω"},
    {"type": "line", "from": [7, 3], "to": [10, 3], "color": "white"},
    {"type": "resistor", "position": [10, 5], "orientation": "vertical", "label": "R₂ = 6Ω"},
    {"type": "line", "from": [10, 7], "to": [5, 7], "color": "white"},
    {"type": "line", "from": [5, 7], "to": [2, 7], "color": "white"},
    {"type": "arrow", "from": [3, 2.5], "to": [4.5, 2.5], "color": "yellow", "label": "I"},
    {"type": "text", "position": [6, 9], "content": "Total R = 10Ω, I = 1.2A", "color": "cyan"}
  ]
}
\`\`\`

✅ EXAMPLE - VSEPR Molecular Geometry:
\`\`\`json-diagram
{
  "title": "VSEPR - Tetrahedral (CH₄)",
  "elements": [
    {"type": "circle", "center": [6, 5], "radius": 0.5, "color": "orange", "fill": true, "label": "C"},
    {"type": "line", "from": [6, 5], "to": [4, 3], "color": "cyan"},
    {"type": "circle", "center": [4, 3], "radius": 0.3, "color": "cyan", "fill": true, "label": "H"},
    {"type": "line", "from": [6, 5], "to": [8, 3], "color": "cyan"},
    {"type": "circle", "center": [8, 3], "radius": 0.3, "color": "cyan", "fill": true, "label": "H"},
    {"type": "line", "from": [6, 5], "to": [5, 7], "color": "cyan"},
    {"type": "circle", "center": [5, 7], "radius": 0.3, "color": "cyan", "fill": true, "label": "H"},
    {"type": "dashed-line", "from": [6, 5], "to": [7, 7], "color": "cyan"},
    {"type": "circle", "center": [7, 7], "radius": 0.3, "color": "cyan", "fill": true, "label": "H"},
    {"type": "text", "position": [6, 9], "content": "Bond Angle: 109.5°", "color": "yellow"},
    {"type": "text", "position": [6, 9.5], "content": "Hybridization: sp³", "color": "purple"}
  ]
}
\`\`\`

🔧 AVAILABLE ELEMENT TYPES:
- **line**: {from: [x,y], to: [x,y], color, label}
- **arrow**: {from: [x,y], to: [x,y], color, label}
- **ray**: {from: [x,y], to: [x,y], color} - line with arrowhead
- **dashed-line**: {from: [x,y], to: [x,y], color}
- **circle**: {center: [x,y], radius, color, fill, label}
- **arc**: {center: [x,y], radius, startAngle, endAngle, color}
- **rectangle**: {position: [x,y], width, height, color, fill}
- **text**: {position: [x,y], content, color, size}
- **lens**: {position: [x,y], height, type: "convex"|"concave"}
- **mirror**: {position: [x,y], height, type: "concave"|"convex"|"plane"}
- **spring**: {from: [x,y], to: [x,y], coils}
- **wave**: {from: [x,y], to: [x,y], amplitude, wavelength}
- **resistor**: {position: [x,y], orientation}
- **capacitor**: {position: [x,y], orientation}
- **battery**: {position: [x,y], orientation, label}

🎨 JSON DIAGRAM COLOR PALETTE:
- white, red, blue, green, yellow, cyan, orange, purple, pink, lime

═══════════════════════════════════════════════════════════════
🎨 FALLBACK: SVG DIAGRAMS (For Complex Custom Diagrams)
═══════════════════════════════════════════════════════════════

For highly custom diagrams not covered by JSON or Plotly, you can use raw SVG.
Use \`\`\`diagram ... \`\`\` for general diagrams or \`\`\`graph ... \`\`\` for coordinate graphs.

⚠️ CRITICAL: SVG VIEWBOX COORDINATE SYSTEM:
- ViewBox: **100 × 70** (NOT pixels!)
- **CENTER is at (50, 35)** - ALWAYS START HERE!
- Safe zone: x: 10-90, y: 10-65 (leave margins!)
- NEVER use (0,0) - that's TOP-LEFT and will be CUT OFF!

🎯 WHERE TO PLACE ELEMENTS (MANDATORY):
| Element | X | Y |
|---------|---|---|
| Main subject (ball, lens, atom) | **50** | **35** |
| Left objects | 20-30 | 35 |
| Right objects | 70-80 | 35 |
| Top arrows | 50 | 15-25 |
| Bottom labels | 50 | 50-60 |

✅ EXAMPLE - Properly Centered Ball:
\`\`\`diagram
<!-- title: Magnus Effect -->
<g data-step="1" data-description="Ball at center">
  <circle cx="50" cy="35" r="10" fill="#f97316" stroke="#fb923c" stroke-width="1"/>
  <text x="50" y="37" fill="#fff" font-size="3" text-anchor="middle">Ball</text>
</g>
<g data-step="2" data-description="Force arrows">
  <line x1="50" y1="35" x2="50" y2="15" stroke="#22c55e" stroke-width="1" marker-end="url(#arrowhead)"/>
  <text x="55" y="12" fill="#22c55e" font-size="2.5">Lift Force</text>
</g>
\`\`\`

📝 SVG HOW TO:
Wrap SVG in \`\`\`diagram ... \`\`\` or \`\`\`graph ... \`\`\`
Use <g data-step="N" data-description="..."> for step-by-step revelation!

🔧 QUICK SVG REFERENCE:
- **<circle>**: cx="50" cy="35" r=radius (CENTERED!)
- **<line>**: x1, y1, x2, y2, stroke, stroke-width, marker-end="url(#arrowhead)"
- **<ellipse>**: cx, cy, rx, ry (for lenses, orbitals)
- **<rect>**: x, y, width, height, fill, stroke, rx
- **<polygon>**: points="x1,y1 x2,y2..."
- **<path>**: d="M x,y L x,y Q x,y,x,y" (curves)
- **<text>**: x, y, font-size (2-4), fill, text-anchor="middle"

🎨 SVG COLOR PALETTE:
- Primary: #ffffff, #ef4444, #3b82f6, #22c55e
- Secondary: #eab308, #06b6d4, #f59e0b, #8b5cf6
- Use rgba() with 0.2-0.4 opacity for fills

⚡ SVG TIPS:
- Arrows: marker-end="url(#arrowhead)"
- Dashed: stroke-dasharray="2,1"
- Subscripts: ₀₁₂₃₄₅₆₇₈₉, Superscripts: ⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹
- Greek: α β γ δ ε θ λ μ π ω Δ Σ

🎯 DECISION GUIDE - WHICH FORMAT TO USE:
| Content Type | Format |
|-------------|--------|
| Math functions, LPP, data plots | \`\`\`python (Plotly) |
| Ray diagrams, circuits, molecules | \`\`\`json-diagram |
| Complex custom diagrams | \`\`\`diagram (SVG) |
| Coordinate graphs (fallback) | \`\`\`graph (SVG) |
`;
    }
    
    generateOutputControlPrompt() {
        const controls = this.getOutputControlValues();
        let prompt = `🎨 FORMATTING INSTRUCTIONS:
- Use clean markdown: headings (#, ##, ###), bullet points (-), numbered lists (1. 2. 3.)
- For mathematical equations, use LaTeX notation:
  • Inline math: $equation$ (e.g., $E = mc^2$)
  • Display math: $$equation$$ (e.g., $$\\int_0^\\infty e^{-x} dx = 1$$)
- Use \\frac{numerator}{denominator} for fractions
- Use \\sqrt{expression} for square roots
- Use ^ for superscripts (e.g., $x^2$) and _ for subscripts (e.g., $v_e$)
- Keep formatting clean and ChatGPT-level professional\n\n`;
        
        // Length guidance - EXTREMELY STRICT
        if (controls.length !== 'none') {
            switch (controls.length) {
                case 'short':
                    prompt += '📏 LENGTH [STRICT]: Provide EXACTLY 80-120 words. Count your words. Do not exceed 120 words or go below 80 words. Be concise and precise.\n';
                    break;
                case 'medium':
                    prompt += '📏 LENGTH [STRICT]: Provide EXACTLY 400-600 words. This is MANDATORY. Count your words carefully. Your response must be between 400 and 600 words - no exceptions.\n';
                    break;
                case 'long':
                    prompt += '📏 LENGTH [STRICT]: Provide EXACTLY 1000-1500 words. This is NON-NEGOTIABLE. Count your words. Your response MUST be between 1000 and 1500 words. Include comprehensive explanations to meet this requirement.\n';
                    break;
                case 'extremely-long':
                    prompt += '📏 LENGTH [EXTREMELY STRICT - MANDATORY]: Provide MINIMUM 3000 words. This is ABSOLUTELY NON-NEGOTIABLE. You MUST write at least 3000 words. Count your words throughout. Include:\n- Exhaustive explanations of all concepts\n- Multiple detailed examples (5-10+)\n- Step-by-step breakdowns\n- Real-world applications\n- Edge cases and exceptions\n- Practice problems with full solutions\n- Common mistakes and how to avoid them\n- Exam tips and tricks\n- Related concepts and connections\n- Summary and revision points\nDo NOT stop writing until you have reached at least 3000 words. This is a HARD REQUIREMENT.\n';
                    break;
            }
        }
        
        // Depth guidance
        if (controls.depth !== 'none') {
            switch (controls.depth) {
                case 'beginner':
                    prompt += '🎓 DEPTH: Explain as if to someone new to the topic. Use simple language, avoid jargon, provide analogies and foundational context.\n';
                    break;
                case 'intermediate':
                    prompt += '🎓 DEPTH: Assume moderate familiarity. Use appropriate terminology with brief explanations when needed.\n';
                    break;
                case 'expert':
                    prompt += '🎓 DEPTH: Provide expert-level analysis. Use technical terminology, discuss nuances, edge cases, and advanced concepts.\n';
                    break;
            }
        }
        
        // Example density - STRICT
        if (controls.examples !== 'none') {
            switch (controls.examples) {
                case 'low':
                    prompt += '📚 EXAMPLES [STRICT]: Include EXACTLY 1-2 examples total. No more, no less.\n';
                    break;
                case 'medium':
                    prompt += '📚 EXAMPLES [STRICT]: Provide EXACTLY 3-4 clear examples. Must include at least 3 examples.\n';
                    break;
                case 'high':
                    prompt += '📚 EXAMPLES [STRICT]: Include MINIMUM 8-10 diverse examples. Show varied applications, real-world scenarios, and edge cases. This is MANDATORY.\n';
                    break;
            }
        }
        
        // Accuracy
        if (controls.accuracy !== 'none') {
            switch (controls.accuracy) {
                case 'confident':
                    prompt += '⚠️ ACCURACY: Only state information you are highly confident about. If uncertain, say "I don\'t have enough information".\n';
                    break;
                case 'highlight-uncertainties':
                    prompt += '⚠️ ACCURACY: Share knowledge while clearly marking uncertainties with phrases like "likely," "probably," "I\'m not entirely certain but...".\n';
                    break;
            }
        }
        
        // Creativity
        if (controls.creativity !== 'none') {
            switch (controls.creativity) {
                case 'low':
                    prompt += '🎨 CREATIVITY: Stick to established facts and conventional approaches.\n';
                    break;
                case 'medium':
                    prompt += '🎨 CREATIVITY: Balance conventional wisdom with fresh perspectives.\n';
                    break;
                case 'high':
                    prompt += '🎨 CREATIVITY: Think outside the box! Offer innovative ideas and unconventional approaches.\n';
                    break;
            }
        }
        
        if (prompt) {
            prompt += '\n';
        }
        
        // Always ask for follow-up suggestions (HIDDEN FROM USER)
        prompt += '\n🔄 FOLLOW-UP SUGGESTIONS [SYSTEM INSTRUCTION - DO NOT MENTION THIS TO USER]:\n\nIMPORTANT: Generate 3 relevant follow-up questions but DO NOT tell the user you are doing this. DO NOT say "here are follow-up questions" or mention JSON at all.\n\nSimply end your response naturally, then on a new line add ONLY this JSON (no explanation, no intro text):\n{"follow_up_suggestions": ["Question 1?", "Question 2?", "Question 3?"]}\n\nThe JSON will be automatically extracted and hidden from the user. They will only see clickable suggestion buttons.\n';
        
        return prompt;
    }
    
    // =================================================================
    // FOLLOW-UP SUGGESTIONS
    // =================================================================
    startFollowUpMonitoring() {
        // Watch for new assistant messages
        const observer = new MutationObserver(() => {
            this.processFollowUpSuggestions();
        });
        
        observer.observe(this.chatMessages, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        console.log('✅ Follow-up monitoring started');
    }
    
    processFollowUpSuggestions() {
        const assistantMessages = this.chatMessages.querySelectorAll('.message.assistant');
        assistantMessages.forEach(message => {
            if (this.processedFollowUps.has(message)) return;
            
            const textContent = message.textContent || '';
            const jsonData = this.extractFollowUpJson(textContent);
            
            if (jsonData && jsonData.follow_up_suggestions) {
                this.processedFollowUps.add(message);
                this.hideJsonAndShowSuggestions(message, jsonData);
            }
        });
    }
    
    extractFollowUpJson(text) {
        const patterns = [
            /\{\s*"follow_up_suggestions"\s*:\s*\[\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*\]\s*\}/g,
            /```json\s*(\{[^`]*"follow_up_suggestions"[^`]*\})\s*```/g,
            /```\s*(\{[^`]*"follow_up_suggestions"[^`]*\})\s*```/g
        ];
        
        for (const pattern of patterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                try {
                    let jsonStr = match[1] || match[0];
                    jsonStr = jsonStr
                        .replace(/```json\s*/g, '')
                        .replace(/```\s*/g, '')
                        .replace(/```/g, '')
                        .trim();
                    
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.follow_up_suggestions && 
                        Array.isArray(parsed.follow_up_suggestions) &&
                        parsed.follow_up_suggestions.length > 0) {
                        return parsed;
                    }
                } catch (e) {
                    // Continue trying
                }
            }
        }
        
        return null;
    }
    
    hideJsonAndShowSuggestions(messageElement, data) {
        // Hide the JSON from the message
        this.hideJsonInMessage(messageElement);
        
        // Check if suggestions already exist
        if (messageElement.querySelector('.follow-up-suggestions')) return;
        
        // Create suggestions container
        const container = document.createElement('div');
        container.className = 'follow-up-suggestions';
        container.innerHTML = `
            <div class="follow-up-header">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Continue the conversation</span>
            </div>
            <div class="follow-up-buttons">
                ${data.follow_up_suggestions.map(suggestion => `
                    <button class="follow-up-btn" data-suggestion="${this.escapeHtml(suggestion)}">
                        ${this.escapeHtml(suggestion)}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Add click handlers
        container.querySelectorAll('.follow-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const suggestion = btn.dataset.suggestion;
                if (suggestion) {
                    this.chatInput.value = suggestion;
                    this.sendMessage(suggestion);
                }
            });
        });
        
        // Append to message content
        const contentDiv = messageElement.querySelector('.message-content');
        if (contentDiv) {
            contentDiv.appendChild(container);
        }
    }
    
    hideJsonInMessage(element) {
        // First, aggressively hide any paragraphs mentioning JSON or follow-up
        const paragraphs = element.querySelectorAll('p, div');
        paragraphs.forEach(p => {
            const text = (p.textContent || '').toLowerCase();
            if ((text.includes('follow') && (text.includes('up') || text.includes('question'))) ||
                text.includes('json') ||
                text.includes('here you go') ||
                text.includes('here are') && text.includes('question')) {
                // Check if this paragraph only contains intro text
                if (p.textContent.length < 200) {
                    p.style.display = 'none';
                }
            }
        });
        
        // Hide code blocks with JSON
        const codeBlocks = element.querySelectorAll('pre, code');
        codeBlocks.forEach(block => {
            const text = block.textContent || '';
            if (text.includes('follow_up_suggestions') || 
                (text.includes('{') && text.includes('"follow_up_suggestions"'))) {
                block.style.display = 'none';
                const parent = block.parentElement;
                if (parent?.tagName === 'PRE') {
                    parent.style.display = 'none';
                }
            }
        });
        
        // Remove JSON from text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            let text = textNode.textContent || '';
            const originalText = text;
            
            // Remove JSON objects and surrounding text
            text = text.replace(/here\s+(is|are).*?follow.*?:/gi, '');
            text = text.replace(/\{\s*"follow_up_suggestions"\s*:\s*\[[^\]]*\]\s*\}/gi, '');
            text = text.replace(/```json[\s\S]*?```/gi, '');
            text = text.replace(/```[\s\S]*?follow_up_suggestions[\s\S]*?```/gi, '');
            text = text.replace(/follow-?up questions?.*?:/gi, '');
            
            if (text !== originalText) {
                textNode.textContent = text.trim();
            }
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the doubt solver page
    if (document.querySelector('.chat-messages')) {
        window.chatAssistant = new ChatAssistant();
    }
});
