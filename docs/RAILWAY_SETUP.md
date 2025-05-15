# Setting Up Vectorizer.AI API Key in Railway

This guide explains how to set up the Vectorizer.AI API key as an environment variable in your Railway deployment.

## Prerequisites

1. You must have a Vectorizer.AI account
2. A Railway account with the project already set up and deployed
3. Admin access to your Railway project

## Getting a Vectorizer.AI API Key

1. Visit [Vectorizer.AI](https://vectorizer.ai) and create an account or log in
2. Navigate to your account settings or API section
3. Create or copy your API key
4. Keep this key secure - it's used to authenticate with the Vectorizer.AI API

## Adding the API Key to Railway

1. Log in to your [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Navigate to the "Variables" tab
4. Click "New Variable"
5. Enter the following:
   - **Name**: `VECTORIZER_API_KEY`
   - **Value**: Paste your Vectorizer.AI API key
6. Click "Add" to save the variable

The variable should appear in your list of environment variables.

## Verifying the Setup

1. After adding the variable, Railway will automatically redeploy your application
2. To verify the key is working:
   - Navigate to your T-shirt Designer page
   - Generate a new design
   - Click the "Convert to SVG" button
   - If the vectorization process completes successfully, your API key is working

## Troubleshooting

If you encounter issues:

1. **API Key Error**: Make sure the key is entered correctly with no leading/trailing spaces
2. **Missing API Key Error**: Confirm the variable name is exactly `VECTORIZER_API_KEY`
3. **Authorization Failed**: Verify your Vectorizer.AI account is active and the API key is valid

## Usage Notes

- The free tier of Vectorizer.AI may have limitations on the number of conversions
- For production use, consider upgrading to a paid plan based on your expected usage
- The API key is securely stored in Railway and never exposed to the client-side code 