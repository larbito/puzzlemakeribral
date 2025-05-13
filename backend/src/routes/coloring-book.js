const express = require('express');
const router = express.Router();
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');
const archiver = require('archiver');
const { Readable } = require('stream');
const PDFKit = require('pdfkit');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

// Configure multer for handling form data
const upload = multer({
  limits: {
    fieldSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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
    ]
  });
});

/**
 * Generate a coloring book PDF from individual pages
 * POST /api/coloring-book/create-pdf
 */
router.post('/create-pdf', express.json(), async (req, res) => {
  try {
    console.log('PDF creation request received');
    
    let data = req.body;
    if (typeof req.body.data === 'string') {
      try {
        data = JSON.parse(req.body.data);
      } catch (error) {
        console.error('Error parsing form data:', error);
        return res.status(400).json({ error: 'Invalid data format' });
      }
    }
    
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
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${bookTitle}.pdf"`);
    
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
        // Add blank page before if requested
        if (addBlankPages && i > 0) {
          doc.addPage();
        }
        
        // Add content page
        doc.addPage();
        
        // Download and add image
        const imageResponse = await fetch(pageUrls[i]);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image ${i + 1}`);
        
        const buffer = await imageResponse.buffer();
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
      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error);
      }
    }
    
    // Finalize PDF
    doc.end();
    
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
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    // Pipe archive data to response
    archive.pipe(res);
    
    // Download each image and add to ZIP
    for (let i = 0; i < pageUrls.length; i++) {
      try {
        const imageResponse = await fetch(pageUrls[i]);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image ${i + 1}`);
        
        const buffer = await imageResponse.buffer();
        archive.append(buffer, { name: `page-${i + 1}.png` });
      } catch (error) {
        console.error(`Error processing image ${i + 1}:`, error);
      }
    }
    
    // Finalize archive
    await archive.finalize();
    
  } catch (error) {
    console.error('Error creating ZIP:', error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create ZIP file' });
    }
  }
});

// Image modification options
router.post('/process-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const { operation } = req.body;
    if (!operation) {
      return res.status(400).json({ error: 'Operation parameter is required' });
    }
    
    let processedImage = sharp(req.file.buffer);
    
    switch (operation) {
      case 'enhance-lines':
        // Enhance line art by increasing contrast and sharpening
        processedImage = processedImage
          .sharpen({ sigma: 1.5 })
          .normalize()
          .threshold(128);
        break;
        
      case 'remove-background':
        // Attempt to make background pure white and lines black
        processedImage = processedImage
          .grayscale()
          .normalize()
          .threshold(220)
          .negate();
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
    
    // Output as PNG
    const outputBuffer = await processedImage.png().toBuffer();
    
    // Return as base64
    const base64Image = `data:image/png;base64,${outputBuffer.toString('base64')}`;
    res.json({ image: base64Image });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process image',
      type: error.name
    });
  }
});

module.exports = router; 