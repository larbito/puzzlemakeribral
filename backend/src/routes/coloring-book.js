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
      trimSize,
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
    
    // Create PDF document
    const doc = new PDFKit({
      autoFirstPage: false,
      size: trimSize || 'LETTER',
      margin: includeBleed ? 36 : 72 // 0.5 inch or 1 inch margins
    });
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add pages to PDF
    for (let i = 0; i < pageUrls.length; i++) {
      try {
        console.log(`Processing page ${i + 1} of ${pageUrls.length}`);
        
        // Add blank page before if requested
        if (addBlankPages && i > 0) {
          doc.addPage();
        }
        
        // Add content page
        doc.addPage();
        
        // Download and add image
        console.log(`Fetching image from: ${pageUrls[i].substring(0, 100)}...`);
        const imageResponse = await fetch(pageUrls[i]);
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image ${i + 1}: ${imageResponse.status}`);
          continue;
        }
        
        const buffer = await imageResponse.buffer();
        console.log(`Successfully downloaded image ${i + 1} (${buffer.length} bytes)`);
        
        // Add the image to the PDF without processing
        doc.image(buffer, {
          fit: [doc.page.width - (includeBleed ? 72 : 144), doc.page.height - (includeBleed ? 72 : 144)],
          align: 'center',
          valign: 'center'
        });
        
        // Add page number if requested
        if (showPageNumbers) {
          doc.fontSize(12)
             .text(`${i + 1}`, doc.page.width / 2, doc.page.height - 40, {
               align: 'center'
             });
        }
        
        console.log(`Added page ${i + 1} to PDF`);
      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error);
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
      trimSize,
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
    
    // Create PDF document
    const doc = new PDFKit({
      autoFirstPage: false,
      size: trimSize || 'LETTER',
      margin: includeBleed ? 36 : 72 // 0.5 inch or 1 inch margins
    });
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add pages to PDF
    for (let i = 0; i < pageUrls.length; i++) {
      try {
        console.log(`Processing page ${i + 1} of ${pageUrls.length}`);
        
        // Add blank page before if requested
        if (addBlankPages && i > 0) {
          doc.addPage();
        }
        
        // Add content page
        doc.addPage();
        
        // Download and add image
        console.log(`Fetching image from: ${pageUrls[i].substring(0, 100)}...`);
        const imageResponse = await fetch(pageUrls[i]);
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image ${i + 1}: ${imageResponse.status}`);
          continue;
        }
        
        const buffer = await imageResponse.buffer();
        console.log(`Successfully downloaded image ${i + 1} (${buffer.length} bytes)`);
        
        doc.image(buffer, {
          fit: [doc.page.width - (includeBleed ? 72 : 144), doc.page.height - (includeBleed ? 72 : 144)],
          align: 'center',
          valign: 'center'
        });
        
        // Add page number if requested
        if (showPageNumbers) {
          doc.fontSize(12)
             .text(`${i + 1}`, doc.page.width / 2, doc.page.height - 40, {
               align: 'center'
             });
        }
        
        console.log(`Added page ${i + 1} to PDF`);
      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error);
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
    
    let data;
    try {
      data = JSON.parse(decodeURIComponent(req.query.data || '{}'));
    } catch (error) {
      console.error('Error parsing query data:', error);
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    const { pageUrls, bookTitle = 'coloring-pages' } = data;
    
    if (!pageUrls || !Array.isArray(pageUrls) || pageUrls.length === 0) {
      return res.status(400).json({ error: 'Page URLs are required' });
    }
    
    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${bookTitle}.zip"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    // Pipe archive data to response
    archive.pipe(res);
    
    // Download each image and add to ZIP
    for (let i = 0; i < pageUrls.length; i++) {
      try {
        console.log(`Processing image ${i + 1} of ${pageUrls.length}`);
        const imageResponse = await fetch(pageUrls[i]);
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image ${i + 1}: ${imageResponse.status}`);
          continue;
        }
        
        const buffer = await imageResponse.buffer();
        console.log(`Downloaded image ${i + 1} (${buffer.length} bytes)`);
        
        // Add directly to ZIP without processing
        archive.append(buffer, { name: `page-${i + 1}.png` });
        console.log(`Added image ${i + 1} to ZIP`);
      } catch (error) {
        console.error(`Error processing image ${i + 1}:`, error);
      }
    }
    
    // Finalize archive
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

module.exports = router; 