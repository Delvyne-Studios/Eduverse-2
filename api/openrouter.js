// Vercel Serverless Function - OpenRouter API Proxy
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Get API key from environment variable
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free';

    if (!OPENROUTER_API_KEY) {
        console.error('❌ Missing OPENROUTER_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Forward request to OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': req.headers['referer'] || 'https://eduverse.vercel.app',
                'X-Title': 'EduVerse AI Assistant'
            },
            body: JSON.stringify({
                ...req.body,
                model: req.body.model || OPENROUTER_MODEL
            })
        });

        // Handle streaming responses
        if (req.body.stream && response.ok) {
            // Set headers for streaming
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Pipe the stream from OpenRouter to the client
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                res.write(chunk);
            }

            res.end();
        } else {
            // Non-streaming response or error response
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return res.status(response.status).json(data);
            } else {
                const text = await response.text();
                return res.status(response.status).send(text);
            }
        }
    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(502).json({ 
            error: 'Failed to connect to AI service',
            details: error.message 
        });
    }
}
