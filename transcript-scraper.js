// Custom YouTube Transcript Scraper
// Directly scrapes captions from YouTube - if you can see them, this gets them!

async function fetchYouTubeTranscript(videoId) {
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
        
        // Extract caption tracks
        const captionTracksMatch = html.match(/"captionTracks":\[([^\]]+)\]/);
        if (!captionTracksMatch) {
            throw new Error('No caption tracks found - video may not have captions enabled');
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
        
        console.log('📜 Fetching captions from:', captionUrl.substring(0, 100) + '...');
        
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
        
        return {
            success: true,
            title: title,
            videoId: videoId,
            transcript: transcript,
            language: 'auto',
            segmentCount: segments.length
        };
        
    } catch (error) {
        console.error('❌ Transcript scraper error:', error.message);
        throw error;
    }
}

module.exports = { fetchYouTubeTranscript };
