// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

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

// YouTube Transcript API endpoint using youtubei.js
app.get('/api/youtube-transcript', async (req, res) => {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId parameter' });
    }

    console.log('🎬 Fetching transcript for video:', videoId);

    try {
        // Dynamically import youtubei.js
        const { Innertube } = await import('youtubei.js');
        
        // Initialize Innertube (YouTube's internal API)
        console.log('🔧 Initializing Innertube...');
        const youtube = await Innertube.create({
            lang: 'en',
            location: 'US',
            retrieve_player: false
        });
        
        console.log('📥 Fetching video info...');
        const info = await youtube.getInfo(videoId);
        
        // Get video title
        const title = info.basic_info?.title || 'Unknown Title';
        console.log('🎯 Video title:', title);
        
        // Get transcript/captions
        console.log('📜 Fetching transcript...');
        const transcriptData = await info.getTranscript();
        
        if (!transcriptData || !transcriptData.transcript) {
            console.log('❌ No transcript available');
            return res.status(404).json({ 
                error: '⚠️ No transcript/captions available for this video.\n\n💡 The video creator may have disabled captions, or the video may not have any subtitles.'
            });
        }
        
        console.log('✅ Transcript segments received:', transcriptData.transcript.content?.body?.initial_segments?.length || 0);
        
        // Extract text from transcript segments
        const segments = transcriptData.transcript.content?.body?.initial_segments || [];
        if (segments.length === 0) {
            return res.status(404).json({ 
                error: '⚠️ Transcript is empty or unavailable for this video.'
            });
        }
        
        // Combine all segments into one transcript
        const transcript = segments
            .map(segment => segment.snippet?.text?.toString() || '')
            .filter(text => text.trim().length > 0)
            .join(' ');
        
        console.log('📝 Combined transcript length:', transcript.length, 'characters');
        
        if (transcript.length === 0) {
            return res.status(404).json({ 
                error: '⚠️ Could not extract transcript text from video.'
            });
        }

        return res.status(200).json({
            success: true,
            title: title,
            videoId: videoId,
            transcript: transcript.trim(),
            language: transcriptData.transcript.content?.body?.language || 'auto',
            duration: info.basic_info?.duration || null
        });

    } catch (error) {
        console.error('❌ Transcript fetch error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        
        // Provide helpful error message
        let errorMessage = 'Failed to fetch transcript';
        let statusCode = 500;
        
        if (error.message?.includes('Video unavailable') || error.message?.includes('This video is unavailable')) {
            errorMessage = '❌ Video is unavailable, private, or has been removed';
            statusCode = 404;
        } else if (error.message?.includes('Transcript is disabled') || error.message?.includes('No captions')) {
            errorMessage = '⚠️ This video doesn\'t have transcripts/captions enabled.\n\n💡 Try another video with the "CC" button';
            statusCode = 404;
        } else if (error.message?.includes('age-restricted') || error.message?.includes('age restricted')) {
            errorMessage = '🔞 This video is age-restricted. Try a different video.';
            statusCode = 403;
        } else if (error.message?.includes('country')) {
            errorMessage = '🌍 This video is not available in your region';
            statusCode = 403;
        } else if (error.message?.includes('members-only') || error.message?.includes('membership')) {
            errorMessage = '👥 This is a members-only video';
            statusCode = 403;
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

