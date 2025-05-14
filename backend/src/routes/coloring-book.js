const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const FormData = require('form-data');
const archiver = require('archiver');
const { Readable } = require('stream');
const PDFKit = require('pdfkit');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// Try to load Sharp, but provide fallback if it fails
let sharp;
try {
  sharp = require('sharp');
  console.log('Sharp loaded successfully');
} catch (error) {
  console.error('Failed to load Sharp module:', error.message);
  console.log('Using fallback implementation without Sharp');
  // Create a mock implementation that passes through images without processing
  sharp = null;
}

// Helper function to convert image buffer to format compatible with PDFKit
async function ensurePDFCompatibleImage(buffer) {
  // If Sharp is available, use it to convert to PNG
  if (sharp) {
    try {
      return await sharp(buffer).png().toBuffer();
    } catch (error) {
      console.error('Sharp conversion error:', error);
      // Fall through to the fallback method
    }
  }
  
  // Fallback method if Sharp is not available or fails
  try {
    // Try to use a data URL approach
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
    console.log('Created data URL for image');
    return Buffer.from(dataUrl);
  } catch (error) {
    console.error('Data URL conversion failed:', error);
    return buffer; // Return the original buffer as last resort
  }
}

// Additional fallback function to handle image loading failures in PDFKit
function addImageToPDF(doc, buffer, options) {
  try {
    // First attempt: Try to add the image directly
    return doc.image(buffer, options.x, options.y, options);
  } catch (error) {
    console.error('Error adding image to PDF:', error);
    
    try {
      // Second attempt: Create a placeholder for the image
      doc.rect(options.x, options.y, options.fit[0], options.fit[1])
         .stroke('#cccccc')
         .fillColor('#eeeeee')
         .fill();
      
      // Add text explaining the issue
      doc.fillColor('#333333')
         .fontSize(12)
         .text('Image could not be displayed', 
               options.x + 20, 
               options.y + options.fit[1]/2 - 10,
               { width: options.fit[0] - 40 });
      
      return doc; // Return the doc for chaining
    } catch (fallbackError) {
      console.error('Even fallback drawing failed:', fallbackError);
      return doc; // Return the doc without changes
    }
  }
}

// Configure handling for form data (without using multer, which depends on Sharp)
const jsonParser = express.json();
const urlEncodedParser = express.urlencoded({ extended: true });

console.log('Setting up coloring book routes');

// Debug middleware to log request details
router.use((req, res, next) => {
  console.log('Coloring book route request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    contentType: req.get('content-type')
  });
  next();
});

/**
 * Test endpoint to verify functionality
 * GET /api/coloring-book/test
 */
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Coloring book generator API is working!',
    features: [
      'Generate coloring pages using Ideogram API',
      'Create PDFs with multiple pages',
      'Support for various trim sizes',
      'Add blank pages and page numbers'
    ],
    sharpAvailable: !!sharp
  });
});

/**
 * Generate a coloring book PDF from individual pages - GET version
 * GET /api/coloring-book/create-pdf
 */
router.get('/create-pdf', async (req, res) => {
  try {
    console.log('PDF creation GET request received');
    console.log('Query params:', req.query);
    
    // Parse the data from the query parameter
    let data;
    try {
      if (!req.query.data) {
        return res.status(400).json({ error: 'Missing data parameter' });
      }
      data = JSON.parse(decodeURIComponent(req.query.data));
      console.log('Successfully parsed data from query parameter');
    } catch (error) {
      console.error('Error parsing query data:', error);
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    console.log('Processing data:', data);
    
    const {
      pageUrls,
      trimSize = '8.5x11',
      addBlankPages,
      showPageNumbers,
      includeBleed,
      bookTitle = 'coloring-book'
    } = data;
    
    if (!pageUrls || !Array.isArray(pageUrls) || pageUrls.length === 0) {
      return res.status(400).json({ error: 'Page URLs are required' });
    }

    console.log(`Creating PDF with ${pageUrls.length} pages`);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${bookTitle}.pdf"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Parse the trim size
    let pdfSize;
    if (trimSize === '8.5x11') {
      pdfSize = [8.5 * 72, 11 * 72]; // Convert to points (72 points per inch)
    } else if (trimSize === '6x9') {
      pdfSize = [6 * 72, 9 * 72];
    } else {
      // Parse custom size
      const [width, height] = trimSize.split('x').map(dim => parseFloat(dim) * 72);
      pdfSize = [width, height];
    }
    
    console.log('PDF size in points:', pdfSize);
    
    // Create PDF document with correct size
    const doc = new PDFKit({
      size: pdfSize,
      margin: includeBleed ? 36 : 72, // 0.5 inch or 1 inch margins
      autoFirstPage: false // Don't create the first page automatically
    });
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add pages to PDF
    for (let i = 0; i < pageUrls.length; i++) {
      try {
        console.log(`Processing page ${i + 1} of ${pageUrls.length}`);
        
        // Add blank page before if requested
        if (addBlankPages && i > 0) {
          doc.addPage({ size: pdfSize });
          console.log(`Added blank page ${i * 2}`);
        }
        
        // Add content page with explicit size
        doc.addPage({ size: pdfSize });
        console.log(`Added page ${i + 1} with size:`, pdfSize);
        
        try {
          // Download and add image
          console.log(`Fetching image from: ${pageUrls[i].substring(0, 100)}...`);
          const imageResponse = await fetch(pageUrls[i]);
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image ${i + 1}: ${imageResponse.status}`);
            continue;
          }
          
          const buffer = await imageResponse.buffer();
          console.log(`Successfully downloaded image ${i + 1} (${buffer.length} bytes)`);
          
          // Convert the image to a PDF-compatible format
          const pdfCompatibleBuffer = await ensurePDFCompatibleImage(buffer);
          console.log(`Converted image ${i + 1} to PDF-compatible format`);
          
          // Define image size with safe margins
          const pageWidth = pdfSize[0];
          const pageHeight = pdfSize[1];
          const margin = includeBleed ? 36 : 72;
          const imageWidth = pageWidth - (margin * 2);
          const imageHeight = pageHeight - (margin * 2);
          
          // Add the image to the PDF using our robust helper
          addImageToPDF(doc, pdfCompatibleBuffer, {
            x: margin,
            y: margin,
            fit: [imageWidth, imageHeight],
            align: 'center',
            valign: 'center'
          });
          
          // Add page number if requested
          if (showPageNumbers) {
            doc.fontSize(12)
               .text(`${i + 1}`, pageWidth / 2, pageHeight - 30, {
                 align: 'center'
               });
          }
          
          console.log(`Added image to page ${i + 1}`);
        } catch (imageError) {
          console.error(`Error processing image on page ${i + 1}:`, imageError);
          // Add a placeholder text instead
          doc.fontSize(20)
             .text(`Image ${i + 1} could not be loaded`, 100, 100);
        }
      } catch (pageError) {
        console.error(`Error creating page ${i + 1}:`, pageError);
      }
    }
    
    // Finalize PDF
    console.log('Finalizing PDF');
    doc.end();
    console.log('PDF sent to client');
    
  } catch (error) {
    console.error('Error creating PDF:', error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create PDF' });
    }
  }
});

/**
 * Generate a coloring book PDF from individual pages - POST version
 * POST /api/coloring-book/create-pdf
 */
router.post('/create-pdf', jsonParser, async (req, res) => {
  try {
    console.log('PDF creation POST request received');
    console.log('Request content-type:', req.get('content-type'));
    console.log('Request body:', typeof req.body === 'object' ? Object.keys(req.body) : typeof req.body);
    
    // Parse the data parameter if it exists
    let data = req.body;
    if (req.body && req.body.data) {
      try {
        if (typeof req.body.data === 'string') {
          data = JSON.parse(req.body.data);
          console.log('Successfully parsed data from string');
        } else {
          data = req.body.data;
          console.log('Using data object directly');
        }
      } catch (error) {
        console.error('Error parsing form data:', error);
        return res.status(400).json({ error: 'Invalid data format' });
      }
    }
    
    console.log('Processing data:', data);
    
    const {
      pageUrls,
      trimSize = '8.5x11',
      addBlankPages,
      showPageNumbers,
      includeBleed,
      bookTitle = 'coloring-book'
    } = data;
    
    if (!pageUrls || !Array.isArray(pageUrls) || pageUrls.length === 0) {
      return res.status(400).json({ error: 'Page URLs are required' });
    }

    console.log(`Creating PDF with ${pageUrls.length} pages`);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${bookTitle}.pdf"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Parse the trim size
    let pdfSize;
    if (trimSize === '8.5x11') {
      pdfSize = [8.5 * 72, 11 * 72]; // Convert to points (72 points per inch)
    } else if (trimSize === '6x9') {
      pdfSize = [6 * 72, 9 * 72];
    } else {
      // Parse custom size
      const [width, height] = trimSize.split('x').map(dim => parseFloat(dim) * 72);
      pdfSize = [width, height];
    }
    
    console.log('PDF size in points:', pdfSize);
    
    // Create PDF document with correct size
    const doc = new PDFKit({
      size: pdfSize,
      margin: includeBleed ? 36 : 72, // 0.5 inch or 1 inch margins
      autoFirstPage: false // Don't create the first page automatically
    });
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add pages to PDF
    for (let i = 0; i < pageUrls.length; i++) {
      try {
        console.log(`Processing page ${i + 1} of ${pageUrls.length}`);
        
        // Add blank page before if requested
        if (addBlankPages && i > 0) {
          doc.addPage({ size: pdfSize });
          console.log(`Added blank page ${i * 2}`);
        }
        
        // Add content page with explicit size
        doc.addPage({ size: pdfSize });
        console.log(`Added page ${i + 1} with size:`, pdfSize);
        
        try {
          // Download and add image
          console.log(`Fetching image from: ${pageUrls[i].substring(0, 100)}...`);
          const imageResponse = await fetch(pageUrls[i]);
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image ${i + 1}: ${imageResponse.status}`);
            continue;
          }
          
          const buffer = await imageResponse.buffer();
          console.log(`Successfully downloaded image ${i + 1} (${buffer.length} bytes)`);
          
          // Convert the image to a PDF-compatible format
          const pdfCompatibleBuffer = await ensurePDFCompatibleImage(buffer);
          console.log(`Converted image ${i + 1} to PDF-compatible format`);
          
          // Define image size with safe margins
          const pageWidth = pdfSize[0];
          const pageHeight = pdfSize[1];
          const margin = includeBleed ? 36 : 72;
          const imageWidth = pageWidth - (margin * 2);
          const imageHeight = pageHeight - (margin * 2);
          
          // Add the image to the PDF using our robust helper
          addImageToPDF(doc, pdfCompatibleBuffer, {
            x: margin,
            y: margin,
            fit: [imageWidth, imageHeight],
            align: 'center',
            valign: 'center'
          });
          
          // Add page number if requested
          if (showPageNumbers) {
            doc.fontSize(12)
               .text(`${i + 1}`, pageWidth / 2, pageHeight - 30, {
                 align: 'center'
               });
          }
          
          console.log(`Added image to page ${i + 1}`);
        } catch (imageError) {
          console.error(`Error processing image on page ${i + 1}:`, imageError);
          // Add a placeholder text instead
          doc.fontSize(20)
             .text(`Image ${i + 1} could not be loaded`, 100, 100);
        }
      } catch (pageError) {
        console.error(`Error creating page ${i + 1}:`, pageError);
      }
    }
    
    // Finalize PDF
    console.log('Finalizing PDF');
    doc.end();
    console.log('PDF sent to client');
    
  } catch (error) {
    console.error('Error creating PDF:', error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create PDF' });
    }
  }
});

/**
 * Download all images as a ZIP file
 * GET /api/coloring-book/download-zip
 */
router.get('/download-zip', async (req, res) => {
  try {
    console.log('ZIP download GET request received');
    console.log('Query params:', req.query);
    
    let data;
    try {
      if (!req.query.data) {
        return res.status(400).json({ error: 'Missing data parameter' });
      }
      data = JSON.parse(decodeURIComponent(req.query.data));
      console.log('Successfully parsed data from query parameter');
    } catch (error) {
      console.error('Error parsing query data:', error);
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    console.log('Processing data:', data);
    
    const { pageUrls, bookTitle = 'coloring-pages' } = data;
    
    if (!pageUrls || !Array.isArray(pageUrls) || pageUrls.length === 0) {
      return res.status(400).json({ error: 'Page URLs are required' });
    }
    
    console.log(`Creating ZIP with ${pageUrls.length} images`);
    
    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${bookTitle}.zip"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 5 } // Lower compression level for better reliability
    });
    
    // Log archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
    });
    
    // Log when archive is finalized
    archive.on('end', () => {
      console.log('Archive finalized');
    });
    
    // Pipe archive data to response
    archive.pipe(res);
    
    // Download each image and add to ZIP
    let successCount = 0;
    for (let i = 0; i < pageUrls.length; i++) {
      try {
        console.log(`Processing image ${i + 1} of ${pageUrls.length}`);
        
        let imageUrl = pageUrls[i];
        if (!imageUrl) {
          console.error(`Invalid URL for image ${i + 1}`);
          continue;
        }
        
        // Add a timeout for fetching
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          console.log(`Fetching image from: ${imageUrl.substring(0, 100)}...`);
          const imageResponse = await fetch(imageUrl, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
            }
          });
          
          // Clear the timeout
          clearTimeout(timeoutId);
          
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image ${i + 1}: ${imageResponse.status}`);
            continue;
          }
          
          const buffer = await imageResponse.buffer();
          
          if (!buffer || buffer.length === 0) {
            console.error(`Empty buffer for image ${i + 1}`);
            continue;
          }
          
          console.log(`Downloaded image ${i + 1} (${buffer.length} bytes)`);
          
          // Create a unique name for the file
          const fileName = `page-${i + 1}.png`;
          
          // Add directly to ZIP
          archive.append(buffer, { name: fileName });
          console.log(`Added image ${i + 1} to ZIP as ${fileName}`);
          
          successCount++;
        } catch (fetchError) {
          console.error(`Error fetching image ${i + 1}:`, fetchError);
          clearTimeout(timeoutId);
        }
      } catch (imageError) {
        console.error(`Error processing image ${i + 1}:`, imageError);
      }
    }
    
    // If no images were successfully added, return an error
    if (successCount === 0) {
      console.error('No images were successfully added to the ZIP');
      if (!res.headersSent) {
        return res.status(400).json({ error: 'Failed to process any images' });
      }
    } else {
      console.log(`Added ${successCount} of ${pageUrls.length} images to ZIP`);
    }
    
    // Finalize ZIP
    console.log('Finalizing ZIP');
    await archive.finalize();
    console.log('ZIP sent to client');
    
  } catch (error) {
    console.error('Error creating ZIP:', error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create ZIP file' });
    }
  }
});

// Image processing route without sharp
router.post('/process-image', express.json(), async (req, res) => {
  try {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const { imageUrl, operation } = req.body;
    
    // Simply return the original image URL since we can't process without Sharp
    res.json({ 
      image: imageUrl,
      message: 'Image returned without processing (Sharp not available)'
    });
  } catch (error) {
    console.error('Error in process-image:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process image',
      type: error.name
    });
  }
});

/**
 * Expand a base prompt into multiple coloring book page prompts
 * POST /api/coloring-book/expand-prompts
 */
router.post('/expand-prompts', express.json(), async (req, res) => {
  try {
    console.log('Expand prompts request received');
    console.log('Request body:', req.body);
    
    const { basePrompt, pageCount = 10 } = req.body;
    
    if (!basePrompt) {
      return res.status(400).json({ error: 'Base prompt is required' });
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    console.log(`Expanding base prompt into ${pageCount} variations`);
    
    // Call OpenAI API to generate prompt variations
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a creative assistant that specializes in generating coloring book pages for children.'
            },
            {
              role: 'user',
              content: `Generate ${pageCount} creative variations of this coloring book prompt: "${basePrompt}". 
              Each variation should match the original theme but be unique. Make them suitable for coloring pages.
              Return the results as a JSON array of strings, with no additional text or explanation.`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to generate prompt variations');
      }

      const data = await response.json();
      console.log('OpenAI API response:', data);
      
      // Parse the response JSON from the content field
      let promptVariations;
      try {
        // The content should be a JSON string with an array of prompts
        const content = data.choices[0].message.content;
        const parsedContent = JSON.parse(content);
        
        // Extract the array of prompts - check for common field names
        if (Array.isArray(parsedContent)) {
          promptVariations = parsedContent;
        } else if (Array.isArray(parsedContent.prompts)) {
          promptVariations = parsedContent.prompts;
        } else if (Array.isArray(parsedContent.variations)) {
          promptVariations = parsedContent.variations;
        } else {
          // If we can't find an array field, look for any array in the object
          const arrayField = Object.values(parsedContent).find(Array.isArray);
          if (arrayField) {
            promptVariations = arrayField;
          } else {
            throw new Error('Could not find prompt variations in API response');
          }
        }
      } catch (parseError) {
        console.error('Error parsing prompt variations:', parseError);
        throw new Error('Failed to parse prompt variations from API response');
      }
      
      // Ensure we have the requested number of variations
      // If we have too few, repeat some with slight modifications
      if (promptVariations.length < pageCount) {
        const originalLength = promptVariations.length;
        for (let i = originalLength; i < pageCount; i++) {
          const index = i % originalLength;
          const originalPrompt = promptVariations[index];
          
          // Add a simple modification to create a variation
          const modifiers = [
            'with a different pose',
            'from another angle',
            'with slight variations',
            'in a different style',
            'with additional details'
          ];
          
          const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
          promptVariations.push(`${originalPrompt} ${modifier}`);
        }
      }
      
      // Limit to the requested count
      promptVariations = promptVariations.slice(0, pageCount);
      
      res.json({ 
        basePrompt,
        promptVariations
      });
      
    } catch (apiError) {
      console.error('Error calling OpenAI API:', apiError);
      res.status(500).json({ error: apiError.message || 'Failed to expand prompts' });
    }
  } catch (error) {
    console.error('Error expanding prompts:', error);
    res.status(500).json({ error: error.message || 'An error occurred while expanding prompts' });
  }
});

module.exports = router; 