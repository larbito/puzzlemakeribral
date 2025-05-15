import { NextRequest, NextResponse } from 'next/server';

// Get Vectorizer.AI API key from environment variables
const VECTORIZER_API_KEY = process.env.VECTORIZER_API_KEY || 'vkwdt19mmgyspjb'; // Fallback to demo key if not set

// Maximum file size allowed (reduced to 5MB to prevent memory issues)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Set a timeout for the vectorization request
const TIMEOUT_MS = 25000; // 25 seconds

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * Timeout function to prevent hanging requests
 */
function timeoutPromise(ms: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
}

/**
 * Helper function to reduce image size if needed
 */
async function reduceImageSize(file: File): Promise<ArrayBuffer> {
  // We'll just return the array buffer directly without further processing
  // in a real implementation, we would resize the image here
  return await file.arrayBuffer();
}

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
      return NextResponse.json({ error: 'No image file provided' }, { status: 400, headers: corsHeaders() });
    }
    
    console.log('Image received:', imageFile.name, 'Size:', imageFile.size);
    
    // Check if file is too large
    if (imageFile.size > MAX_FILE_SIZE) {
      console.error('File too large:', Math.round(imageFile.size / 1024 / 1024) + 'MB', 'Max:', Math.round(MAX_FILE_SIZE / 1024 / 1024) + 'MB');
      return NextResponse.json({ 
        error: 'File too large', 
        details: `Maximum file size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB, but got ${Math.round(imageFile.size / 1024 / 1024)}MB`
      }, { status: 413, headers: corsHeaders() });
    }
    
    try {
      // Reduce image size if possible
      const imageBuffer = await reduceImageSize(imageFile);
      
      // Construct the URL with query parameters instead of FormData to reduce memory usage
      const url = new URL('https://vectorizer.ai/api/v1/vectorize');
      
      // Add query parameters for options
      url.searchParams.append('mode', 'vectorize');
      url.searchParams.append('simplify', '0.3'); // More aggressive simplification to reduce SVG complexity
      url.searchParams.append('colored', 'true');
      
      // Convert the authorization to base64
      const authHeader = `Basic ${Buffer.from(`${VECTORIZER_API_KEY}:`).toString('base64')}`;
      
      // Use a race between the fetch and a timeout to prevent hanging
      const vectorizerResponse = await Promise.race([
        fetch(url.toString(), {
          method: 'POST',
          body: imageBuffer, // Send the raw buffer instead of FormData
          headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': authHeader,
          },
        }),
        timeoutPromise(TIMEOUT_MS)
      ]);
      
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
        }, { status: vectorizerResponse.status, headers: corsHeaders() });
      }
      
      // Get the SVG data with a timeout
      const svgData = await vectorizerResponse.text();
      
      // Check if we actually got SVG data
      if (!svgData.includes('<svg') || svgData.length < 100) {
        console.error('Invalid SVG data received');
        return NextResponse.json({ 
          error: 'Invalid SVG received from vectorization service',
          details: 'The service returned data that does not appear to be valid SVG'
        }, { status: 500, headers: corsHeaders() });
      }
      
      // Create a data URL for the SVG
      const svgBase64 = Buffer.from(svgData).toString('base64');
      const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      console.log('Successfully vectorized image, returning SVG');
      
      // Return the SVG URL to the client
      return NextResponse.json({ svgUrl }, { headers: corsHeaders() });
    } catch (fetchError) {
      // Check if it's a timeout error
      if (fetchError instanceof Error && fetchError.message.includes('timed out')) {
        console.error('Vectorization request timed out');
        return NextResponse.json({ 
          error: 'Vectorization timed out',
          details: 'The image may be too complex or the server is under heavy load. Try a simpler image or try again later.'
        }, { status: 504, headers: corsHeaders() });
      }
      
      console.error('Error calling Vectorizer.AI API:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to communicate with vectorization service',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500, headers: corsHeaders() });
    }
  } catch (error) {
    console.error('Error in vectorize API:', error);
    return NextResponse.json({ 
      error: 'Failed to vectorize image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: corsHeaders() });
  }
} 