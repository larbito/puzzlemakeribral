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
    
    const { basePrompt, pageCount = 1 } = req.body;
    console.log(`Using pageCount: ${pageCount} (explicitly provided: ${req.body.pageCount !== undefined})`);
    
    if (!basePrompt) {
      return res.status(400).json({ error: 'Base prompt is required' });
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    // Only do minimal cleaning of the base prompt - remove common prefixes but preserve structure and detail
    let cleanedBasePrompt = basePrompt.trim();
    
    // List of common prefixes that aren't part of the actual content
    const prefixesToRemove = [
      'This image is suitable for a coloring book:',
      'Prompt for a Coloring Book Page:',
      'Create a coloring book page with',
      'Create a coloring book image of',
      '**Prompt for a Coloring Book Page:**'
    ];
    
    // Only remove exact matches at the beginning of the prompt
    for (const prefix of prefixesToRemove) {
      if (cleanedBasePrompt.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanedBasePrompt = cleanedBasePrompt.substring(prefix.length).trim();
      }
    }
    
    // Ensure the prompt is properly capitalized if needed
    if (cleanedBasePrompt.length > 0 && /[a-z]/.test(cleanedBasePrompt[0])) {
      cleanedBasePrompt = cleanedBasePrompt.charAt(0).toUpperCase() + cleanedBasePrompt.slice(1);
    }
    
    // Ensure the prompt ends with proper punctuation
    if (cleanedBasePrompt.length > 0 && !/[.!?]$/.test(cleanedBasePrompt)) {
      cleanedBasePrompt += '.';
    }
    
    console.log(`Cleaned base prompt: "${cleanedBasePrompt}"`);
    console.log(`Expanding base prompt into ${pageCount} consistent variations`);
    
    // Generate fallback variations if all else fails
    const generateFallbackVariations = () => {
      const variations = [cleanedBasePrompt]; // Start with the original
      
      // Extract potential subjects from the prompt to maintain consistency
      const potentialSubjects = cleanedBasePrompt.match(/\b(ladybug|rabbit|cat|dog|duckling|squirrel|hedgehog|bird|character|creature)\b/gi) || ['character'];
      const subject = potentialSubjects[0].toLowerCase();
      
      // Extract potential settings from the prompt
      const potentialSettings = cleanedBasePrompt.match(/\b(garden|forest|meadow|park|cottage|house|village|castle|field|farm)\b/gi) || ['garden'];
      const setting = potentialSettings[0].toLowerCase();
      
      // Extract potential activities
      const activities = [
        'planting seeds', 'watering flowers', 'picking fruit', 'harvesting vegetables',
        'carrying a basket', 'pushing a wheelbarrow', 'reading a book', 'writing a letter',
        'painting a picture', 'building a small structure', 'arranging flowers',
        'playing with toys', 'flying a kite', 'blowing bubbles'
      ];
      
      // Generate variations with the same structure and setting but varied activities
      for (let i = 1; i < pageCount; i++) {
        // Take the first sentence or up to 100 characters of the base prompt as the foundation
        let baseStructure = cleanedBasePrompt.split('.')[0] + '.';
        if (baseStructure.length > 100) {
          baseStructure = baseStructure.substring(0, 100) + '...';
        }
        
        // Replace the action with a new one, but keep the same subject and setting
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const variation = `${baseStructure} The ${subject} is now ${activity} in the ${setting}.`;
        
        variations.push(variation);
      }
      
      return variations;
    };
    
    try {
      console.log('Making OpenAI API request for consistent prompt variations');
      
      // Use the exact system prompt format suggested for better consistency
      const systemPrompt = `You are an AI assistant that generates high-quality, consistent coloring book page prompts for children.

Your task is to create variations of a base prompt that maintain the same theme, characters, and setting while only varying small details.

FOLLOW THESE GUIDELINES STRICTLY:
1. Keep the same theme, style, and structure as the original prompt
2. Maintain the same characters and setting
3. Only change small scene details, actions, positions, or props
4. Ensure the same level of detail and complexity in each variation
5. Maintain the tone and writing style of the original
6. Output clean text only - no labels, no numbers, no explanations
7. Each prompt should be a standalone, complete description`;

      // More structured user prompt with clear instructions and examples
      const userPrompt = `Base Prompt:
${cleanedBasePrompt}

Task:
Generate ${pageCount} similar coloring book prompts based on the base prompt above. Each variation should:

- Maintain the same theme, structure, and visual style
- Keep the same characters and setting
- Change only small scene details, actions, or props 
- Output only the prompts in clean text (no prefaces, no headings)

Target audience is children. Use clean language and maintain a whimsical, inviting tone.

IMPORTANT: Do not start prompts with phrases like "A coloring page of" or "This image shows". 
Return ONLY the content of each prompt as direct descriptions.

Format your response as a JSON object with an array of prompt variations.`;

      // First API call attempt using JSON response format
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.75
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
        
        // Process the generated variations - minimal cleaning to preserve structure and detail
        const processedVariations = promptVariations.map(prompt => {
          if (!prompt || typeof prompt !== 'string') return '';
          
          // Remove quote marks if present
          let cleanedPrompt = prompt.replace(/^["'](.+)["']$/s, '$1').trim();
          
          // Remove any numbered prefixes (like "1. ")
          cleanedPrompt = cleanedPrompt.replace(/^\d+\.\s+/, '');
          
          // Ensure prompt is properly capitalized
          if (cleanedPrompt.length > 0 && /[a-z]/.test(cleanedPrompt[0])) {
            cleanedPrompt = cleanedPrompt.charAt(0).toUpperCase() + cleanedPrompt.slice(1);
          }
          
          // Ensure prompt ends with proper punctuation
          if (cleanedPrompt.length > 0 && !/[.!?]$/.test(cleanedPrompt)) {
            cleanedPrompt += '.';
          }
          
          return cleanedPrompt;
        }).filter(prompt => prompt.length > 0);
        
        // Ensure the first prompt is the original if it's not already included
        let finalVariations = processedVariations;
        if (processedVariations.length > 0 && !processedVariations.includes(cleanedBasePrompt)) {
          finalVariations = [cleanedBasePrompt, ...processedVariations.slice(0, pageCount - 1)];
        }
        
        // Ensure we have the requested number of variations
        if (finalVariations.length < pageCount) {
          // Pad with duplicates of the original if needed
          console.log(`Padding variations array: generated ${finalVariations.length}, needed ${pageCount}`);
          while (finalVariations.length < pageCount) {
            finalVariations.push(cleanedBasePrompt);
          }
        } else if (finalVariations.length > pageCount) {
          // Trim to requested size
          console.log(`Trimming variations array: generated ${finalVariations.length}, needed ${pageCount}`);
          finalVariations = finalVariations.slice(0, pageCount);
        }
        
        console.log(`Returning ${finalVariations.length} variations for request with pageCount=${pageCount}`);
        
        // Return the processed variations
        res.json({ 
          basePrompt: cleanedBasePrompt,
          promptVariations: finalVariations
        });
        
      } catch (jsonError) {
        console.error('Error with JSON format request:', jsonError);
        console.log('Trying alternate approach with list format...');
        
        // Second attempt - request a list format instead
        try {
          // Use the same system prompt but request a list format
          const listUserPrompt = `Base Prompt:
${cleanedBasePrompt}

Task:
Generate exactly ${pageCount} similar coloring book prompts based on the base prompt above. Each variation should:

- Maintain the same theme, structure, and visual style
- Keep the same characters and setting
- Change only small scene details, actions, or props 
- Output only the prompts in clean text

Format your response as a simple numbered list with one variation per line, like this:
1. First prompt variation
2. Second prompt variation
3. Third prompt variation`;

          const simpleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: listUserPrompt }
              ],
              temperature: 0.75
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
            .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim()) // Remove numbering
            .map(line => line.replace(/^["'](.+)["']$/s, '$1').trim()); // Remove quotes
            
          if (rawVariations.length === 0) {
            throw new Error('No variations found in response');
          }
          
          // Process variations - minimal cleaning to preserve structure and detail
          const processedVariations = rawVariations.map(prompt => {
            let cleanedPrompt = prompt;
            
            // Ensure prompt is properly capitalized
            if (cleanedPrompt.length > 0 && /[a-z]/.test(cleanedPrompt[0])) {
              cleanedPrompt = cleanedPrompt.charAt(0).toUpperCase() + cleanedPrompt.slice(1);
            }
            
            // Ensure prompt ends with proper punctuation
            if (cleanedPrompt.length > 0 && !/[.!?]$/.test(cleanedPrompt)) {
              cleanedPrompt += '.';
            }
            
            return cleanedPrompt;
          }).filter(prompt => prompt.length > 0);
          
          // Ensure the first prompt is the original if not already included
          let finalVariations = processedVariations;
          if (processedVariations.length > 0 && !processedVariations.includes(cleanedBasePrompt)) {
            finalVariations = [cleanedBasePrompt, ...processedVariations.slice(0, pageCount - 1)];
          }
          
          // Ensure we have the requested number of variations
          if (finalVariations.length < pageCount) {
            // Pad with duplicates of the original if needed
            console.log(`Padding variations array: generated ${finalVariations.length}, needed ${pageCount}`);
            while (finalVariations.length < pageCount) {
              finalVariations.push(cleanedBasePrompt);
            }
          } else if (finalVariations.length > pageCount) {
            // Trim to requested size
            console.log(`Trimming variations array: generated ${finalVariations.length}, needed ${pageCount}`);
            finalVariations = finalVariations.slice(0, pageCount);
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

// Export the expandPrompts function so it can be used directly by other modules
module.exports = {
  router,
  expandPrompts: async (basePrompt, pageCount = 1) => {
    try {
      console.log(`expandPrompts function called with pageCount: ${pageCount || 1}`);
      
      // Default to 1 if pageCount is invalid
      if (!pageCount || pageCount < 1) {
        console.log('Invalid pageCount provided, defaulting to 1');
        pageCount = 1;
      }
      
      // Only do minimal cleaning of the base prompt - remove common prefixes but preserve structure and detail
      let cleanedBasePrompt = basePrompt.trim();
      
      // List of common prefixes that aren't part of the actual content
      const prefixesToRemove = [
        'This image is suitable for a coloring book:',
        'Prompt for a Coloring Book Page:',
        'Create a coloring book page with',
        'Create a coloring book image of',
        '**Prompt for a Coloring Book Page:**'
      ];
      
      // Only remove exact matches at the beginning of the prompt
      for (const prefix of prefixesToRemove) {
        if (cleanedBasePrompt.toLowerCase().startsWith(prefix.toLowerCase())) {
          cleanedBasePrompt = cleanedBasePrompt.substring(prefix.length).trim();
        }
      }
      
      // Ensure the prompt is properly capitalized if needed
      if (cleanedBasePrompt.length > 0 && /[a-z]/.test(cleanedBasePrompt[0])) {
        cleanedBasePrompt = cleanedBasePrompt.charAt(0).toUpperCase() + cleanedBasePrompt.slice(1);
      }
      
      // Ensure the prompt ends with proper punctuation
      if (cleanedBasePrompt.length > 0 && !/[.!?]$/.test(cleanedBasePrompt)) {
        cleanedBasePrompt += '.';
      }
      
      console.log(`Cleaned base prompt: "${cleanedBasePrompt}"`);
      console.log(`Expanding base prompt into ${pageCount} consistent variations`);
      
      // Generate fallback variations if all else fails
      const generateFallbackVariations = () => {
        const variations = [cleanedBasePrompt]; // Start with the original
        
        // Extract potential subjects from the prompt to maintain consistency
        const potentialSubjects = cleanedBasePrompt.match(/\b(ladybug|rabbit|cat|dog|duckling|squirrel|hedgehog|bird|character|creature)\b/gi) || ['character'];
        const subject = potentialSubjects[0].toLowerCase();
        
        // Extract potential settings from the prompt
        const potentialSettings = cleanedBasePrompt.match(/\b(garden|forest|meadow|park|cottage|house|village|castle|field|farm)\b/gi) || ['garden'];
        const setting = potentialSettings[0].toLowerCase();
        
        // Extract potential activities
        const activities = [
          'planting seeds', 'watering flowers', 'picking fruit', 'harvesting vegetables',
          'carrying a basket', 'pushing a wheelbarrow', 'reading a book', 'writing a letter',
          'painting a picture', 'building a small structure', 'arranging flowers',
          'playing with toys', 'flying a kite', 'blowing bubbles'
        ];
        
        // Generate variations with the same structure and setting but varied activities
        for (let i = 1; i < pageCount; i++) {
          // Take the first sentence or up to 100 characters of the base prompt as the foundation
          let baseStructure = cleanedBasePrompt.split('.')[0] + '.';
          if (baseStructure.length > 100) {
            baseStructure = baseStructure.substring(0, 100) + '...';
          }
          
          // Replace the action with a new one, but keep the same subject and setting
          const activity = activities[Math.floor(Math.random() * activities.length)];
          const variation = `${baseStructure} The ${subject} is now ${activity} in the ${setting}.`;
          
          variations.push(variation);
        }
        
        return variations;
      };
      
      // Use OpenAI API to generate better variations
      try {
        console.log('Making OpenAI API request for consistent prompt variations');
        
        // Use the exact system prompt format suggested for better consistency
        const systemPrompt = `You are an AI assistant that generates high-quality, consistent coloring book page prompts for children.

Your task is to create variations of a base prompt that maintain the same theme, characters, and setting while only varying small details.

FOLLOW THESE GUIDELINES STRICTLY:
1. Keep the same theme, style, and structure as the original prompt
2. Maintain the same characters and setting
3. Only change small scene details, actions, positions, or props
4. Ensure the same level of detail and complexity in each variation
5. Maintain the tone and writing style of the original
6. Output clean text only - no labels, no numbers, no explanations
7. Each prompt should be a standalone, complete description`;

        // More structured user prompt with clear instructions and examples
        const userPrompt = `Base Prompt:
${cleanedBasePrompt}

Task:
Generate ${pageCount} similar coloring book prompts based on the base prompt above. Each variation should:

- Maintain the same theme, structure, and visual style
- Keep the same characters and setting
- Change only small scene details, actions, or props 
- Output only the prompts in clean text (no prefaces, no headings)

Target audience is children. Use clean language and maintain a whimsical, inviting tone.

IMPORTANT: Do not start prompts with phrases like "A coloring page of" or "This image shows". 
Return ONLY the content of each prompt as direct descriptions.

Format your response as a JSON object with an array of prompt variations.`;

        // First API call attempt using JSON response format
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.75
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
        
        // If we still don't have prompt variations, use fallback
        if (!promptVariations || promptVariations.length === 0) {
          throw new Error('Could not find prompt variations array in API response');
        }
        
        // Process the generated variations - minimal cleaning to preserve structure and detail
        const processedVariations = promptVariations.map(prompt => {
          if (!prompt || typeof prompt !== 'string') return '';
          
          // Remove quote marks if present
          let cleanedPrompt = prompt.replace(/^["'](.+)["']$/s, '$1').trim();
          
          // Remove any numbered prefixes (like "1. ")
          cleanedPrompt = cleanedPrompt.replace(/^\d+\.\s+/, '');
          
          // Ensure prompt is properly capitalized
          if (cleanedPrompt.length > 0 && /[a-z]/.test(cleanedPrompt[0])) {
            cleanedPrompt = cleanedPrompt.charAt(0).toUpperCase() + cleanedPrompt.slice(1);
          }
          
          // Ensure prompt ends with proper punctuation
          if (cleanedPrompt.length > 0 && !/[.!?]$/.test(cleanedPrompt)) {
            cleanedPrompt += '.';
          }
          
          return cleanedPrompt;
        }).filter(prompt => prompt.length > 0);
        
        // Ensure the first prompt is the original if it's not already included
        let finalVariations = processedVariations;
        if (processedVariations.length > 0 && !processedVariations.includes(cleanedBasePrompt)) {
          finalVariations = [cleanedBasePrompt, ...processedVariations.slice(0, pageCount - 1)];
        }
        
        // Ensure we have the requested number of variations
        if (finalVariations.length < pageCount) {
          // Pad with duplicates of the original if needed
          console.log(`Padding variations array: generated ${finalVariations.length}, needed ${pageCount}`);
          while (finalVariations.length < pageCount) {
            finalVariations.push(cleanedBasePrompt);
          }
        } else if (finalVariations.length > pageCount) {
          // Trim to requested size
          console.log(`Trimming variations array: generated ${finalVariations.length}, needed ${pageCount}`);
          finalVariations = finalVariations.slice(0, pageCount);
        }
        
        console.log(`Returning ${finalVariations.length} variations for request with pageCount=${pageCount}`);
        
        return finalVariations;
      } catch (apiError) {
        console.error('API error, using fallback variations:', apiError);
        return generateFallbackVariations();
      }
      
    } catch (error) {
      console.error('Error in expandPrompts function:', error);
      // Return an array with duplicates of the base prompt as fallback
      return Array(pageCount).fill(basePrompt);
    }
  }
}; 