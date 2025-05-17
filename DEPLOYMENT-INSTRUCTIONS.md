# Deployment Instructions for KDP Covers Feature

## What We Fixed

We fixed the KDP Covers feature by:
1. Adding the necessary backend routes that were implemented but not registered in the Express application
2. Creating OpenAI routes for the prompt enhancement features

The key changes were:
1. In `backend/src/index.js` - Added the code to load and register book-cover routes
2. Created `backend/src/routes/openai.js` - Implemented OpenAI integration for prompt enhancement
3. Updated `backend/src/index.js` - Added registration for the OpenAI routes

## Deployment Steps

### 1. Deploy Backend Changes to Railway

To deploy the changes to Railway:

```bash
# From project root
cd backend
railway up
```

### 2. Add Required Environment Variables

Make sure the following environment variables are set in your Railway project:

- `IDEOGRAM_API_KEY`: API key for Ideogram image generation service
- `OPENAI_API_KEY`: API key for OpenAI text and vision services

You can obtain an Ideogram API key by signing up at [https://ideogram.ai](https://ideogram.ai).

You can obtain an OpenAI API key by signing up at [https://platform.openai.com](https://platform.openai.com).

To add the environment variables in Railway:
1. Go to your Railway dashboard
2. Select your backend service
3. Go to Variables tab
4. Add `IDEOGRAM_API_KEY` and `OPENAI_API_KEY` with your respective API keys
5. Deploy again to apply the environment variables

### 3. Testing the Integration

Once deployed, verify that the KDP Covers feature is working:

1. Visit `https://puzzlemakeribral.vercel.app/dashboard/kdp-covers`
2. Test the following functionality:
   - Using the "Enhance Prompt" button to improve your prompt with OpenAI
   - Entering book details (trim size, page count, paper type)
   - Generating a cover using a prompt
   - Creating a full wrap cover with spine
   - Downloading the generated cover

## Troubleshooting

If you continue to experience issues:

1. Check backend logs in Railway for any errors
2. Make sure CORS is properly configured if frontend is on a different domain
3. Verify that the API endpoints are accessible with `curl`:
   ```bash
   curl https://puzzlemakeribral-production.up.railway.app/api/book-cover/test
   curl https://puzzlemakeribral-production.up.railway.app/api/openai/test
   ```
4. If you see API errors in the browser console, check that your API keys are properly set and valid

## API Endpoints Added

These endpoints are now properly registered:

- `GET /api/book-cover/test` - Test if the book cover API is working
- `POST /api/book-cover/calculate-dimensions` - Calculate cover dimensions based on book details
- `POST /api/book-cover/generate-front` - Generate a front cover using AI
- `POST /api/book-cover/assemble-full` - Assemble a full wrap cover (front, spine, back)
- `GET /api/book-cover/download` - Download a cover image in various formats
- `POST /api/openai/enhance-prompt` - Enhance a prompt using OpenAI
- `POST /api/openai/extract-prompt` - Extract a prompt from an image using OpenAI Vision 