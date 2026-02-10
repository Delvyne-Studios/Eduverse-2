// Vercel Serverless Function - YouTube Transcript Fetcher
// Version: 4.0 - Using youtube-transcript (web scraping)
// This directly scrapes YouTube pages - if you can see captions, this can get them!
const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async function handler(req, res) {
    // Enable CORS for Vercel deployment
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId parameter' });
    }

    console.log('🎬 Fetching transcript for video:', videoId);

    try {
        // Fetch transcript using youtube-transcript (web scraping)
        console.log('📥 Calling YoutubeTranscript.fetchTranscript...');
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
        
        console.log('✅ Transcript data received, segments:', transcriptData?.length || 0);
        
        if (!transcriptData || transcriptData.length === 0) {
            console.log('❌ No transcript data found');
            return res.status(404).json({ 
                error: '⚠️ No transcript available for this video'
            });
        }

        // Combine all transcript segments into a single text
        const transcript = transcriptData.map(item => item.text).join(' ');
        console.log('📝 Combined transcript length:', transcript.length, 'characters');
        
        // Fetch video title from YouTube
        let title = 'Unknown Title';
        try {
            const videoResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            const html = await videoResponse.text();
            const titleMatch = html.match(/<title>(.*?)<\/title>/);
            if (titleMatch) {
                title = titleMatch[1].replace(' - YouTube', '').trim();
            }
            console.log('🎯 Video title:', title);
        } catch (e) {
            console.warn('⚠️ Could not fetch video title:', e.message);
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
};
