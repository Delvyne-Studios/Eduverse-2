// Vercel Serverless Function - Web Search using Tavily API
// Provides high-quality web search for AI assistant
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    if (!TAVILY_API_KEY) {
        console.error('❌ Missing TAVILY_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error - no search API key' });
    }

    const { query, search_depth = 'advanced', max_results = 5, include_domains = [] } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    console.log('🔍 Web search query:', query);
    console.log('📊 Search depth:', search_depth);

    try {
        // Call Tavily Search API
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: query,
                search_depth: search_depth, // 'basic' or 'advanced'
                include_answer: true,
                include_raw_content: false,
                max_results: max_results,
                include_images: false,
                include_domains: include_domains.length > 0 ? include_domains : undefined
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Tavily API error:', response.status, errorText);
            throw new Error(`Search API failed: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ Search successful, results:', data.results?.length || 0);
        
        // Format response
        const searchResults = {
            answer: data.answer || null,
            results: (data.results || []).map(result => ({
                title: result.title,
                url: result.url,
                content: result.content,
                score: result.score
            })),
            query: query
        };

        return res.status(200).json(searchResults);

    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({ 
            error: 'Failed to perform web search',
            details: error.message 
        });
    }
}
