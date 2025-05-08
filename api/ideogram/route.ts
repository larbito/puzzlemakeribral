import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log('Handler invoked. Method:', req.method);
    
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

    // Validate request body
    if (!req.body || !req.body.prompt) {
      console.error('Missing prompt in request body:', req.body);
      return res.status(400).json({ error: 'Prompt is required in the request body' });
    }

    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // SIMPLIFIED: Return a placeholder image instead of calling Ideogram API
    // Format the prompt for the placeholder
    const prompt = req.body.prompt;
    const words = prompt.split(' ').slice(0, 5).join('-');
    
    // Generate a color based on the prompt
    const bgColor = getColorForPrompt(prompt);
    
    // Create a placeholder image URL
    const placeholderUrl = `https://dummyimage.com/1024x1365/${bgColor}/FFFFFF?text=${encodeURIComponent('T-Shirt: ' + words)}`;
    
    // Simulate a delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a mock response that matches the expected format
    return res.status(200).json({
      images: [{ url: placeholderUrl }]
    });
    
  } catch (error) {
    console.error('Error in ideogram-proxy:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
}

// Helper function to determine background color based on prompt
function getColorForPrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('retro') || lowerPrompt.includes('vintage')) {
    return "F5A623";
  } else if (lowerPrompt.includes('minimalist')) {
    return "444444";
  } else if (lowerPrompt.includes('cyberpunk') || lowerPrompt.includes('neon')) {
    return "9013FE";
  } else if (lowerPrompt.includes('nature')) {
    return "2D8C3C";
  } else if (lowerPrompt.includes('ocean')) {
    return "1E88E5";
  } else if (lowerPrompt.includes('sunset')) {
    return "FF5733";
  } else {
    return "252A37";
  }
} 