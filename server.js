// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { fetchYouTubeTranscript } = require('./transcript-scraper');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files with proper MIME types
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (filePath.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Serve NCERT PDFs with proper headers
app.use('/ncert-textbooks', express.static(path.join(__dirname, 'ncert-textbooks'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
    }
}));

// Serve JSON files with proper content-type
app.get('/*.json', (req, res) => {
    res.type('application/json');
    res.sendFile(path.join(__dirname, req.path));
});

// OpenRouter API Proxy endpoint
app.post('/api/openrouter', async (req, res) => {
    // Get API key from environment variable
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        console.error('❌ Missing OPENROUTER_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error - missing OpenRouter API key' });
    }

    try {
        // Forward request to OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': req.headers['referer'] || 'http://localhost:3000',
                'X-Title': 'EduVerse AI Assistant'
            },
            body: JSON.stringify({
                ...req.body,
                model: req.body.model || 'z-ai/glm-4.5-air:free'
            })
        });

        // Handle streaming responses
        if (req.body.stream && response.ok) {
            // Set headers for streaming
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Pipe the stream from OpenRouter to the client
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                res.write(chunk);
            }

            res.end();
        } else {
            // Non-streaming response
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return res.status(response.status).json(data);
            } else {
                const text = await response.text();
                return res.status(response.status).send(text);
            }
        }
    } catch (error) {
        console.error('❌ OpenRouter proxy error:', error);
        return res.status(502).json({ 
            error: 'Failed to connect to AI service',
            details: error.message 
        });
    }
});

// YouTube Transcript API endpoint using custom scraper
app.get('/api/youtube-transcript', async (req, res) => {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId parameter' });
    }

    console.log('🎬 Fetching transcript for video:', videoId);

    try {
        const result = await fetchYouTubeTranscript(videoId);
        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Transcript fetch error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        
        // Provide helpful error message
        let errorMessage = 'Failed to fetch transcript';
        let statusCode = 500;
        
        // Check for specific error patterns from youtube-transcript
        if (error.message?.includes('Could not find captions') || error.message?.includes('Transcript is disabled')) {
            errorMessage = '⚠️ This video doesn\'t have transcripts/captions available.\\n\\n💡 The video needs to have captions enabled (CC button visible on YouTube).\\n\\n📺 Try: Khan Academy, CrashCourse, TED-Ed, Veritasium - they usually have captions!';
            statusCode = 404;
        } else if (error.message?.includes('Video unavailable') || error.message?.includes('unavailable')) {
            errorMessage = '❌ Video is unavailable, private, or has been removed';
            statusCode = 404;
        } else if (error.message?.includes('age-restricted') || error.message?.includes('age restricted')) {
            errorMessage = '🔞 This video is age-restricted. Try a different video.';
            statusCode = 403;
        } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
            errorMessage = '🚫 Access to this video is restricted. Try a different video.';
            statusCode = 403;
        } else if (error.message?.includes('404') || error.message?.includes('not found')) {
            errorMessage = '❌ Video not found. Check the URL and try again.';
            statusCode = 404;
        } else {
            // Include actual error for debugging
            errorMessage = `⚠️ Could not fetch transcript: ${error.message}`;
        }
        
        return res.status(statusCode).json({ 
            error: errorMessage,
            details: error.message,
            videoId: videoId
        });
    }
});

// Web Search API endpoint using Tavily
app.post('/api/web-search', async (req, res) => {
    const { query, search_depth = 'standard', max_results = 5 } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    if (!TAVILY_API_KEY) {
        console.error('❌ Missing TAVILY_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error - missing Tavily API key' });
    }

    console.log('🔍 Web search query:', query);

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TAVILY_API_KEY}`
            },
            body: JSON.stringify({
                query: query,
                search_depth: search_depth,
                max_results: max_results,
                include_answer: true
            })
        });

        if (!response.ok) {
            throw new Error(`Tavily API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Format results for AI consumption
        const formattedResults = {
            answer: data.answer || 'No direct answer found',
            results: data.results?.map(result => ({
                title: result.title,
                url: result.url,
                content: result.content,
                score: result.score
            })) || [],
            query: query
        };

        return res.status(200).json(formattedResults);

    } catch (error) {
        console.error('❌ Web search error:', error);
        return res.status(500).json({ 
            error: 'Web search failed',
            details: error.message 
        });
    }
});

// NCERT Search API endpoint
app.post('/api/ncert-search', async (req, res) => {
    const { query, subject } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    if (!TAVILY_API_KEY) {
        console.error('❌ Missing TAVILY_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error - missing Tavily API key' });
    }

    // Build NCERT-focused search query
    let searchQuery = query;
    if (subject) {
        searchQuery = `${query} ${subject} NCERT`;
    } else {
        searchQuery = `${query} NCERT CBSE`;
    }

    console.log('📚 NCERT search query:', searchQuery);

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TAVILY_API_KEY}`
            },
            body: JSON.stringify({
                query: searchQuery,
                search_depth: 'advanced',
                max_results: 8,
                include_domains: ['ncert.nic.in', 'cbse.gov.in', 'byjus.com', 'vedantu.com', 'toppr.com'],
                include_answer: true
            })
        });

        if (!response.ok) {
            throw new Error(`Tavily API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Mark official NCERT sources
        const formattedResults = {
            answer: data.answer || 'No direct answer found',
            results: data.results?.map(result => ({
                title: result.title,
                url: result.url,
                content: result.content,
                score: result.score,
                is_ncert: result.url.includes('ncert.nic.in') || result.url.includes('cbse.gov.in')
            })) || [],
            query: query,
            subject: subject
        };

        return res.status(200).json(formattedResults);

    } catch (error) {
        console.error('❌ NCERT search error:', error);
        return res.status(500).json({ 
            error: 'NCERT search failed',
            details: error.message 
        });
    }
});

// Serve landing page for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              🎓 EduVerse Server Running! 🎓                ║
║                                                            ║
║   🌐 Local:   http://localhost:${PORT}                       ║
║   📚 Status:  Ready to serve                               ║
║   🔥 CORS:    Enabled                                      ║
║   🔐 Auth:    InsForge (Google, GitHub, Email/Password)    ║
║                                                            ║
║   Press Ctrl+C to stop the server                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

