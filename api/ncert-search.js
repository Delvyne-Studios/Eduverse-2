// Vercel Serverless Function - NCERT-specific web search
// Searches NCERT websites and resources for pure NCERT content
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    if (!TAVILY_API_KEY) {
        console.error('❌ Missing TAVILY_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { query, subject = 'all' } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    console.log('📚 NCERT search query:', query);
    console.log('📖 Subject:', subject);

    try {
        // NCERT-specific domains
        const ncertDomains = [
            'ncert.nic.in',
            'ncertbooks.guru',
            'cbse.gov.in',
            'cbse.nic.in'
        ];

        // Build search query with NCERT focus
        const ncertQuery = `${query} NCERT Class 11 ${subject !== 'all' ? subject : 'CBSE'}`;

        // Call Tavily Search API with NCERT domains
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: ncertQuery,
                search_depth: 'advanced',
                include_answer: true,
                include_raw_content: true,
                max_results: 5,
                include_domains: ncertDomains
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Tavily API error:', response.status, errorText);
            throw new Error(`Search API failed: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ NCERT search successful, results:', data.results?.length || 0);
        
        // Format NCERT-specific response
        const searchResults = {
            answer: data.answer || null,
            results: (data.results || []).map(result => ({
                title: result.title,
                url: result.url,
                content: result.content,
                raw_content: result.raw_content,
                score: result.score,
                is_ncert: result.url.includes('ncert') || result.url.includes('cbse')
            })),
            query: ncertQuery,
            source: 'NCERT-focused search'
        };

        return res.status(200).json(searchResults);

    } catch (error) {
        console.error('❌ NCERT search error:', error);
        res.status(500).json({ 
            error: 'Failed to perform NCERT search',
            details: error.message 
        });
    }
}
