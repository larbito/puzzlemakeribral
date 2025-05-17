# Deployment Instructions for KDP Covers Feature

## What We Fixed

We fixed the KDP Covers feature by adding the necessary backend routes that were implemented but not registered in the Express application.

The key change was in `backend/src/index.js` where we:
1. Added the code to load the book-cover routes
2. Registered the routes at `/api/book-cover`
3. Added the routes to the API documentation

## Deployment Steps

### 1. Deploy Backend Changes to Railway

To deploy the changes to Railway:

```bash
# From project root
cd backend
railway up
```

### 2. Add Required Environment Variables

Make sure the following environment variable is set in your Railway project:

- `IDEOGRAM_API_KEY`: API key for Ideogram image generation service

You can obtain an API key by signing up at [https://ideogram.ai](https://ideogram.ai) and creating an API key in your account settings.

To add the environment variable in Railway:
1. Go to your Railway dashboard
2. Select your backend service
3. Go to Variables tab
4. Add `IDEOGRAM_API_KEY` with your API key value
5. Deploy again to apply the environment variables

### 3. Testing the Integration

Once deployed, verify that the KDP Covers feature is working:

1. Visit `https://puzzlemakeribral.vercel.app/dashboard/kdp-covers`
2. Test the following functionality:
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
   ```

## API Endpoints Added

These endpoints are now properly registered:

- `GET /api/book-cover/test` - Test if the API is working
- `POST /api/book-cover/calculate-dimensions` - Calculate cover dimensions based on book details
- `POST /api/book-cover/generate-front` - Generate a front cover using AI
- `POST /api/book-cover/assemble-full` - Assemble a full wrap cover (front, spine, back)
- `GET /api/book-cover/download` - Download a cover image in various formats 