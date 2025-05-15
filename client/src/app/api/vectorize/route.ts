import { NextRequest, NextResponse } from 'next/server';

// Get Vectorizer.AI API key from environment variables
const VECTORIZER_API_KEY = process.env.VECTORIZER_API_KEY;

// Maximum file size allowed (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * API endpoint to proxy requests to Vectorizer.AI
 * This helps avoid CORS issues and keeps API keys secure
 */
export async function POST(req: NextRequest) {
  try {
    console.log('Vectorize API endpoint called');
    
    // Check if Vectorizer.AI API key is set
    if (!VECTORIZER_API_KEY) {
      console.error('VECTORIZER_API_KEY environment variable is not set');
      return NextResponse.json({ 
        error: 'Vectorizer.AI API key is not configured on the server', 
        details: 'Please contact the administrator to set up the VECTORIZER_API_KEY environment variable'
      }, { status: 500 });
    }
    
    // Get the image file from the form data
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    
    console.log('Image received:', imageFile.name, 'Size:', imageFile.size);
    
    // Check if file is too large
    if (imageFile.size > MAX_FILE_SIZE) {
      console.error('File too large:', Math.round(imageFile.size / 1024 / 1024) + 'MB', 'Max:', Math.round(MAX_FILE_SIZE / 1024 / 1024) + 'MB');
      return NextResponse.json({ 
        error: 'File too large', 
        details: `Maximum file size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB, but got ${Math.round(imageFile.size / 1024 / 1024)}MB`
      }, { status: 413 });
    }
    
    // Build a new FormData to send to Vectorizer.AI
    const vectorizerFormData = new FormData();
    
    // Add the image file 
    vectorizerFormData.append('image', imageFile);
    
    // Add Vectorizer.AI API parameters
    vectorizerFormData.append('mode', 'vectorize'); // Use vectorize mode for standard SVG
    
    // Options for better T-shirt design results:
    vectorizerFormData.append('precision_mode', 'true'); // Better quality for detailed designs
    vectorizerFormData.append('colored', 'true'); // Preserve colors from original
    vectorizerFormData.append('contour_dim_check', 'true'); // Fix for complex designs
    
    // Add options to reduce complexity
    vectorizerFormData.append('simplify', '0.2'); // Simplify paths to reduce complexity
    
    console.log('Sending request to Vectorizer.AI API');
    
    try {
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
        
        let errorMessage = 'Error from Vectorizer.AI API';
        
        // Map common error codes to user-friendly messages
        if (vectorizerResponse.status === 413) {
          errorMessage = 'Image is too large for vectorization service';
        } else if (vectorizerResponse.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (vectorizerResponse.status === 401 || vectorizerResponse.status === 403) {
          errorMessage = 'API key authentication failed';
        } else if (vectorizerResponse.status >= 500) {
          errorMessage = 'Vectorizer.AI service error. Please try again later.';
        }
        
        return NextResponse.json({ 
          error: errorMessage,
          details: errorText
        }, { status: vectorizerResponse.status });
      }
      
      // Assuming Vectorizer.AI returns the SVG data directly
      const svgData = await vectorizerResponse.text();
      
      // Check if we actually got SVG data
      if (!svgData.includes('<svg') || svgData.length < 100) {
        console.error('Invalid SVG data received:', svgData);
        return NextResponse.json({ 
          error: 'Invalid SVG received from vectorization service',
          details: 'The service returned data that does not appear to be valid SVG'
        }, { status: 500 });
      }
      
      // Create a data URL for the SVG
      const svgBase64 = Buffer.from(svgData).toString('base64');
      const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      console.log('Successfully vectorized image, returning SVG');
      
      // Return the SVG URL to the client
      return NextResponse.json({ svgUrl });
    } catch (fetchError) {
      console.error('Error calling Vectorizer.AI API:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to communicate with vectorization service',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in vectorize API:', error);
    return NextResponse.json({ 
      error: 'Failed to vectorize image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 