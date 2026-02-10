// Vercel Serverless Function - YouTube Transcript Fetcher
// Version: 5.0 - Custom scraper (directly extracts from YouTube page)
// If you can see captions on YouTube, this WILL get them!

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
        // Fetch the video page
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log('📥 Fetching:', videoUrl);
        
        const response = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch video page`);
        }
        
        const html = await response.text();
        
        // Extract video title
        let title = 'Unknown Title';
        const titleMatch = html.match(/"title":"([^"]+)"/);
        if (titleMatch) {
            title = titleMatch[1].replace(/\\u0026/g, '&').replace(/\\\\/g, '');
        }
        console.log('🎯 Video title:', title);
        
        // Extract caption tracks
        const captionTracksMatch = html.match(/"captionTracks":\[([^\]]+)\]/);
        if (!captionTracksMatch) {
            console.log('❌ No caption tracks found');
            return res.status(404).json({ 
                error: '⚠️ No captions/transcripts available for this video.\\n\\n💡 Make sure the video has captions enabled (CC button visible on YouTube).'
            });
        }
        
        // Parse the first caption track URL
        const captionData = captionTracksMatch[0];
        const baseUrlMatch = captionData.match(/"baseUrl":"([^"]+)"/);
        
        if (!baseUrlMatch) {
            throw new Error('Could not extract caption URL');
        }
        
        // Decode the URL (it has escaped characters)
        let captionUrl = baseUrlMatch[1]
            .replace(/\\u0026/g, '&')
            .replace(/\\\//g, '/');
        
        console.log('📜 Fetching captions...');
        
        // Fetch the caption data (XML format)
        const captionResponse = await fetch(captionUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!captionResponse.ok) {
            throw new Error('Failed to fetch caption data');
        }
        
        const captionXml = await captionResponse.text();
        
        // Parse the XML to extract text
        const textMatches = captionXml.matchAll(/<text[^>]*>([^<]+)<\/text>/g);
        const segments = [];
        
        for (const match of textMatches) {
            let text = match[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\n/g, ' ')
                .trim();
            
            if (text) {
                segments.push(text);
            }
        }
        
        if (segments.length === 0) {
            throw new Error('No caption text found in the transcript');
        }
        
        const transcript = segments.join(' ');
        console.log('✅ Transcript extracted:', segments.length, 'segments,', transcript.length, 'characters');

        return res.status(200).json({
            success: true,
            title: title,
            videoId: videoId,
            transcript: transcript,
            language: 'auto',
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
