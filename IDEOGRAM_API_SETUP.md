# 🎨 Ideogram API Setup for Creative Engine

## Issue
The "Creative Engine" option in the coloring book generator is not working because the `IDEOGRAM_API_KEY` environment variable is missing from the production deployment.

## Current Status
- ✅ **"Artistic AI" (DALL-E)** - Working (uses `OPENAI_API_KEY`)
- ❌ **"Creative Engine" (Ideogram)** - Not working (missing `IDEOGRAM_API_KEY`)

## Solution

### 1. Get Ideogram API Key
1. Go to [Ideogram AI](https://ideogram.ai/api)
2. Sign up or log in to your account
3. Navigate to API settings
4. Generate a new API key
5. Copy the API key (starts with `ideogram_`)

### 2. Add to Production Environment

#### Railway Deployment:
1. Go to your Railway dashboard
2. Select your project: `puzzlemakeribral`
3. Go to **Variables** tab
4. Add new environment variable:
   - **Name:** `IDEOGRAM_API_KEY`
   - **Value:** `your_ideogram_api_key_here`
5. Save and redeploy

#### Alternative Deployment Platforms:
- **Vercel:** Add to Environment Variables in project settings
- **Heroku:** Use `heroku config:set IDEOGRAM_API_KEY=your_key`
- **Docker:** Add to your environment variables or `.env` file

### 3. Verify Setup
After adding the API key:
1. Redeploy your application
2. Go to the coloring book generator
3. Select "Creative Engine" as the AI model
4. Test generating a coloring book
5. The "Creative Engine" option should now work properly

## API Key Format
```
IDEOGRAM_API_KEY=ideogram_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Testing Locally
If you want to test locally:
1. Create a `backend/.env` file
2. Add your Ideogram API key:
   ```
   IDEOGRAM_API_KEY=your_ideogram_api_key_here
   ```
3. Restart your backend server
4. Test the Creative Engine option

## Troubleshooting

### Error: "Access denied. Please verify your API Token is valid"
- Check that the API key is correctly set in environment variables
- Verify the API key is valid and not expired
- Ensure there are no extra spaces or characters in the key

### Error: "Ideogram API key not configured"
- The environment variable is not set or not accessible
- Check the variable name is exactly `IDEOGRAM_API_KEY`
- Restart the application after adding the variable

## Cost Considerations
- Ideogram API charges per image generation
- Monitor your usage to avoid unexpected costs
- Consider setting up usage limits if available

## Support
- Ideogram API Documentation: https://docs.ideogram.ai/
- Ideogram Support: Contact through their platform

---

**Note:** Both AI options will work once this is configured:
- "Artistic AI" uses OpenAI/DALL-E (already working)
- "Creative Engine" uses Ideogram (will work after this setup) 