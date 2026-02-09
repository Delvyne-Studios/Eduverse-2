// Vercel Serverless Function - YouTube Transcript Fetcher
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
        // Fetch transcript using YouTube's internal API
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await response.text();

        // Extract video title
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'Unknown Title';

        // Extract captions data from the page
        const captionsMatch = html.match(/"captions":(\{.*?\}),/);
        
        if (!captionsMatch) {
            return res.status(404).json({ 
                error: 'No captions available for this video',
                title: title
            });
        }

        const captionsData = JSON.parse(captionsMatch[1]);
        const tracks = captionsData?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!tracks || tracks.length === 0) {
            return res.status(404).json({ 
                error: 'No transcript tracks found',
                title: title
            });
        }

        // Get the first available track (usually auto-generated or English)
        const trackUrl = tracks[0].baseUrl;

        // Fetch the actual transcript
        const transcriptResponse = await fetch(trackUrl);
        const transcriptXml = await transcriptResponse.text();

        // Parse XML to extract text
        const textMatches = transcriptXml.matchAll(/<text[^>]*>(.*?)<\/text>/gs);
        let transcript = '';
        
        for (const match of textMatches) {
            // Decode HTML entities and clean up
            const text = match[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\n/g, ' ')
                .trim();
            
            if (text) {
                transcript += text + ' ';
            }
        }

        if (!transcript) {
            return res.status(404).json({ 
                error: 'Could not extract transcript text',
                title: title
            });
        }

        return res.status(200).json({
            success: true,
            title: title,
            videoId: videoId,
            transcript: transcript.trim(),
            language: tracks[0].languageCode || 'unknown',
            duration: null // Could be extracted from the page if needed
        });

    } catch (error) {
        console.error('❌ Transcript fetch error:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch transcript',
            details: error.message 
        });
    }
}
