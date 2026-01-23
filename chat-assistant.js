// =================================================================
// AI CHAT ASSISTANT - CHATBOT INTERFACE
// OpenRouter API Integration with Vision Support
// =================================================================

class ChatAssistant {
    constructor() {
        // OpenRouter API Configuration (now using secure proxy)
        this.apiKey = null; // No longer needed - using serverless function
        this.apiUrl = '/api/openrouter'; // Vercel serverless function proxy
        this.model = 'xiaomi/mimo-v2-flash:free';
        
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
        
        // Extract SVG diagram content (```diagram ... ```)
        const diagramRegex = /```diagram\s*([\s\S]*?)```/gi;
        const graphRegex = /```graph\s*([\s\S]*?)```/gi;
        
        let diagramCount = 0;
        let graphCount = 0;
        
        // Store diagram/graph placeholders and their content
        const visualElements = [];
        
        // Process diagrams (now expects SVG content)
        remainingText = remainingText.replace(diagramRegex, (match, svgContent) => {
            try {
                const diagramId = `diagram-${Date.now()}-${diagramCount++}`;
                
                // Extract title from SVG comment if present
                const titleMatch = svgContent.match(/<!--\s*title:\s*(.+?)\s*-->/i);
                const title = titleMatch ? titleMatch[1] : 'Visual Diagram';
                
                // Store for later rendering
                visualElements.push({
                    type: 'diagram',
                    id: diagramId,
                    content: svgContent.trim(),
                    title: title
                });
                
                // Return inline placeholder that will be replaced in the HTML
                return `<div class="inline-diagram-placeholder" data-diagram-id="${diagramId}"></div>`;
            } catch (e) {
                console.error('Failed to process diagram:', e);
                return match;
            }
        });
        
        // Process graphs (now expects SVG content)
        remainingText = remainingText.replace(graphRegex, (match, svgContent) => {
            try {
                const graphId = `graph-${Date.now()}-${graphCount++}`;
                
                // Extract title from SVG comment if present
                const titleMatch = svgContent.match(/<!--\s*title:\s*(.+?)\s*-->/i);
                const title = titleMatch ? titleMatch[1] : 'Mathematical Graph';
                
                // Store for later rendering
                visualElements.push({
                    type: 'graph',
                    id: graphId,
                    content: svgContent.trim(),
                    title: title
                });
                
                // Return inline placeholder
                return `<div class="inline-graph-placeholder" data-graph-id="${graphId}"></div>`;
            } catch (e) {
                console.error('Failed to process graph:', e);
                return match;
            }
        });
        
        // After content is rendered, replace placeholders with actual diagrams/graphs
        setTimeout(() => {
            visualElements.forEach(element => {
                const placeholder = contentDiv.querySelector(`[data-${element.type}-id="${element.id}"]`);
                if (placeholder) {
                    const container = document.createElement('div');
                    container.className = `${element.type}-embed`;
                    container.id = `container-${element.id}`;
                    placeholder.replaceWith(container);
                    
                    if (element.type === 'diagram' && window.DiagramCanvas) {
                        try {
                            console.log('🎨 Creating DiagramCanvas:', element.id);
                            const canvas = new window.DiagramCanvas(element.id, 320, 220);
                            canvas.create(container);
                            canvas.renderSVG(element.content, element.title);
                            console.log('✅ SVG Diagram rendered successfully:', element.id);
                        } catch (err) {
                            console.error('❌ Error rendering diagram:', err);
                            container.innerHTML = `<div style="padding:20px;color:#ef4444;text-align:center;">Failed to render diagram: ${err.message}</div>`;
                        }
                    } else if (element.type === 'graph' && window.GraphCanvas) {
                        try {
                            console.log('📊 Creating GraphCanvas:', element.id);
                            const graph = new window.GraphCanvas(element.id, 320, 240);
                            graph.create(container);
                            graph.renderSVG(element.content, element.title);
                            console.log('✅ SVG Graph rendered successfully:', element.id);
                        } catch (err) {
                            console.error('❌ Error rendering graph:', err);
                            container.innerHTML = `<div style="padding:20px;color:#ef4444;text-align:center;">Failed to render graph: ${err.message}</div>`;
                        }
                    } else {
                        console.error(`❌ ${element.type === 'diagram' ? 'DiagramCanvas' : 'GraphCanvas'} not found`);
                        container.innerHTML = `<div style="padding:20px;color:#ef4444;text-align:center;">${element.type === 'diagram' ? 'Diagram' : 'Graph'} renderer not loaded</div>`;
                    }
                }
            });
        }, 100);
        
        return { text: remainingText };
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
            
            // Store message
            this.currentMessages.push({
                role: 'assistant',
                content: fullResponse
            });
            
            // Save to history
            const chatIndex = this.chatHistory.findIndex(c => c.id === this.currentChatId);
            if (chatIndex >= 0) {
                this.chatHistory[chatIndex].messages.push({ role: 'assistant', text: fullResponse });
                this.chatHistory[chatIndex].lastMessage = fullResponse.substring(0, 100);
                localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
            }
            
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
        // NEW APPROACH: Let AI identify which chapter it needs, then load that PDF
        console.log('🤖 Asking AI to identify relevant chapter...');
        
        try {
            // Step 1: Ask AI which chapter is relevant to the query
            const chapterList = getChapterListForAI();
            const identificationPrompt = `You are an AI assistant helping with NCERT Class 11 studies.

Here is the COMPLETE list of available NCERT chapters:

${chapterList}

User's question: "${query}"

TASK: Analyze the question carefully:
- If it's a GENERAL question (greetings, casual chat, non-academic) → respond: NONE
- If it's about a topic NOT covered in any chapter → respond: NONE  
- If it's asking for a diagram/visual only (no theory needed) → respond: NONE
- If it requires specific NCERT chapter content → respond with the path (e.g., physics-part1/keph107.pdf)

Be STRICT: Only load chapters when the question genuinely needs that specific NCERT content.

Your response (path or NONE):`;

            // Make API call to identify chapter
            const identificationResponse = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'xiaomi/mimo-v2-flash:free',
                    messages: [{ role: 'user', content: identificationPrompt }],
                    temperature: 0.3,
                    max_tokens: 100
                })
            });

            if (!identificationResponse.ok) {
                console.warn(`⚠️ AI API failed with status ${identificationResponse.status}, using database fallback...`);
                return await this.useDatabaseFallback();
            }

            const identificationData = await identificationResponse.json();
            const aiDecision = identificationData.choices[0].message.content.trim();
            
            console.log(`🤖 AI identified: ${aiDecision}`);

            // Step 2: Parse AI's decision
            if (aiDecision === 'NONE' || aiDecision.includes('NONE')) {
                console.log('📚 No specific chapter needed, using database fallback...');
                return await this.useDatabaseFallback();
            }

            const chapterPath = parseChapterSelection(aiDecision);
            
            if (!chapterPath) {
                console.log('⚠️ Could not parse AI response, using database fallback...');
                return await this.useDatabaseFallback();
            }

            // Step 3: Load the PDF chapter
            console.log(`📖 Loading chapter: ${chapterPath}`);
            const chapterData = await pdfReader.loadChapterFromPath(chapterPath);

            if (!chapterData) {
                console.log('⚠️ Failed to load chapter, using database fallback...');
                return await this.useDatabaseFallback();
            }

            // Step 4: Return chapter context
            console.log(`✅ Chapter loaded successfully!`);
            
            // Show badge to user
            this.showChapterLoadedBadge(chapterData.info);

            return {
                chapterBased: true,
                chapter: chapterData.info,
                content: chapterData.text,
                summary: `Full chapter content from: ${chapterData.info.subject}${chapterData.info.part} - ${chapterData.info.chapter}`,
                subtopics: [`📖 ${chapterData.info.subject}${chapterData.info.part} - ${chapterData.info.chapter}`],
                context: chapterData.text
            };

        } catch (error) {
            console.error('❌ Error in AI chapter identification:', error);
            return await this.useDatabaseFallback();
        }
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
    
    saveChatToHistory(message, image) {
        const chatIndex = this.chatHistory.findIndex(c => c.id === this.currentChatId);
        
        if (chatIndex >= 0) {
            // Update existing chat
            this.chatHistory[chatIndex].messages.push({ role: 'user', text: message, image });
            this.chatHistory[chatIndex].lastMessage = message;
            this.chatHistory[chatIndex].date = new Date().toISOString();
        } else {
            // Create new chat
            this.chatHistory.unshift({
                id: this.currentChatId,
                messages: [{ role: 'user', text: message, image }],
                lastMessage: message,
                date: new Date().toISOString()
            });
        }
        
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        this.renderChatHistory();
    }
    
    renderChatHistory() {
        this.historyList.innerHTML = '';
        
        this.chatHistory.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const date = new Date(chat.date);
            const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            
            item.innerHTML = `
                <div class="history-item-date">${dateStr}</div>
                <div class="history-item-preview">${chat.lastMessage.substring(0, 60)}${chat.lastMessage.length > 60 ? '...' : ''}</div>
            `;
            
            item.addEventListener('click', () => this.loadChat(chat.id));
            this.historyList.appendChild(item);
        });
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
🎨 SVG DIAGRAMS & GRAPHS CAPABILITY:
You can create PROFESSIONAL, DETAILED visual diagrams using **SVG** (NOT JSON commands)!
SVG is perfect - you excel at HTML/SVG. Think in proportions, not pixels.

═══════════════════════════════════════════════════════════════
⭐ QUALITY STANDARDS - YOUR DIAGRAMS MUST BE EXCELLENT! ⭐
═══════════════════════════════════════════════════════════════

✅ SPATIAL AWARENESS IS CRITICAL:
- Calculate positions CAREFULLY - avoid overlapping text/elements
- Use consistent spacing between elements
- Align related elements horizontally/vertically
- Place labels strategically - never covering important features
- Test your mental model: Will text at (x,y) overlap with nearby elements?

✅ STRUCTURAL CLARITY:
- Use proper geometric shapes (ellipse for lenses, rect for orbitals, polygon for shading)
- Maintain accurate proportions (e.g., trigonal angles should look 120°)
- Group related elements logically in data-step groups
- Use stroke-width consistently (0.5-0.8 for main elements, 0.3-0.5 for secondary)

✅ VISUAL HIERARCHY:
- Primary elements: Brighter colors (#ef4444, #22c55e, #3b82f6), stroke-width 0.6-0.8
- Secondary elements: Softer colors (#f59e0b, #06b6d4), stroke-width 0.4-0.6
- Annotations: Smaller font-size (2-2.5), complementary colors
- Backgrounds/fills: Use rgba() with opacity 0.2-0.4 for shading

⚠️ CRITICAL: SVG VIEWBOX COORDINATE SYSTEM:
- ViewBox: **100 × 70** (percentage-like coordinates!)
- Center: **(50, 35)**
- Safe zone: x: 10-90, y: 10-65 (leave margins!)
- This is NOT pixels - think of it as 100 units wide

📐 WHEN TO CREATE DIAGRAMS:
- Physics: Ray diagrams (lens/mirror), circuit diagrams, force diagrams, wave interference
- Chemistry: Molecular orbitals, VSEPR geometry, orbital diagrams, atomic models, reaction mechanisms
- Mathematics: Graphs, geometric figures, LPP regions, transformations
- Biology: Cell structures, anatomical diagrams, ecological relationships

═══════════════════════════════════════════════════════════════
📚 LEARN FROM THESE EXCELLENT EXAMPLES:
═══════════════════════════════════════════════════════════════

🔧 HOW TO CREATE A DIAGRAM:
Wrap SVG elements in \`\`\`diagram ... \`\`\`
Use <g data-step="N" data-description="..."> for step-by-step revelation!

✅ EXAMPLE 1 - Convex Lens Ray Diagram (EXCELLENT SPATIAL LAYOUT):
\`\`\`diagram
<!-- title: Convex Lens Ray Diagram -->

<g data-step="1" data-description="Principal axis and lens">
  <line x1="5" y1="35" x2="95" y2="35" stroke="#ffffff" stroke-width="0.5"/>
  <ellipse cx="50" cy="35" rx="2" ry="15" fill="none" stroke="#06b6d4" stroke-width="0.8"/>
  <circle cx="35" cy="35" r="1" fill="#eab308"/>
  <text x="35" y="40" fill="#eab308" font-size="3" text-anchor="middle">F</text>
  <circle cx="65" cy="35" r="1" fill="#eab308"/>
  <text x="65" y="40" fill="#eab308" font-size="3" text-anchor="middle">F'</text>
</g>

<g data-step="2" data-description="Object placed beyond 2F">
  <line x1="20" y1="35" x2="20" y2="20" stroke="#22c55e" stroke-width="0.8" marker-end="url(#arrowhead)"/>
  <text x="20" y="17" fill="#22c55e" font-size="3" text-anchor="middle">Object</text>
</g>

<g data-step="3" data-description="Ray tracing and image formation">
  <line x1="20" y1="20" x2="50" y2="20" stroke="#ef4444" stroke-width="0.5"/>
  <line x1="50" y1="20" x2="75" y2="45" stroke="#ef4444" stroke-width="0.5"/>
  <line x1="20" y1="20" x2="75" y2="45" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="1,1"/>
  <line x1="75" y1="35" x2="75" y2="45" stroke="#3b82f6" stroke-width="0.8"/>
  <text x="75" y="50" fill="#3b82f6" font-size="3" text-anchor="middle">Image</text>
  <text x="75" y="54" fill="#3b82f6" font-size="2" text-anchor="middle">(Real, Inverted)</text>
</g>
\`\`\`
**Why this is excellent:** Clean layout, no overlaps, rays clearly traced, proper use of colors for different rays, labels don't obscure features.

✅ EXAMPLE 2 - VSEPR Trigonal Bipyramidal PCl₅ (PERFECT GEOMETRY):
\`\`\`diagram
<!-- title: VSEPR - Trigonal Bipyramidal (PCl₅) -->

<g data-step="1" data-description="Central phosphorus atom">
  <circle cx="50" cy="35" r="3" fill="#f59e0b" stroke="#fb923c" stroke-width="0.6"/>
  <text x="50" y="36.5" fill="#ffffff" font-size="2.5" text-anchor="middle" font-weight="bold">P</text>
  <text x="50" y="45" fill="#f59e0b" font-size="2.5" text-anchor="middle">Phosphorus</text>
</g>

<g data-step="2" data-description="Axial chlorine atoms (180°)">
  <line x1="50" y1="35" x2="50" y2="15" stroke="#06b6d4" stroke-width="0.6"/>
  <circle cx="50" cy="13" r="2.5" fill="#06b6d4" opacity="0.7"/>
  <text x="50" y="14.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  <text x="54" y="12" fill="#06b6d4" font-size="2">axial</text>
  
  <line x1="50" y1="35" x2="50" y2="55" stroke="#06b6d4" stroke-width="0.6"/>
  <circle cx="50" cy="57" r="2.5" fill="#06b6d4" opacity="0.7"/>
  <text x="50" y="58.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  <text x="54" y="59" fill="#06b6d4" font-size="2">axial</text>
  <text x="55" y="35" fill="#eab308" font-size="2">180°</text>
</g>

<g data-step="3" data-description="Equatorial chlorine atoms (120°)">
  <line x1="50" y1="35" x2="28" y2="35" stroke="#22c55e" stroke-width="0.6"/>
  <circle cx="25" cy="35" r="2.5" fill="#22c55e" opacity="0.7"/>
  <text x="25" y="36.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  <text x="18" y="38" fill="#22c55e" font-size="1.8">equatorial</text>
  
  <line x1="50" y1="35" x2="64" y2="26" stroke="#22c55e" stroke-width="0.6"/>
  <circle cx="66" cy="24" r="2.5" fill="#22c55e" opacity="0.7"/>
  <text x="66" y="25.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  
  <line x1="50" y1="35" x2="64" y2="44" stroke="#22c55e" stroke-width="0.6"/>
  <circle cx="66" cy="46" r="2.5" fill="#22c55e" opacity="0.7"/>
  <text x="66" y="47.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">Cl</text>
  
  <path d="M 45 35 A 5 5 0 0 1 48 30" fill="none" stroke="#eab308" stroke-width="0.4"/>
  <text x="44" y="30" fill="#eab308" font-size="2">120°</text>
</g>

<g data-step="4" data-description="Complete structure">
  <text x="50" y="66" fill="#ffffff" font-size="3.5" text-anchor="middle" font-weight="bold">PCl₅</text>
  <text x="50" y="70" fill="#818cf8" font-size="2" text-anchor="middle">Trigonal Bipyramidal (sp³d)</text>
</g>
\`\`\`
**Why this is excellent:** Accurate 3D representation in 2D, proper 120° spacing for equatorial, different colors distinguish axial vs equatorial, angle labels placed strategically, subscript notation (₅), no overlapping text.

✅ EXAMPLE 3 - Bohr's Atomic Model (CLEAN CONCENTRIC STRUCTURE):
\`\`\`diagram
<!-- title: Bohr's Atomic Model - Hydrogen -->

<g data-step="1" data-description="Nucleus">
  <circle cx="50" cy="35" r="3" fill="#ef4444" stroke="#ff6b6b" stroke-width="0.5"/>
  <text x="50" y="36.5" fill="#ffffff" font-size="2" text-anchor="middle" font-weight="bold">p⁺</text>
  <text x="50" y="45" fill="#ef4444" font-size="2.5" text-anchor="middle">Nucleus</text>
</g>

<g data-step="2" data-description="First orbit (n=1, ground state)">
  <circle cx="50" cy="35" r="10" fill="none" stroke="#22c55e" stroke-width="0.5" stroke-dasharray="1,0.5"/>
  <circle cx="60" cy="35" r="1.2" fill="#22c55e"/>
  <text x="63" y="36" fill="#22c55e" font-size="2.5">e⁻</text>
  <text x="62" y="32" fill="#22c55e" font-size="2">n=1</text>
  <text x="62" y="40" fill="#22c55e" font-size="1.8">E₁=-13.6eV</text>
</g>

<g data-step="3" data-description="Second orbit (n=2)">
  <circle cx="50" cy="35" r="18" fill="none" stroke="#3b82f6" stroke-width="0.5" stroke-dasharray="1,0.5"/>
  <circle cx="68" cy="35" r="1" fill="#3b82f6" opacity="0.5"/>
  <text x="70" y="35" fill="#3b82f6" font-size="2">n=2</text>
  <text x="70" y="38" fill="#3b82f6" font-size="1.6">E₂=-3.4eV</text>
</g>

<g data-step="4" data-description="Third orbit (n=3) and transitions">
  <circle cx="50" cy="35" r="26" fill="none" stroke="#a855f7" stroke-width="0.5" stroke-dasharray="1,0.5"/>
  <circle cx="76" cy="35" r="1" fill="#a855f7" opacity="0.5"/>
  <text x="78" y="35" fill="#a855f7" font-size="2">n=3</text>
  <text x="78" y="38" fill="#a855f7" font-size="1.6">E₃=-1.5eV</text>
  
  <line x1="68" y1="30" x2="62" y2="33" stroke="#f59e0b" stroke-width="0.5" marker-end="url(#arrowhead)"/>
  <text x="62" y="28" fill="#f59e0b" font-size="2">Emission</text>
  <text x="60" y="24" fill="#f59e0b" font-size="1.8">hν = E₂ - E₁</text>
  
  <text x="50" y="63" fill="#eab308" font-size="3" text-anchor="middle" font-weight="bold">Quantized Energy Levels</text>
</g>
\`\`\`
**Why this is excellent:** Perfect concentric circles (same center), energy values positioned outside orbits to avoid clutter, dashed lines for orbits, electron positions at different angles, proper subscript notation, emission arrow clearly shows transition.

✅ EXAMPLE 4 - Hund's Rule Nitrogen 2p³ (PERFECT ELECTRON FILLING):
\`\`\`diagram
<!-- title: Hund's Rule - Nitrogen 2p³ -->

<g data-step="1" data-description="Empty 2p orbitals">
  <text x="50" y="15" fill="#ffffff" font-size="4" text-anchor="middle" font-weight="bold">Nitrogen (N): 1s² 2s² 2p³</text>
  
  <rect x="25" y="30" width="12" height="8" fill="none" stroke="#06b6d4" stroke-width="0.6"/>
  <text x="31" y="42" fill="#06b6d4" font-size="2.5" text-anchor="middle">2pₓ</text>
  
  <rect x="44" y="30" width="12" height="8" fill="none" stroke="#06b6d4" stroke-width="0.6"/>
  <text x="50" y="42" fill="#06b6d4" font-size="2.5" text-anchor="middle">2p_y</text>
  
  <rect x="63" y="30" width="12" height="8" fill="none" stroke="#06b6d4" stroke-width="0.6"/>
  <text x="69" y="42" fill="#06b6d4" font-size="2.5" text-anchor="middle">2p_z</text>
</g>

<g data-step="2" data-description="First electron - spin up">
  <text x="29" y="34.5" font-size="4" fill="#22c55e">↑</text>
  <text x="20" y="50" fill="#22c55e" font-size="2.5">Electron 1</text>
  <line x1="27" y1="48" x2="29" y2="37" stroke="#22c55e" stroke-width="0.3" marker-end="url(#arrowhead)"/>
</g>

<g data-step="3" data-description="Second electron - spin up (different orbital)">
  <text x="48" y="34.5" font-size="4" fill="#f59e0b">↑</text>
  <text x="39" y="50" fill="#f59e0b" font-size="2.5">Electron 2</text>
  <line x1="46" y1="48" x2="48" y2="37" stroke="#f59e0b" stroke-width="0.3" marker-end="url(#arrowhead)"/>
</g>

<g data-step="4" data-description="Third electron - spin up (maximum multiplicity)">
  <text x="67" y="34.5" font-size="4" fill="#ef4444">↑</text>
  <text x="58" y="50" fill="#ef4444" font-size="2.5">Electron 3</text>
  <line x1="65" y1="48" x2="67" y2="37" stroke="#ef4444" stroke-width="0.3" marker-end="url(#arrowhead)"/>
  
  <text x="50" y="58" fill="#a855f7" font-size="3.5" text-anchor="middle" font-weight="bold">✓ Hund's Rule Satisfied</text>
  <text x="50" y="63" fill="#818cf8" font-size="2.5" text-anchor="middle">Maximum multiplicity: All spins parallel</text>
</g>
\`\`\`
**Why this is excellent:** Equal-sized orbital boxes perfectly aligned, arrows point from labels to orbitals (clear association), each electron in different color, progressive filling shown step-by-step, electron configuration at top, no overlaps.

📊 HOW TO CREATE A GRAPH:
Wrap SVG in \`\`\`graph ... \`\`\`
The graph already has axes at center (50, 37.5) with scale labels.
Graph coordinate system: origin at (50, 37.5), +X right, +Y up (inverted SVG Y)

✅ EXAMPLE 5 - LPP with Constraints (NOTE: Shading complex unbounded regions is HARD):
\`\`\`graph
<!-- title: LPP Minimize Problem -->

<g data-step="1" data-description="Constraint: x + y ≥ 4">
  <line x1="50" y1="12.5" x2="90" y2="37.5" stroke="#ef4444" stroke-width="0.6"/>
  <text x="72" y="22" fill="#ef4444" font-size="2.5">x+y=4</text>
  <circle cx="50" cy="12.5" r="1" fill="#ef4444"/>
  <text x="47" y="10" fill="#ef4444" font-size="2">A(0,4)</text>
  <circle cx="90" cy="37.5" r="1" fill="#ef4444"/>
  <text x="92" y="37" fill="#ef4444" font-size="2">B(4,0)</text>
</g>

<g data-step="2" data-description="Constraint: 2x + y ≥ 6">
  <line x1="50" y1="0" x2="80" y2="37.5" stroke="#22c55e" stroke-width="0.6"/>
  <text x="62" y="15" fill="#22c55e" font-size="2.5">2x+y=6</text>
  <circle cx="50" cy="0" r="1" fill="#22c55e"/>
  <text x="47" y="-2" fill="#22c55e" font-size="2">C(0,6)</text>
  <circle cx="80" cy="37.5" r="1" fill="#22c55e"/>
  <text x="82" y="37" fill="#22c55e" font-size="2">D(3,0)</text>
</g>

<g data-step="3" data-description="Feasible region and corner points">
  <!-- Corner points -->
  <circle cx="50" cy="12.5" r="1.5" fill="#a855f7"/>
  <text x="52" y="14" fill="#a855f7" font-size="2.5" font-weight="bold">(0,4)</text>
  <circle cx="66" cy="4" r="1.5" fill="#a855f7"/>
  <text x="68" y="4" fill="#a855f7" font-size="2.5" font-weight="bold">(2,2)*</text>
  <text x="55" y="60" fill="#eab308" font-size="3" font-weight="bold">Min Z at (2,2) = 10</text>
</g>
\`\`\`
**Note about LPP:** Shading unbounded feasible regions correctly is VERY HARD - polygon points must be calculated precisely. It's often better to just mark corner points clearly and label the optimal solution. If you do shade, use semi-transparent fills: rgba(139, 92, 246, 0.25).

🎯 COORDINATE CONVERSION FOR GRAPHS:
Graph coords (x, y) → SVG coords:
- Origin: Graph (0,0) = SVG (50, 37.5)
- X-axis: Graph (x,0) = SVG (50 + x*10, 37.5)
- Y-axis: Graph (0,y) = SVG (50, 37.5 - y*6.25)
- General: SVG_X = 50 + graph_x * 10, SVG_Y = 37.5 - graph_y * 6.25

🎯 SVG POSITIONING GUIDE (ViewBox 100×70):
| Position | X | Y | Use Case |
|----------|---|---|----------|
| Center | 50 | 35 | Nucleus, central atom, lens |
| Top-left | 10 | 10 | Text labels, legends |
| Top-right | 90 | 10 | Energy values, notes |
| Bottom-left | 10 | 60 | Titles, descriptors |
| Bottom-right | 90 | 60 | Results, conclusions |
| Left edge | 15-20 | 35 | Objects, starting points |
| Right edge | 75-85 | 35 | Images, end points |

🎨 AVAILABLE SVG ELEMENTS:
- **<line>**: x1, y1, x2, y2, stroke, stroke-width, stroke-dasharray, marker-end
- **<circle>**: cx, cy, r, fill, stroke, opacity
- **<ellipse>**: cx, cy, rx, ry (perfect for lenses, orbitals)
- **<rect>**: x, y, width, height, fill, stroke, rx (rounded corners)
- **<polygon>**: points="x1,y1 x2,y2 x3,y3..." (for shading, closed shapes)
- **<path>**: d="M x,y L x,y Q x,y,x,y" (for curves, arcs)
- **<text>**: x, y, font-size, fill, text-anchor="start|middle|end", font-weight
- **<g data-step="N" data-description="...">**: Group for step-by-step animation

🎨 COLOR PALETTE (Use consistently):
- **Primary:** White #ffffff, Red #ef4444, Blue #3b82f6, Green #22c55e
- **Secondary:** Yellow #eab308, Cyan #06b6d4, Orange #f59e0b, Purple #8b5cf6, Pink #ec4899
- **Accents:** Indigo #818cf8, Lime #10b981, Amber #fb923c
- **Opacity:** Use rgba() with 0.2-0.4 for fills, 0.5-0.7 for secondary elements

⚡ ADVANCED TECHNIQUES:
1. **Arrows**: \`marker-end="url(#arrowhead)"\` on any line
2. **Dashed lines**: \`stroke-dasharray="2,1"\` (orbit) or "1,1" (construction)
3. **Subscripts**: Use UTF-8: ₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉ (e.g., H₂O, 2p₃)
4. **Superscripts**: Use UTF-8: ⁺ ⁻ ⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ (e.g., p⁺, e⁻, x²)
5. **Greek letters**: α β γ δ ε ζ η θ λ μ ν π ρ σ τ φ χ ψ ω Δ Σ Ω
6. **Transparency**: Use opacity="0.5" or rgba(r,g,b,0.3)
7. **Rounded corners**: rx="2" on rectangles
8. **Text alignment**: text-anchor="middle" centers text at x coordinate

⚡ SPACING & SIZING BEST PRACTICES:
- **Font sizes**: Title 3.5-4, Main text 2.5-3, Labels 2-2.5, Annotations 1.8-2
- **Stroke widths**: Primary 0.6-0.8, Secondary 0.4-0.5, Fine details 0.3
- **Circle radius**: Atoms 2-3, Points 0.8-1.5, Nuclei 3-4
- **Minimum spacing**: 5 units between unrelated elements
- **Text padding**: Place at least 2 units away from shapes

⚠️ CRITICAL DO NOT DO:
- ❌ Overlap text labels - calculate positions carefully!
- ❌ Use inconsistent scales - if one circle is r=3 for an atom, all should be
- ❌ Place elements at edges (x<5 or x>95, y<5 or y>65)
- ❌ Use tiny fonts (<1.8) or huge fonts (>4.5)
- ❌ Mix coordinate systems - stay in ViewBox 100×70
- ❌ Forget to close tags properly
- ❌ Use JSON commands or canvas API

✅ QUALITY CHECKLIST BEFORE SUBMITTING:
□ All text is readable and doesn't overlap
□ Elements are properly spaced (no crowding)
□ Colors are consistent and meaningful
□ Geometry is accurate (angles, proportions)
□ Step-by-step groups are logical
□ Labels clearly identify all parts
□ Coordinate calculations are correct
□ SVG tags are properly closed
□ ViewBox stays within 5-95, 5-65
□ Font sizes are 2-4 range
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
