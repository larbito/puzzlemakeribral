# Setting Up Vectorizer.AI API Key in Railway

This guide explains how to set up the Vectorizer.AI API credentials as environment variables in your Railway deployment.

## Prerequisites

1. You must have a Vectorizer.AI account
2. A Railway account with the project already set up and deployed
3. Admin access to your Railway project

## Getting Vectorizer.AI API Credentials

1. Visit [Vectorizer.AI](https://vectorizer.ai) and create an account or log in
2. Navigate to your account settings or API section
3. Locate your API credentials - you will need both the API ID and API Secret
   - The API ID typically looks like: `vkwdt19mmgyspjb`
   - The API Secret is a longer string like: `bcdostpk73s4ec6lubl3hl7gshsg3a3r85ka5i3423va7hlkhqj4`
4. Keep these credentials secure - they're used to authenticate with the Vectorizer.AI API

## Adding the API Credentials to Railway

1. Log in to your [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Navigate to the "Variables" tab
4. Click "New Variable"
5. Enter the following:
   - **Name**: `VECTORIZER_API_ID`
   - **Value**: Your API ID from Vectorizer.AI (e.g., `vkwdt19mmgyspjb`)
6. Click "Add" to save this variable
7. Click "New Variable" again
8. Enter the following:
   - **Name**: `VECTORIZER_API_SECRET`
   - **Value**: Your API Secret from Vectorizer.AI
9. Click "Add" to save this variable

The variables should appear in your list of environment variables.

## Verifying the Setup

1. After adding the variables, Railway will automatically redeploy your application
2. To verify the key is working:
   - Navigate to your T-shirt Designer page
   - Generate a new design
   - Click the "Convert to SVG" button
   - If the vectorization process completes successfully, your API credentials are working

## Troubleshooting

If you encounter issues:

1. **Authentication Error**: Make sure both the API ID and API Secret are entered correctly with no leading/trailing spaces
2. **Missing API Credentials Error**: Confirm the variable names are exactly `VECTORIZER_API_ID` and `VECTORIZER_API_SECRET`
3. **Authorization Failed**: Verify your Vectorizer.AI account is active and the API credentials are valid

## Usage Notes

- The free tier of Vectorizer.AI may have limitations on the number of conversions
- For production use, consider upgrading to a paid plan based on your expected usage
- The API credentials are securely stored in Railway and never exposed to the client-side code 