// Vercel Serverless Function - YouTube Transcript Fetcher
const { YoutubeTranscript } = require('@danielxceron/youtube-transcript');

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
        // Fetch transcript using youtube-transcript library
        console.log('📥 Calling YoutubeTranscript.fetchTranscript...');
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
        
        console.log('✅ Transcript data received, segments:', transcriptData?.length || 0);
        
        if (!transcriptData || transcriptData.length === 0) {
            console.log('❌ No transcript data found');
            return res.status(404).json({ 
                error: 'No transcript available for this video'
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
        console.error('❌ Error stack:', error.stack);
        
        // Provide helpful error message
        let errorMessage = 'Failed to fetch transcript';
        if (error.message?.includes('Transcript is disabled')) {
            errorMessage = 'Transcript is disabled for this video';
        } else if (error.message?.includes('Could not find captions') || error.message?.includes('No transcripts')) {
            errorMessage = 'No captions/subtitles available for this video';
        } else if (error.message?.includes('Video unavailable') || error.message?.includes('private')) {
            errorMessage = 'Video is unavailable or private';
        } else if (error.message?.includes('410')) {
            errorMessage = 'Video has been removed or deleted';
        } else {
            // Include actual error for debugging
            errorMessage = `Failed to fetch transcript: ${error.message}`;
        }
        
        return res.status(500).json({ 
            error: errorMessage,
            details: error.message,
            videoId: videoId
        });
    }
};
