// Vercel Serverless Function - YouTube Transcript Fetcher
import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

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
}
