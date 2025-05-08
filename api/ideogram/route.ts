import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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

  const API_KEY = process.env.IDEOGRAM_API_KEY;
  if (!API_KEY) {
    console.error('API key not found in environment variables');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!req.body || !req.body.prompt) {
      console.error('Invalid request body - missing prompt');
      return res.status(400).json({ error: 'Invalid request - prompt is required' });
    }

    // Format request body according to Ideogram API requirements
    const requestBody = {
      prompt: req.body.prompt,
      model: "V_2",
      aspect_ratio: req.body.aspect_ratio || "ASPECT_3_4",
      magic_prompt_option: "AUTO",
      style_type: req.body.style?.toUpperCase() || "AUTO",
      negative_prompt: req.body.negative_prompt,
      seed: req.body.seed
    };

    console.log('Formatted request body:', JSON.stringify(requestBody, null, 2));

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

    const data = await response.json();
    console.log('Ideogram API response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Ideogram API error:', {
        status: response.status,
        data: data
      });
      return res.status(response.status).json({
        error: 'Ideogram API error',
        status: response.status,
        details: data
      });
    }

    // Forward the successful response
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in ideogram-proxy:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
} 