# Deployment Instructions for KDP Covers Feature

## What We Fixed

We fixed the KDP Covers feature by making the following improvements:

1. Added robust error handling to all API calls
2. Implemented fallback mechanisms when APIs fail
3. Fixed issues with API URL construction
4. Ensured all buttons are functional
5. Added proper debug logging

## Required Environment Variables

For the KDP Covers feature to work properly, the following environment variables must be set in your Railway project:

- `OPENAI_API_KEY`: API key for OpenAI (used for prompt enhancement)
- `IDEOGRAM_API_KEY`: API key for Ideogram (used for image generation)
- `REPLICATE_API_KEY`: API key for Replicate (used for image enhancement)

You can obtain these API keys from:
- OpenAI: https://platform.openai.com/api-keys
- Ideogram: https://ideogram.ai/api
- Replicate: https://replicate.com/account/api-tokens

## Testing

To test if your backend is properly configured, make these API calls:

```bash
# Test if book cover API is available
curl https://puzzlemakeribral-production.up.railway.app/api/book-cover/test

# Test if OpenAI enhancement is working
curl -X POST https://puzzlemakeribral-production.up.railway.app/api/openai/test

# Test if Ideogram image generation is working
curl -X POST https://puzzlemakeribral-production.up.railway.app/api/ideogram/test
```

## Troubleshooting

If the KDP covers page is not working as expected:

1. **Check the console for errors**: Open the browser developer tools to see if there are any API errors.

2. **Verify environment variables**: Make sure all API keys are properly set in your Railway environment.

3. **Fallback mechanisms**: Even without the APIs working, the page should show placeholder images and continue to function.

4. **API paths**: If you change the backend URL, make sure to update the API_URL in `client/src/lib/bookCoverApi.ts`.

## Maintenance

When adding new features or modifying existing ones:

1. Always implement error handling
2. Add fallback mechanisms for when APIs fail
3. Use verbose logging during development
4. Test both with and without valid API keys

## Deployment Steps

### 1. Deploy Backend Changes to Railway

To deploy the changes to Railway:

```bash
# From project root
cd backend
railway up
```

### 2. Deploy Frontend to Vercel

```bash
# From project root
cd client
vercel --prod
``` 