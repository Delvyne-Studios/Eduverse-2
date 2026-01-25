// =================================================================
// CHAT MANAGER - Advanced Chat Context & History Management
// Auto-renaming, Message Summaries, Reference Chats, Context Tracking
// =================================================================

class ChatManager {
    constructor() {
        // Context window tracking
        this.contextWindow = {
            maxTokens: 128000, // Model's context window size
            usedTokens: 0,
            messageHistory: [],
            estimatedTokensPerChar: 0.25 // Rough estimate
        };
        
        // Message summaries for context
        this.messageSummaries = new Map(); // chatId -> [{code, summary}]
        
        // Reference chats
        this.referencedChats = new Set();
        
        // Initialize
        this.loadSummaries();
    }

    // =================================================================
    // CONTEXT WINDOW TRACKING
    // =================================================================
    
    /**
     * Estimate tokens for a string
     */
    estimateTokens(text) {
        if (!text) return 0;
        // Rough estimate: ~4 chars per token for English
        return Math.ceil(text.length / 4);
    }

    /**
     * Calculate total context usage
     */
    calculateContextUsage(systemPrompt, messages, chapterContext = null) {
        let totalTokens = 0;
        
        // System prompt tokens
        totalTokens += this.estimateTokens(systemPrompt);
        
        // Messages tokens
        for (const msg of messages) {
            if (typeof msg.content === 'string') {
                totalTokens += this.estimateTokens(msg.content);
            } else if (Array.isArray(msg.content)) {
                for (const part of msg.content) {
                    if (part.type === 'text') {
                        totalTokens += this.estimateTokens(part.text);
                    } else if (part.type === 'image_url') {
                        totalTokens += 765; // Standard image token cost
                    }
                }
            }
        }
        
        // Chapter context tokens
        if (chapterContext) {
            totalTokens += this.estimateTokens(chapterContext);
        }
        
        // Add summaries from referenced chats
        for (const chatId of this.referencedChats) {
            const summaries = this.messageSummaries.get(chatId);
            if (summaries) {
                for (const s of summaries.slice(-15)) { // Last 15 summaries
                    totalTokens += this.estimateTokens(s.summary);
                }
            }
        }
        
        this.contextWindow.usedTokens = totalTokens;
        
        return {
            usedTokens: totalTokens,
            maxTokens: this.contextWindow.maxTokens,
            percentage: Math.min(100, (totalTokens / this.contextWindow.maxTokens) * 100),
            remaining: this.contextWindow.maxTokens - totalTokens
        };
    }

    /**
     * Get context usage display HTML
     */
    getContextUsageDisplay(systemPrompt, messages, chapterContext) {
        const usage = this.calculateContextUsage(systemPrompt, messages, chapterContext);
        
        const colorClass = usage.percentage > 80 ? 'danger' : 
                          usage.percentage > 60 ? 'warning' : 'success';
        
        return `
            <div class="context-usage-display">
                <div class="context-usage-bar">
                    <div class="context-usage-fill ${colorClass}" style="width: ${usage.percentage}%"></div>
                </div>
                <div class="context-usage-text">
                    <span class="context-tokens">${this.formatNumber(usage.usedTokens)} / ${this.formatNumber(usage.maxTokens)} tokens</span>
                    <span class="context-percentage">${usage.percentage.toFixed(1)}%</span>
                </div>
            </div>
        `;
    }

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    // =================================================================
    // AUTO CHAT NAMING
    // =================================================================
    
    /**
     * Generate chat name from first message using AI
     */
    async generateChatName(firstMessage, chatAssistant) {
        try {
            const prompt = `Based on this user message, generate a SHORT chat title (2-5 words max). 
Just return the title, nothing else.

User message: "${firstMessage.substring(0, 200)}"

Examples of good titles:
- "Projectile Motion Help"
- "Chemical Bonding Doubt"
- "Integration Practice"
- "Thermodynamics Concepts"

Your title:`;

            const response = await fetch(chatAssistant.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: chatAssistant.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 20
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate chat name');
            }

            const data = await response.json();
            let chatName = data.choices[0].message.content.trim();
            
            // Clean up the name
            chatName = chatName.replace(/^["']|["']$/g, ''); // Remove quotes
            chatName = chatName.replace(/^\d+\.\s*/, ''); // Remove numbering
            chatName = chatName.substring(0, 40); // Max 40 chars
            
            return chatName || 'New Chat';
        } catch (error) {
            console.error('Error generating chat name:', error);
            // Fallback: Extract keywords from message
            return this.generateFallbackName(firstMessage);
        }
    }

    /**
     * Fallback name generation without AI
     */
    generateFallbackName(message) {
        const keywords = ['physics', 'chemistry', 'math', 'calculus', 'optics', 
                         'mechanics', 'thermodynamics', 'organic', 'inorganic',
                         'integration', 'differentiation', 'matrices', 'vectors',
                         'electrostatics', 'magnetism', 'waves', 'atoms', 'bonds'];
        
        const lowerMessage = message.toLowerCase();
        
        for (const keyword of keywords) {
            if (lowerMessage.includes(keyword)) {
                return keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' Question';
            }
        }
        
        // Extract first few words
        const words = message.split(/\s+/).slice(0, 4).join(' ');
        return words.length > 30 ? words.substring(0, 30) + '...' : words;
    }

    // =================================================================
    // MESSAGE SUMMARIES
    // =================================================================
    
    /**
     * Generate summary for a message exchange
     */
    async generateMessageSummary(userMessage, aiResponse, chatAssistant) {
        try {
            const prompt = `Summarize this exchange in ONE short sentence (max 20 words):

User: "${userMessage.substring(0, 300)}"
AI: "${aiResponse.substring(0, 500)}"

Summary:`;

            const response = await fetch(chatAssistant.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: chatAssistant.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 50
                })
            });

            if (!response.ok) {
                return this.generateFallbackSummary(userMessage, aiResponse);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error generating summary:', error);
            return this.generateFallbackSummary(userMessage, aiResponse);
        }
    }

    /**
     * Fallback summary without AI
     */
    generateFallbackSummary(userMessage, aiResponse) {
        const userSnippet = userMessage.substring(0, 50).replace(/\n/g, ' ');
        return `Asked about: ${userSnippet}...`;
    }

    /**
     * Add summary to chat
     */
    addSummary(chatId, summary, messageIndex) {
        if (!this.messageSummaries.has(chatId)) {
            this.messageSummaries.set(chatId, []);
        }
        
        const code = this.generateMessageCode(chatId, messageIndex);
        this.messageSummaries.get(chatId).push({
            code: code,
            summary: summary,
            timestamp: Date.now(),
            index: messageIndex
        });
        
        this.saveSummaries();
        return code;
    }

    /**
     * Generate unique code for a message
     */
    generateMessageCode(chatId, index) {
        const prefix = chatId.substring(0, 4).toUpperCase();
        return `${prefix}-${String(index).padStart(3, '0')}`;
    }

    /**
     * Get message by code
     */
    getMessageByCode(code) {
        for (const [chatId, summaries] of this.messageSummaries) {
            const found = summaries.find(s => s.code === code);
            if (found) {
                return { chatId, ...found };
            }
        }
        return null;
    }

    /**
     * Get last N summaries for a chat
     */
    getRecentSummaries(chatId, count = 20) {
        const summaries = this.messageSummaries.get(chatId);
        if (!summaries) return [];
        return summaries.slice(-count);
    }

    /**
     * Build context from summaries
     */
    buildSummaryContext(chatId, includeReferences = true) {
        let context = '';
        
        // Current chat summaries
        const summaries = this.getRecentSummaries(chatId, 20);
        if (summaries.length > 0) {
            context += '📝 Previous conversation context:\n';
            for (const s of summaries) {
                context += `[${s.code}] ${s.summary}\n`;
            }
            context += '\n';
        }
        
        // Referenced chat summaries
        if (includeReferences && this.referencedChats.size > 0) {
            context += '🔗 Referenced chats context:\n';
            for (const refChatId of this.referencedChats) {
                if (refChatId === chatId) continue;
                const refSummaries = this.getRecentSummaries(refChatId, 15);
                for (const s of refSummaries) {
                    context += `[${s.code}] ${s.summary}\n`;
                }
            }
            context += '\n';
        }
        
        context += 'To access full content of any message, use its code (e.g., ABCD-001)\n';
        
        return context;
    }

    // =================================================================
    // REFERENCE CHATS
    // =================================================================
    
    /**
     * Add a chat as reference
     */
    addReferenceChat(chatId) {
        this.referencedChats.add(chatId);
        console.log(`📎 Added reference chat: ${chatId}`);
    }

    /**
     * Remove a reference chat
     */
    removeReferenceChat(chatId) {
        this.referencedChats.delete(chatId);
    }

    /**
     * Clear all references
     */
    clearReferences() {
        this.referencedChats.clear();
    }

    /**
     * Check if chat is referenced
     */
    isReferenced(chatId) {
        return this.referencedChats.has(chatId);
    }

    // =================================================================
    // PERSISTENCE
    // =================================================================
    
    /**
     * Save summaries to localStorage
     */
    saveSummaries() {
        const data = {};
        for (const [chatId, summaries] of this.messageSummaries) {
            data[chatId] = summaries;
        }
        localStorage.setItem('chatSummaries', JSON.stringify(data));
    }

    /**
     * Load summaries from localStorage
     */
    loadSummaries() {
        try {
            const data = localStorage.getItem('chatSummaries');
            if (data) {
                const parsed = JSON.parse(data);
                for (const [chatId, summaries] of Object.entries(parsed)) {
                    this.messageSummaries.set(chatId, summaries);
                }
            }
        } catch (error) {
            console.error('Error loading summaries:', error);
        }
    }

    /**
     * Delete summaries for a chat
     */
    deleteChatSummaries(chatId) {
        this.messageSummaries.delete(chatId);
        this.referencedChats.delete(chatId);
        this.saveSummaries();
    }
}

// Global instance
window.ChatManager = ChatManager;
window.chatManager = new ChatManager();
