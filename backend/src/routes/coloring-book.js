const express = require('express');
const router = express.Router();
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');
const archiver = require('archiver');
const { Readable } = require('stream');

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
    
    const {
      pageUrls,
      trimSize,
      addBlankPages,
      showPageNumbers,
      includeBleed,
      bookTitle
    } = req.body;

    console.log('PDF creation options:', {
      pageCount: pageUrls?.length,
      trimSize,
      addBlankPages,
      showPageNumbers,
      includeBleed,
      bookTitle
    });

    if (!pageUrls || !Array.isArray(pageUrls) || pageUrls.length === 0) {
      return res.status(400).json({ error: 'Page URLs are required' });
    }

    // Parse trim size (format: "8.5x11", "6x9", etc.)
    const [widthStr, heightStr] = (trimSize || '8.5x11').split('x');
    const trimWidth = parseFloat(widthStr);
    const trimHeight = parseFloat(heightStr);

    if (isNaN(trimWidth) || isNaN(trimHeight)) {
      return res.status(400).json({ error: 'Invalid trim size format' });
    }

    // Add bleed if requested (0.125" on each side)
    const bleed = includeBleed ? 0.125 : 0;
    
    // Calculate dimensions in inches
    const pageWidth = trimWidth + (bleed * 2);
    const pageHeight = trimHeight + (bleed * 2);
    
    // Convert to points (72 points per inch for PDF)
    const pageWidthPt = pageWidth * 72;
    const pageHeightPt = pageHeight * 72;

    console.log('Creating PDF with dimensions:', {
      pageWidth,
      pageHeight,
      pageWidthPt,
      pageHeightPt
    });

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Set PDF metadata
    pdfDoc.setTitle(bookTitle || 'Coloring Book');
    pdfDoc.setAuthor('Generated with AI Coloring Book Creator');
    pdfDoc.setSubject('Coloring Pages');
    pdfDoc.setKeywords(['coloring', 'book', 'ai', 'generated']);

    // Download and add each page to the PDF
    for (let i = 0; i < pageUrls.length; i++) {
      try {
        console.log(`Processing page ${i + 1} of ${pageUrls.length}`);
        
        // Download the image
        const imageUrl = pageUrls[i];
        let imageBuffer;
        
        if (imageUrl.startsWith('data:')) {
          // Handle data URLs
          console.log(`Page ${i + 1} is a data URL`);
          const base64Data = imageUrl.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // Download from URL
          console.log(`Downloading page ${i + 1} from URL: ${imageUrl.substring(0, 50)}...`);
          const imageResponse = await fetch(imageUrl);
          
          if (!imageResponse.ok) {
            console.error(`Failed to download image ${i + 1}: ${imageResponse.status}`);
            continue;
          }
          
          imageBuffer = await imageResponse.buffer();
          console.log(`Downloaded page ${i + 1}, buffer size: ${imageBuffer.length} bytes`);
        }
        
        // Process with sharp to ensure it's a PNG with correct dimensions
        const processedImageBuffer = await sharp(imageBuffer)
          .resize({
            width: Math.round(pageWidth * 300), // 300 DPI
            height: Math.round(pageHeight * 300),
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png()
          .toBuffer();
        
        console.log(`Processed page ${i + 1}, buffer size: ${processedImageBuffer.length} bytes`);
        
        // Add a new page to the PDF
        const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
        
        // Convert processed image to PDF compatible format
        const image = await pdfDoc.embedPng(processedImageBuffer);
        
        // Calculate dimensions to fit the image on the page
        const { width, height } = image.scale(1);
        const x = (pageWidthPt - width) / 2;
        const y = (pageHeightPt - height) / 2;
        
        // Draw the image on the page
        page.drawImage(image, {
          x,
          y,
          width,
          height
        });
        
        // Add page number if requested
        if (showPageNumbers) {
          const pageNumber = i + 1;
          page.drawText(`${pageNumber}`, {
            x: pageWidthPt / 2,
            y: 20,
            size: 12,
            color: rgb(0, 0, 0)
          });
        }
        
        // Add a blank page if requested
        if (addBlankPages && i < pageUrls.length - 1) {
          const blankPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
          
          if (showPageNumbers) {
            const blankPageNumber = i + 2;
            blankPage.drawText(`${blankPageNumber}`, {
              x: pageWidthPt / 2,
              y: 20,
              size: 12,
              color: rgb(0, 0, 0)
            });
          }
        }
        
        console.log(`Added page ${i + 1} to PDF`);
      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error);
        // Continue with next page
      }
    }
    
    // Serialize the PDF to bytes
    console.log('Serializing PDF document');
    const pdfBytes = await pdfDoc.save();
    
    // Convert the PDF bytes to a Buffer
    const buffer = Buffer.from(pdfBytes);
    console.log(`PDF created, buffer size: ${buffer.length} bytes`);
    
    // Set appropriate headers for download
    const filename = `${bookTitle || 'coloring-book'}.pdf`.replace(/[^a-zA-Z0-9\-_.]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the PDF
    console.log('Sending PDF to client');
    res.send(buffer);
    console.log('PDF sent successfully');
  } catch (error) {
    console.error('Error creating PDF:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create PDF',
      type: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Download all images as a ZIP file
 * POST /api/coloring-book/download-zip
 */
router.post('/download-zip', express.json(), async (req, res) => {
  try {
    console.log('ZIP creation request received');
    
    const { pageUrls, bookTitle } = req.body;
    
    console.log('ZIP creation options:', {
      pageCount: pageUrls?.length,
      bookTitle
    });
    
    if (!pageUrls || !Array.isArray(pageUrls) || pageUrls.length === 0) {
      return res.status(400).json({ error: 'Page URLs are required' });
    }
    
    // Set up the response headers for a ZIP file
    const filename = `${bookTitle || 'coloring-pages'}.zip`.replace(/[^a-zA-Z0-9\-_.]/g, '_');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Create a ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Handle archive warnings
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        console.error('Archive error:', err);
        throw err;
      }
    });
    
    // Handle archive errors
    archive.on('error', function(err) {
      console.error('Archive error:', err);
      throw err;
    });
    
    // Pipe the archive data to the response
    archive.pipe(res);
    
    // Process each image and add to the ZIP
    for (let i = 0; i < pageUrls.length; i++) {
      try {
        console.log(`Processing ZIP image ${i + 1} of ${pageUrls.length}`);
        
        const imageUrl = pageUrls[i];
        let imageBuffer;
        
        if (imageUrl.startsWith('data:')) {
          // Handle data URLs
          console.log(`ZIP image ${i + 1} is a data URL`);
          const base64Data = imageUrl.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // Download from URL
          console.log(`Downloading ZIP image ${i + 1} from URL: ${imageUrl.substring(0, 50)}...`);
          const imageResponse = await fetch(imageUrl);
          
          if (!imageResponse.ok) {
            console.error(`Failed to download image ${i + 1}: ${imageResponse.status}`);
            continue;
          }
          
          imageBuffer = await imageResponse.buffer();
          console.log(`Downloaded ZIP image ${i + 1}, buffer size: ${imageBuffer.length} bytes`);
        }
        
        // Process with sharp to ensure it's a PNG
        const processedImageBuffer = await sharp(imageBuffer)
          .png()
          .toBuffer();
        
        console.log(`Processed ZIP image ${i + 1}, buffer size: ${processedImageBuffer.length} bytes`);
        
        // Create a readable stream from the buffer
        const stream = new Readable();
        stream.push(processedImageBuffer);
        stream.push(null); // End of stream
        
        // Add the image to the ZIP file
        archive.append(stream, { name: `coloring-page-${i + 1}.png` });
        console.log(`Added image ${i + 1} to ZIP file`);
      } catch (error) {
        console.error(`Error processing ZIP image ${i + 1}:`, error);
        // Continue with next image
      }
    }
    
    // Log when archive is finalized
    archive.on('end', function() {
      console.log('ZIP archive has been finalized. Total bytes:', archive.pointer());
    });
    
    // Finalize the ZIP file
    console.log('Finalizing ZIP file');
    await archive.finalize();
    console.log('ZIP file sent to client');
  } catch (error) {
    console.error('Error creating ZIP:', error);
    
    // If the response has already been sent or finalized, we can't send an error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message || 'Failed to create ZIP file',
        type: error.name
      });
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