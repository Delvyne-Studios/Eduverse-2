# EduVerse Deployment Guide

## Vercel Deployment

### 1. Environment Variables (REQUIRED)

Go to your Vercel project → Settings → Environment Variables and add:

```
OPENROUTER_API_KEY=sk-or-v1-YOUR_NEW_KEY_HERE
OPENROUTER_MODEL=xiaomi/mimo-v2-flash:free
```

**⚠️ CRITICAL:** Without `OPENROUTER_API_KEY`, the API will return 401 errors.

### 2. Get Your OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)
6. Add it to Vercel environment variables

### 3. Framework Settings

- **Framework Preset:** Other (or Static)
- **Build Command:** (leave empty)
- **Output Directory:** (leave empty)
- **Install Command:** npm install

### 4. Verify Deployment

After deploying, check:
- ✅ Homepage loads (index.html)
- ✅ Chat works without 401 errors
- ✅ Chapter context loads properly
- ✅ Diagrams render inline

### 5. Troubleshooting

**401 Errors:**
- Verify `OPENROUTER_API_KEY` is set in Vercel dashboard
- Make sure the API key is valid (not expired/revoked)
- Check Vercel function logs for proxy errors

**Files Not Found:**
- Ensure all files pushed to GitHub main branch
- Check Vercel is connected to correct repo
- Redeploy from Vercel dashboard

**API Proxy Issues:**
- The `/api/openrouter` endpoint is a Vercel serverless function
- It requires environment variables to be set
- Check function logs in Vercel dashboard

### 6. Security Notes

✅ **NEVER commit API keys to Git**  
✅ Use environment variables for all secrets  
✅ The proxy keeps your API key server-side  
✅ `.gitignore` excludes `.env` files  

## Local Development

For local testing:

1. Create `.env` file (copy from `.env.example`)
2. Add your API key to `.env`
3. Run `npm start`
4. Open http://localhost:3000

**Note:** Local server.js is for development only. Vercel uses static hosting + serverless functions.
