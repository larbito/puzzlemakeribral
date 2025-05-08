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
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log('Proxying request to Ideogram API:', JSON.stringify(req.body, null, 2));

    const response = await fetch('https://api.ideogram.ai/api/v1/images/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    console.log('Ideogram API response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers),
      data: data
    });

    if (!response.ok) {
      // Forward error response with more details
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