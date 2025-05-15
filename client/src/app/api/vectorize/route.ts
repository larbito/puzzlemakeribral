import { NextRequest, NextResponse } from 'next/server';

// Placeholder for Vectorizer.AI API key - should be stored in env vars
const VECTORIZER_API_KEY = process.env.VECTORIZER_API_KEY || 'demo'; // Use 'demo' for testing

/**
 * API endpoint to proxy requests to Vectorizer.AI
 * This helps avoid CORS issues and keeps API keys secure
 */
export async function POST(req: NextRequest) {
  try {
    console.log('Vectorize API endpoint called');
    
    // Get the image file from the form data
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    
    console.log('Image received:', imageFile.name, 'Size:', imageFile.size);
    
    // Build a new FormData to send to Vectorizer.AI
    const vectorizerFormData = new FormData();
    
    // Add the image file 
    vectorizerFormData.append('image', imageFile);
    
    // Add Vectorizer.AI API parameters
    vectorizerFormData.append('mode', 'vectorize'); // Use vectorize mode for standard SVG
    
    // Options for better T-shirt design results:
    vectorizerFormData.append('precision_mode', 'true'); // Better quality for detailed designs
    vectorizerFormData.append('colored', 'true'); // Preserve colors from original
    
    console.log('Sending request to Vectorizer.AI API');
    
    // Make the request to Vectorizer.AI API
    const vectorizerResponse = await fetch('https://vectorizer.ai/api/v1/vectorize', {
      method: 'POST',
      body: vectorizerFormData,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${VECTORIZER_API_KEY}:`).toString('base64')}`
      }
    });
    
    if (!vectorizerResponse.ok) {
      const errorText = await vectorizerResponse.text();
      console.error('Vectorizer.AI API error:', vectorizerResponse.status, errorText);
      return NextResponse.json({ 
        error: `Vectorizer.AI API error: ${vectorizerResponse.status}`,
        details: errorText
      }, { status: vectorizerResponse.status });
    }
    
    // Assuming Vectorizer.AI returns the SVG data directly
    const svgData = await vectorizerResponse.text();
    
    // Create a data URL for the SVG
    const svgBase64 = Buffer.from(svgData).toString('base64');
    const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;
    
    console.log('Successfully vectorized image, returning SVG');
    
    // Return the SVG URL to the client
    return NextResponse.json({ svgUrl });
  } catch (error) {
    console.error('Error in vectorize API:', error);
    return NextResponse.json({ 
      error: 'Failed to vectorize image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 