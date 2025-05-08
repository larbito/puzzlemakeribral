import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Global try/catch to log any unexpected errors
  try {
    console.log('Handler invoked. Method:', req.method);
    console.log('Request headers:', req.headers);

    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check environment variables
    console.log('Environment variables:', {
      hasIdeogramKey: !!process.env.IDEOGRAM_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });

    // Check for API key
    const API_KEY = process.env.IDEOGRAM_API_KEY;
    if (!API_KEY) {
      console.error('API key not found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Validate request body
    if (!req.body || !req.body.prompt) {
      console.error('Missing prompt in request body:', req.body);
      return res.status(400).json({ error: 'Prompt is required in the request body' });
    }

    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Format request body according to Ideogram API requirements
    const requestBody = {
      image_request: {
        prompt: req.body.prompt,
        model: "V_2",
        aspect_ratio: req.body.aspect_ratio || "ASPECT_3_4",
        magic_prompt_option: "AUTO",
        style_type: req.body.style?.toUpperCase() || "AUTO",
        negative_prompt: req.body.negative_prompt,
        seed: req.body.seed
      }
    };

    console.log('Making request to Ideogram API with:', {
      url: 'https://api.ideogram.ai/api/v1/images/generate',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': '***' // Masked for security
      },
      body: requestBody
    });

    // Use a fallback placeholder in development mode if API fails
    const shouldUseFallback = process.env.NODE_ENV === 'development' && process.env.USE_FALLBACK === 'true';

    try {
      const response = await fetch('https://api.ideogram.ai/api/v1/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Ideogram API response status:', response.status);
      console.log('Ideogram API response headers:', Object.fromEntries(response.headers));

      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      // TEMP: If debugRaw query param is present, return the raw response for debugging
      if (req.query && req.query.debugRaw !== undefined) {
        return res.status(200).json({ raw: responseText });
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        
        if (shouldUseFallback) {
          // Return a fallback response in development
          return res.status(200).json({ 
            fallback: true,
            images: [{ url: `https://dummyimage.com/1024x1365/252A37/FFFFFF?text=${encodeURIComponent(req.body.prompt)}` }]
          });
        }
        
        return res.status(500).json({
          error: 'Invalid JSON response from Ideogram API',
          rawResponse: responseText
        });
      }

      if (!response.ok) {
        console.error('Ideogram API error:', {
          status: response.status,
          data: responseData
        });
        
        if (shouldUseFallback) {
          // Return a fallback response in development
          return res.status(200).json({ 
            fallback: true,
            images: [{ url: `https://dummyimage.com/1024x1365/252A37/FFFFFF?text=${encodeURIComponent(req.body.prompt)}` }]
          });
        }
        
        return res.status(response.status).json({
          error: 'Ideogram API error',
          status: response.status,
          details: responseData
        });
      }

      // Forward the successful response
      res.status(200).json(responseData);
    } catch (apiError) {
      console.error('Error calling Ideogram API:', apiError);
      
      if (shouldUseFallback) {
        // Return a fallback response in development
        return res.status(200).json({ 
          fallback: true,
          images: [{ url: `https://dummyimage.com/1024x1365/252A37/FFFFFF?text=${encodeURIComponent(req.body.prompt)}` }]
        });
      }
      
      res.status(500).json({ 
        error: apiError instanceof Error ? apiError.message : 'Unknown API error',
        details: apiError
      });
    }
  } catch (error) {
    // Global error handler for any unexpected errors
    console.error('Top-level error in ideogram handler:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown server error',
      details: error,
      debug: {
        env: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        hasApiKey: !!process.env.IDEOGRAM_API_KEY
      }
    });
  }
} 