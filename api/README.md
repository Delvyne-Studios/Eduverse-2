# Vercel Serverless API Functions

This directory contains serverless functions deployed to Vercel.

## Dependencies

Each function has access to the dependencies listed in `package.json`:
- `@danielxceron/youtube-transcript` - YouTube transcript fetching library (v1.2.6)

## Environment Variables

Required environment variables:
- `OPENROUTER_API_KEY` - API key for OpenRouter AI service

## Functions

### youtube-transcript.js
Fetches YouTube video transcripts using the youtube-transcript library.
- Method: GET
- Query params: `videoId`
- Returns: JSON with transcript text and metadata

### openrouter.js
Proxy for OpenRouter AI API requests.
- Method: POST
- Body: OpenRouter API request payload
- Returns: OpenRouter API response
