// Vercel Serverless Function - YouTube Transcript Fetcher
// Version: 3.0 - Using youtubei.js (YouTube's internal InnerTube API)
// This is much more reliable and can access transcripts from almost any video
const { Innertube } = require('youtubei.js');

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
};
