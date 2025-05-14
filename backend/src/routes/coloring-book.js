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
      bookTitle = 'coloring-book',
      addTitlePage = false,
      authorName = '',
      subtitle = ''
    } = data;
    
    console.log('Title page settings:', { addTitlePage, bookTitle, authorName, subtitle });
    
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
    
    // Add title page if requested
    if (addTitlePage) {
      console.log('Adding title page with author:', authorName);
      doc.addPage({ size: pdfSize });
      
      const pageWidth = pdfSize[0];
      const pageHeight = pdfSize[1];
      const margin = includeBleed ? 36 : 72;
      
      // Add the title
      doc.fontSize(36)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(bookTitle, margin, pageHeight * 0.25, {
           width: pageWidth - (margin * 2),
           align: 'center'
         });
      
      // Add subtitle if provided
      if (subtitle) {
        doc.fontSize(18)
           .font('Helvetica-Oblique')
           .fillColor('#444444')
           .text(subtitle, margin, pageHeight * 0.4, {
             width: pageWidth - (margin * 2),
             align: 'center'
           });
      }
      
      // Add author name if provided
      if (authorName) {
        console.log('Adding author name to title page:', authorName);
        doc.fontSize(16)
           .font('Helvetica')
           .fillColor('#000000')
           .text(`by ${authorName}`, margin, pageHeight * 0.7, {
             width: pageWidth - (margin * 2),
             align: 'center'
           });
      }
      
      console.log('Title page added');
    }
    
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
      bookTitle = 'coloring-book',
      addTitlePage = false,
      authorName = '',
      subtitle = ''
    } = data;
    
    console.log('Title page settings:', { addTitlePage, bookTitle, authorName, subtitle });
    
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
    
    // Add title page if requested
    if (addTitlePage) {
      console.log('Adding title page with author:', authorName);
      doc.addPage({ size: pdfSize });
      
      const pageWidth = pdfSize[0];
      const pageHeight = pdfSize[1];
      const margin = includeBleed ? 36 : 72;
      
      // Add the title
      doc.fontSize(36)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(bookTitle, margin, pageHeight * 0.25, {
           width: pageWidth - (margin * 2),
           align: 'center'
         });
      
      // Add subtitle if provided
      if (subtitle) {
        doc.fontSize(18)
           .font('Helvetica-Oblique')
           .fillColor('#444444')
           .text(subtitle, margin, pageHeight * 0.4, {
             width: pageWidth - (margin * 2),
             align: 'center'
           });
      }
      
      // Add author name if provided
      if (authorName) {
        console.log('Adding author name to title page:', authorName);
        doc.fontSize(16)
           .font('Helvetica')
           .fillColor('#000000')
           .text(`by ${authorName}`, margin, pageHeight * 0.7, {
             width: pageWidth - (margin * 2),
             align: 'center'
           });
      }
      
      console.log('Title page added');
    }
    
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
    
    const { pageUrls, bookTitle = 'coloring-pages', highQuality = false } = data;
    
    if (!pageUrls || !Array.isArray(pageUrls) || pageUrls.length === 0) {
      return res.status(400).json({ error: 'Page URLs are required' });
    }
    
    console.log(`Creating ZIP with ${pageUrls.length} images, high quality: ${highQuality}`);
    
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
        
        // Skip placeholder images
        if (imageUrl.includes('placehold.co')) {
          console.log(`Skipping placeholder image ${i + 1}`);
          // Add a text file instead explaining this is a placeholder
          archive.append('This is a placeholder image that was not processed.\n', { name: `page-${i + 1}-placeholder.txt` });
          continue;
        }
        
        // Add a timestamp to prevent caching issues
        if (imageUrl.includes('?')) {
          imageUrl += `&t=${Date.now()}`;
        } else {
          imageUrl += `?t=${Date.now()}`;
        }
        
        // Add a timeout for fetching
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          console.log(`Fetching image from: ${imageUrl.substring(0, 100)}...`);
          const imageResponse = await fetch(imageUrl, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
              'Accept': 'image/png,image/jpeg,image/webp,*/*'
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
          
          // Process the image for better quality (enforce PNG with high resolution)
          let processedBuffer = buffer;
          try {
            // Use ensurePDFCompatibleImage to process the image
            processedBuffer = await ensurePDFCompatibleImage(buffer);
            console.log(`Processed image ${i + 1} for better quality`);
          } catch (processError) {
            console.error(`Error processing image ${i + 1}:`, processError);
            // Continue with original buffer if processing fails
          }
          
          // Create a unique name for the file
          const fileName = `page-${i + 1}.png`;
          
          // Add directly to ZIP
          archive.append(processedBuffer, { name: fileName });
          console.log(`Added image ${i + 1} to ZIP as ${fileName}`);
          
          successCount++;
        } catch (fetchError) {
          console.error(`Error fetching image ${i + 1}:`, fetchError);
          clearTimeout(timeoutId);
          
          // Try to add a placeholder explanation if fetch fails
          try {
            archive.append(`Failed to download image ${i + 1}: ${fetchError.message}\n`, 
                          { name: `page-${i + 1}-error.txt` });
          } catch (e) {
            console.error(`Could not add error explanation to ZIP:`, e);
          }
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
    
    // Clean the base prompt - remove any boilerplate text that might be present
    let cleanedBasePrompt = basePrompt;
    
    // Remove common prefixes that might be in the input
    const prefixesToRemove = [
      'This image is suitable for a coloring book.',
      'It\'s a clean line art illustration',
      'Here\'s a prompt to generate',
      'Prompt for a Coloring Book Page:',
      'Create a coloring book page',
      '**Prompt for a Coloring Book Page:**'
    ];
    
    for (const prefix of prefixesToRemove) {
      if (cleanedBasePrompt.includes(prefix)) {
        cleanedBasePrompt = cleanedBasePrompt.replace(prefix, '').trim();
      }
    }
    
    // Extract the core prompt if it has a pattern of "...featuring a [actual content]"
    const featuringMatch = cleanedBasePrompt.match(/featuring an?(.+)/i);
    if (featuringMatch && featuringMatch[1]) {
      cleanedBasePrompt = featuringMatch[1].trim();
    }
    
    console.log(`Cleaned base prompt: "${cleanedBasePrompt}"`);
    console.log(`Expanding base prompt into ${pageCount} consistent variations`);
    
    // Generate fallback variations if all else fails
    const generateFallbackVariations = () => {
      const variations = [cleanedBasePrompt]; // Start with the original
      
      // Extract key elements from the base prompt
      const words = cleanedBasePrompt.split(' ');
      const baseLength = words.length;
      
      // Core structure to preserve across variations
      const baseStructure = cleanedBasePrompt.replace(/\b(in|on|at|with|by|near|under|over|beside)\b.*$/, '').trim();
      
      // Different locations/scenarios to vary
      const locations = ['in a garden', 'at the beach', 'in the forest', 'on a mountain', 'in a meadow', 
                         'at a playground', 'in a magical castle', 'under a rainbow', 'by a lake', 
                         'in a treehouse', 'on a cloud', 'at a birthday party'];
      
      // Different actions to vary (if applicable)
      const actions = ['playing with', 'dancing with', 'reading', 'singing', 'jumping', 'exploring', 
                       'painting', 'drawing', 'building', 'collecting', 'planting', 'discovering'];
      
      // Different objects to interact with (if applicable)
      const objects = ['flowers', 'toys', 'bubbles', 'balloons', 'stars', 'butterflies', 
                      'musical instruments', 'a treasure map', 'magic stones', 'paint brushes', 'shells'];
      
      // Generate variations with the same structure but different scenarios
      for (let i = 1; i < pageCount; i++) {
        // For subsequent variations, keep core structure but change scenario/details
        const location = locations[Math.floor(Math.random() * locations.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const object = objects[Math.floor(Math.random() * objects.length)];
        
        // Construct variation while preserving approximate length and structure
        let variation;
        if (baseLength < 8) {
          // For short prompts, add a bit more detail
          variation = `${baseStructure} ${location} ${action} ${object}`;
        } else {
          // For longer prompts, maintain similar length
          variation = `${baseStructure} ${location}`;
        }
        
        variations.push(variation);
      }
      
      return variations;
    };
    
    try {
      console.log('Making OpenAI API request for consistent prompt variations');
      
      // Create a clear, direct system prompt
      const systemPrompt = `You are an AI assistant that generates coloring book page prompts.
When given a base prompt, create variations that maintain the same style, characters, and theme, 
but change small details like poses, actions, or background elements.

YOUR OUTPUTS MUST:
1. Be DIRECT prompts with NO introductory text
2. Be COMPLETE standalone sentences that can be used to generate images
3. MAINTAIN the exact same art style and theme as the original
4. KEEP the same main characters/objects from the original
5. AVOID adding phrases like "This image is" or "Prompt for a coloring book"

DO NOT include any meta-text, prefaces, or explanations.`;

      // Create a straightforward user prompt with examples
      const userPrompt = `Base coloring book prompt: "${cleanedBasePrompt}"

Generate ${pageCount} variations of this prompt. Each variation should be a DIRECT image generation prompt 
that maintains the same style, tone, and main elements, but varies in small details like poses, actions, or settings.

For example, if the base prompt is:
"A happy hedgehog painting flowers in a meadow"

Good variations would be:
"A happy hedgehog holding a sunflower under a tree"
"A happy hedgehog playing with butterflies near a garden fence"
"A happy hedgehog sitting on a rock sketching tulips"

Return ONLY a JSON array containing the variations as direct prompts without any introduction or explanation text.`;

      // First API call attempt using JSON response format
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
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenAI API error:', errorData);
          throw new Error(errorData.error?.message || 'Failed to generate prompt variations');
        }

        const data = await response.json();
        console.log('OpenAI API response received');
        
        // Parse the response JSON from the content field
        let promptVariations = [];
        try {
          // Extract the content
          const content = data.choices[0].message.content;
          console.log('Raw content from OpenAI:', content);
          
          // Parse the JSON response
          const parsedContent = JSON.parse(content);
          console.log('Parsed content structure:', Object.keys(parsedContent));
          
          // Check different possible array locations in the response
          if (Array.isArray(parsedContent)) {
            promptVariations = parsedContent;
          } else if (Array.isArray(parsedContent.prompts)) {
            promptVariations = parsedContent.prompts;
          } else if (Array.isArray(parsedContent.variations)) {
            promptVariations = parsedContent.variations;
          } else {
            // Look for any array in the response
            const arrayField = Object.values(parsedContent).find(val => Array.isArray(val));
            if (arrayField) {
              promptVariations = arrayField;
            }
          }
          
          // If we still don't have prompt variations, search more aggressively
          if (!promptVariations || promptVariations.length === 0) {
            throw new Error('Could not find prompt variations array in API response');
          }
        } catch (parseError) {
          console.error('Error extracting variations from API response:', parseError);
          throw parseError; // Let the next handler try a different approach
        }
        
        // Process the generated variations
        const processedVariations = promptVariations.map(prompt => {
          // Remove any boilerplate text patterns
          let cleanedPrompt = prompt;
          
          for (const prefix of prefixesToRemove) {
            if (cleanedPrompt.includes(prefix)) {
              cleanedPrompt = cleanedPrompt.replace(prefix, '').trim();
            }
          }
          
          // Remove quote marks if present
          cleanedPrompt = cleanedPrompt.replace(/^["'](.+)["']$/, '$1');
          
          return cleanedPrompt;
        });
        
        // Ensure the first prompt is the original
        if (processedVariations.length > 0 && processedVariations[0] !== cleanedBasePrompt) {
          processedVariations.unshift(cleanedBasePrompt);
          
          // If we now have too many, remove the last one
          if (processedVariations.length > pageCount) {
            processedVariations.pop();
          }
        }
        
        // Return the processed variations
        res.json({ 
          basePrompt: cleanedBasePrompt,
          promptVariations: processedVariations
        });
        
      } catch (jsonError) {
        console.error('Error with JSON format request:', jsonError);
        console.log('Trying alternate approach with list format...');
        
        // Second attempt - request a list format instead
        try {
          const listSystemPrompt = `You are an AI assistant that generates variations of coloring book prompts.
Your outputs MUST be direct, standalone prompts without any preface or explanation.
Do not include phrases like "This is a coloring page featuring..." or "Prompt for a coloring book:".
Each variation should be a complete sentence that could be sent directly to an image generator.`;

          const listUserPrompt = `Base prompt: "${cleanedBasePrompt}"

Create exactly ${pageCount} variations of this prompt for a coloring book.
Each variation should maintain the same style and main elements, but vary in small details.

IMPORTANT:
- Each variation must be a DIRECT prompt with NO introductory text
- KEEP the same main character(s) and overall theme
- VARY only poses, actions, or background elements
- Each prompt should be a complete, standalone sentence

Format your response as a simple numbered list with one variation per line.`;

          const simpleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: listSystemPrompt },
                { role: 'user', content: listUserPrompt }
              ],
              temperature: 0.7
            })
          });
          
          if (!simpleResponse.ok) {
            throw new Error(`API error: ${simpleResponse.status}`);
          }
          
          const simpleData = await simpleResponse.json();
          const content = simpleData.choices[0].message.content;
          
          // Parse the numbered list format
          const lines = content.split('\n');
          const rawVariations = lines
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim()); // Remove numbering
            
          if (rawVariations.length === 0) {
            throw new Error('No variations found in response');
          }
          
          // Process variations to remove any remaining boilerplate
          const processedVariations = rawVariations.map(prompt => {
            // Remove any remaining boilerplate text
            let cleanedPrompt = prompt;
            
            for (const prefix of prefixesToRemove) {
              if (cleanedPrompt.includes(prefix)) {
                cleanedPrompt = cleanedPrompt.replace(prefix, '').trim();
              }
            }
            
            // Remove quote marks if present
            cleanedPrompt = cleanedPrompt.replace(/^["'](.+)["']$/, '$1');
            
            return cleanedPrompt;
          });
          
          // Ensure the first prompt is the original
          let finalVariations = processedVariations.slice(0, pageCount);
          if (finalVariations[0] !== cleanedBasePrompt) {
            finalVariations.unshift(cleanedBasePrompt);
            if (finalVariations.length > pageCount) {
              finalVariations.pop();
            }
          }
          
          res.json({
            basePrompt: cleanedBasePrompt,
            promptVariations: finalVariations
          });
          
        } catch (listError) {
          console.error('List approach also failed:', listError);
          console.log('Using fallback generation method');
          
          // Use the fallback method if both API approaches fail
          const fallbackVariations = generateFallbackVariations();
          
          res.json({
            basePrompt: cleanedBasePrompt,
            promptVariations: fallbackVariations,
            note: 'Using fallback variations due to API issues'
          });
        }
      }
    } catch (error) {
      console.error('All API attempts failed:', error);
      
      // Final fallback
      const fallbackVariations = generateFallbackVariations();
      
      res.json({
        basePrompt: cleanedBasePrompt,
        promptVariations: fallbackVariations,
        note: 'Using fallback variations due to API issues'
      });
    }
  } catch (error) {
    console.error('Error expanding prompts:', error);
    res.status(500).json({ error: error.message || 'An error occurred while expanding prompts' });
  }
});

module.exports = router; 