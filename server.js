const express = require('express');
const cors = require('cors');
const path = require('path');
const { YoutubeTranscript } = require('@danielxceron/youtube-transcript');

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

// YouTube Transcript API endpoint
app.get('/api/youtube-transcript', async (req, res) => {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId parameter' });
    }

    try {
        // Fetch transcript using youtube-transcript library
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcriptData || transcriptData.length === 0) {
            return res.status(404).json({ 
                error: 'No transcript available for this video'
            });
        }

        // Combine all transcript segments into a single text
        const transcript = transcriptData.map(item => item.text).join(' ');
        
        // Fetch video title from YouTube
        let title = 'Unknown Title';
        try {
            const videoResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            const html = await videoResponse.text();
            const titleMatch = html.match(/<title>(.*?)<\/title>/);
            if (titleMatch) {
                title = titleMatch[1].replace(' - YouTube', '').trim();
            }
        } catch (e) {
            console.warn('Could not fetch video title:', e.message);
        }

        return res.status(200).json({
            success: true,
            title: title,
            videoId: videoId,
            transcript: transcript.trim(),
            language: 'auto-detected',
            duration: null
        });

    } catch (error) {
        console.error('❌ Transcript fetch error:', error);
        
        // Provide helpful error message
        let errorMessage = 'Failed to fetch transcript';
        if (error.message?.includes('Transcript is disabled')) {
            errorMessage = 'Transcript is disabled for this video';
        } else if (error.message?.includes('Could not find captions')) {
            errorMessage = 'No captions/subtitles available for this video';
        } else if (error.message?.includes('Video unavailable')) {
            errorMessage = 'Video is unavailable or private';
        }
        
        return res.status(500).json({ 
            error: errorMessage,
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

