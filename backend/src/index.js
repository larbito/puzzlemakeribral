require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// STARTUP DEBUG - THIS SHOULD APPEAR IN LOGS
console.log('=====================================');
console.log('STARTING SERVER - MINIMAL TEST MODE');
console.log('=====================================');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Current directory:', process.cwd());
console.log('Files in current directory:');
fs.readdirSync(process.cwd()).forEach(file => {
  console.log(' - ' + file);
});
console.log('Files in src directory:');
try {
  fs.readdirSync(path.join(process.cwd(), 'src')).forEach(file => {
    console.log(' - ' + file);
  });
} catch (e) {
  console.error('Error reading src directory:', e.message);
}
console.log('Files in src/routes directory:');
try {
  fs.readdirSync(path.join(process.cwd(), 'src', 'routes')).forEach(file => {
    console.log(' - ' + file);
  });
} catch (e) {
  console.error('Error reading src/routes directory:', e.message);
}

// Load the coloring book routes module
let coloringBookRoutes;
try {
  console.log('Attempting to require coloring-book.js');
  const coloringBookModule = require('./routes/coloring-book');
  coloringBookRoutes = coloringBookModule.router || coloringBookModule;
  console.log('Successfully loaded coloring-book.js');
} catch (e) {
  console.error('Failed to load coloring-book.js:', e.message);
  console.error(e.stack);
  // Use a simple router as fallback
  coloringBookRoutes = express.Router();
  coloringBookRoutes.get('/test', (req, res) => {
    res.json({ status: 'error', message: 'Failed to load real routes', error: e.message });
  });
}

// Load the ideogram routes module
let ideogramRoutes;
try {
  console.log('Attempting to require ideogram.js');
  ideogramRoutes = require('./routes/ideogram');
  console.log('Successfully loaded ideogram.js');
} catch (e) {
  console.error('Failed to load ideogram.js:', e.message);
  console.error(e.stack);
  // Use a simple router as fallback
  ideogramRoutes = express.Router();
  ideogramRoutes.get('/test', (req, res) => {
    res.json({ status: 'error', message: 'Failed to load ideogram routes', error: e.message });
  });
}

// Load the vectorize routes module
let vectorizeRoutes;
try {
  console.log('Attempting to require vectorizeRoutes.js');
  vectorizeRoutes = require('./routes/vectorizeRoutes');
  console.log('Successfully loaded vectorizeRoutes.js');
} catch (e) {
  console.error('Failed to load vectorizeRoutes.js:', e.message);
  console.error(e.stack);
  // Use a simple router as fallback
  vectorizeRoutes = express.Router();
  vectorizeRoutes.get('/test', (req, res) => {
    res.json({ status: 'error', message: 'Failed to load vectorize routes', error: e.message });
  });
}

// Load the book cover routes module
let bookCoverRoutes;
try {
  console.log('Attempting to require book-cover.js');
  bookCoverRoutes = require('./routes/book-cover');
  console.log('Successfully loaded book-cover.js');
} catch (e) {
  console.error('Failed to load book-cover.js:', e.message);
  console.error(e.stack);
  // Use a simple router as fallback
  bookCoverRoutes = express.Router();
  bookCoverRoutes.get('/test', (req, res) => {
    res.json({ status: 'error', message: 'Failed to load book cover routes', error: e.message });
  });
}

// Load the OpenAI routes module
let openaiRoutes;
try {
  console.log('Attempting to require openai.js');
  openaiRoutes = require('./routes/openai');
  console.log('Successfully loaded openai.js');
} catch (e) {
  console.error('Failed to load openai.js:', e.message);
  console.error(e.stack);
  // Use a simple router as fallback
  openaiRoutes = express.Router();
  openaiRoutes.get('/test', (req, res) => {
    res.json({ status: 'error', message: 'Failed to load OpenAI routes', error: e.message });
  });
}

// Load the image enhancement routes module
let imageEnhancementRoutes;
try {
  console.log('Attempting to require imageEnhancement.js');
  imageEnhancementRoutes = require('./routes/imageEnhancement');
  console.log('Successfully loaded imageEnhancement.js');
} catch (e) {
  console.error('Failed to load imageEnhancement.js:', e.message);
  console.error(e.stack);
  // Use a simple router as fallback
  imageEnhancementRoutes = express.Router();
  imageEnhancementRoutes.get('/test', (req, res) => {
    res.json({ status: 'error', message: 'Failed to load image enhancement routes', error: e.message });
  });
}

// Load the word search puzzle generator routes module
let wordSearchRoutes;
try {
  console.log('Attempting to require wordSearchRoutes.js');
  wordSearchRoutes = require('./routes/wordSearchRoutes');
  console.log('Successfully loaded wordSearchRoutes.js');
} catch (e) {
  console.error('Failed to load wordSearchRoutes.js:', e.message);
  console.error(e.stack);
  // Use a simple router as fallback
  wordSearchRoutes = express.Router();
  wordSearchRoutes.get('/test', (req, res) => {
    res.json({ status: 'error', message: 'Failed to load word search routes', error: e.message });
  });
}

// Load the KDP Formatter routes module
let kdpFormatterRoutes;
try {
  console.log('Attempting to require kdp-formatter.js');
  kdpFormatterRoutes = require('./routes/kdp-formatter');
  console.log('Successfully loaded kdp-formatter.js');
} catch (e) {
  console.error('Failed to load kdp-formatter.js:', e.message);
  console.error(e.stack);
  // Use a simple router as fallback
  kdpFormatterRoutes = express.Router();
  kdpFormatterRoutes.get('/test', (req, res) => {
    res.json({ status: 'error', message: 'Failed to load KDP Formatter routes', error: e.message });
  });
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to allow requests from any origin
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Expires', 'Origin', 'X-Enhanced-Image', 'x-enhanced'],
  maxAge: 86400 // Cache preflight request results for 24 hours (86400 seconds)
}));

// Add explicit CORS handler for OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Cache-Control, Pragma, Expires, Origin, X-Enhanced-Image, x-enhanced');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

// Serve static files from the 'static' directory
const staticDir = path.join(__dirname, '..', 'static');
console.log(`Serving static files from: ${staticDir}`);
app.use('/static', express.static(staticDir));

// Serve book PDFs from the 'public/books' directory
const booksDir = path.join(__dirname, '..', 'public', 'books');
console.log(`Serving books from: ${booksDir}`);
// Create books directory if it doesn't exist
if (!fs.existsSync(booksDir)) {
  try {
    fs.mkdirSync(booksDir, { recursive: true });
    console.log('Created books directory at:', booksDir);
  } catch (error) {
    console.error('Failed to create books directory:', error);
  }
}
app.use('/books', express.static(booksDir));

// Serve processed images from the 'images' directory
const imagesDir = path.join(__dirname, '..', 'images');
console.log(`Serving images from: ${imagesDir}`);
// Create images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
  try {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created images directory at:', imagesDir);
  } catch (error) {
    console.error('Failed to create images directory:', error);
  }
}

// Enhanced static file serving for images with custom options and CORS headers
app.use('/images', (req, res, next) => {
  // Add CORS headers specifically for image files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Log the image request for debugging
  console.log(`Image request: ${req.path}`);
  next();
}, express.static(imagesDir, {
  maxAge: 0, // Don't cache images
  etag: false, // Don't use etags to prevent 304 responses
  lastModified: false, // Don't use last-modified to prevent 304 responses
  setHeaders: (res) => {
    // Ensure images are always sent with proper headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'image/png');
  }
}));

// Special route to handle direct image access
app.get('/images/:filename', (req, res, next) => {
  const filename = req.params.filename;
  const imagePath = path.join(imagesDir, filename);
  
  console.log(`Direct image access request for: ${filename}`);
  console.log(`Checking if file exists at: ${imagePath}`);
  
  // Check if file exists
  if (fs.existsSync(imagePath)) {
    console.log(`Image file found, serving: ${filename}`);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    fs.createReadStream(imagePath).pipe(res);
  } else {
    console.error(`Image file not found: ${filename}`);
    // Pass to next handler which will return 404
    next();
  }
});

// Keep the temporary file route for backward compatibility
app.get('/temp-photoroom-result.png', (req, res) => {
  console.log('Serving temporary PhotoRoom result image');
  const imagePath = path.join(__dirname, '..', 'temp-photoroom-result.png');
  
  // Check if file exists
  if (fs.existsSync(imagePath)) {
    console.log('Image file found, serving:', imagePath);
    res.setHeader('Content-Type', 'image/png');
    fs.createReadStream(imagePath).pipe(res);
  } else {
    console.error('Image file not found at path:', imagePath);
    res.status(404).send('Image not found');
  }
});

// Increase the payload size limit for large images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint required by Railway
app.get('/health', (req, res) => {
  console.log('Health check called');
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    message: 'Server is running'
  });
});

// Register routes
app.use('/api/coloring-book', coloringBookRoutes);
console.log('Registered route: /api/coloring-book/*');

// Register ideogram routes
app.use('/api/ideogram', ideogramRoutes);
console.log('Registered route: /api/ideogram/*');

// Register vectorize routes
app.use('/api/vectorize', vectorizeRoutes);
console.log('Registered route: /api/vectorize/*');

// Register book cover routes
app.use('/api/book-cover', bookCoverRoutes);
console.log('Registered route: /api/book-cover/*');

// Register OpenAI routes
app.use('/api/openai', openaiRoutes);
console.log('Registered route: /api/openai/*');

// Register image enhancement routes
app.use('/api/image-enhancement', imageEnhancementRoutes);
console.log('Registered route: /api/image-enhancement/*');

// Register word search puzzle generator routes
app.use('/api/word-search', wordSearchRoutes);
console.log('Registered route: /api/word-search/*');

// Register KDP Formatter routes
app.use('/api/kdp-formatter', kdpFormatterRoutes);
console.log('Registered route: /api/kdp-formatter/*');

// Add route aliases for KDP Cover Generator frontend compatibility
// These map the expected frontend endpoints to existing backend functionality

// Route alias: /api/analyze-image -> Direct KDP cover analysis (bypass ideogram router)
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  console.log('KDP Cover Generator: Direct GPT-4 Vision analysis for KDP covers');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('KDP Cover Analysis - Request body:', req.body);
    console.log('KDP Cover Analysis - File info:', { 
      originalname: req.file.originalname, 
      mimetype: req.file.mimetype, 
      size: req.file.size 
    });

    // Convert the image buffer to base64
    const base64Image = req.file.buffer.toString('base64');

    // Call OpenAI's GPT-4 Vision API with KDP-specific system prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert KDP cover designer. You are analyzing a book cover image to create a visual prompt suitable for generating a **6x9 inch Amazon KDP front cover** using DALL·E 3 or similar AI.\n\nFocus only on:\n- Title placement\n- Visual hierarchy\n- Main character(s)\n- Scene composition\n- Color scheme\n- Artistic style\n- Mood and layout\n\nDo NOT describe it as a t-shirt or poster.\nDo NOT suggest icons or decorations.\nAvoid extra instructions, markdown, or bullet points.\n\nYour output must be a **single paragraph** prompt that can be used directly with DALL·E 3 to recreate the design.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this book cover image and create a detailed visual prompt for AI generation:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${req.file.mimetype};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to analyze image');
    }

    const data = await response.json();
    const kdpPrompt = data.choices[0].message.content;
    console.log('Generated KDP cover prompt:', kdpPrompt);
    
    // Return the KDP-specific prompt
    res.json({ prompt: kdpPrompt });
  } catch (error) {
    console.error('Error in KDP cover analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route alias: /api/enhance-prompt -> call openai enhance-prompt handler directly  
app.post('/api/enhance-prompt', async (req, res) => {
  console.log('KDP Cover Generator: Enhancing prompt with GPT-4');
  try {
    // Set the path for the openai router to recognize
    req.originalUrl = '/api/openai/enhance-prompt';
    req.url = '/enhance-prompt';
    req.baseUrl = '/api/openai';
    
    // Call the openai router directly with the modified request
    openaiRoutes(req, res, (err) => {
      if (err) {
        console.error('Error in openai router:', err);
        res.status(500).json({ error: 'Failed to enhance prompt' });
      }
    });
  } catch (error) {
    console.error('Error in enhance-prompt alias:', error);
    res.status(500).json({ error: 'Failed to enhance prompt' });
  }
});

// Route alias: /api/generate-cover -> call ideogram generate handler directly
app.post('/api/generate-cover', async (req, res) => {
  console.log('KDP Cover Generator: Generating cover image');
  try {
    const { model, prompt, style, kdp_settings, spine_width } = req.body;
    
    // Log KDP settings for debugging
    console.log('KDP Settings:', kdp_settings);
    console.log('Spine Width:', spine_width);
    console.log('Selected Model:', model);
    console.log('Style:', style);
    
    if (model === 'dalle') {
      // Forward to OpenAI/DALL-E generation (you may need to implement this)
      // For now, use ideogram as fallback
      console.log('Using Ideogram as DALL-E implementation pending');
    }
    
    // Map frontend visual styles to Ideogram style_type values
    const styleMapping = {
      'flat-vector': 'DESIGN',
      'watercolor': 'GENERAL', 
      'digital-painting': 'REALISTIC',
      'fantasy': 'GENERAL',
      'retro': 'DESIGN',
      'cartoon': 'GENERAL',
      'storybook': 'GENERAL',
      'photography': 'REALISTIC'
    };
    
    const ideogramStyleType = styleMapping[style] || 'AUTO';
    console.log(`Mapped style "${style}" to Ideogram style_type "${ideogramStyleType}"`);
    
    // Prepare request for ideogram generation with KDP-optimized parameters
    req.body = {
      prompt: prompt,
      model: model || 'ideogram',
      // Use correct Ideogram API parameters
      style_type: ideogramStyleType,
      aspect_ratio: '2:3', // Standard book cover ratio
      magic_prompt_option: 'AUTO',
      num_images: 1
    };
    
    // Set the path for the ideogram router to recognize
    req.originalUrl = '/api/ideogram/generate';
    req.url = '/generate';
    req.baseUrl = '/api/ideogram';
    
    // Call the ideogram router directly with the modified request
    ideogramRoutes(req, res, (err) => {
      if (err) {
        console.error('Error in ideogram router:', err);
        res.status(500).json({ error: 'Failed to generate cover' });
      }
    });
  } catch (error) {
    console.error('Error in generate-cover alias:', error);
    res.status(500).json({ error: 'Failed to generate cover' });
  }
});

console.log('Registered KDP Cover Generator route aliases:');
console.log('- POST /api/analyze-image -> Direct KDP cover analysis');
console.log('- POST /api/enhance-prompt -> /api/openai/enhance-prompt');
console.log('- POST /api/generate-cover -> /api/ideogram/generate');

// Root route for testing
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server running',
    routes: [
      '/health', 
      '/api/coloring-book/test', 
      '/api/coloring-book/create-pdf', 
      '/api/coloring-book/download-zip',
      '/api/ideogram/test',
      '/api/ideogram/generate',
      '/api/ideogram/proxy-image',
      '/api/vectorize',
      '/api/book-cover/test',
      '/api/book-cover/calculate-dimensions',
      '/api/book-cover/generate-front',
      '/api/book-cover/assemble-full',
      '/api/book-cover/download',
      '/api/openai/enhance-prompt',
      '/api/openai/extract-prompt',
      '/api/image-enhancement/test',
      '/api/word-search/generate',
      '/api/word-search/generate-words',
      '/api/word-search/status/:id',
      '/api/word-search/download/:id',
      '/api/kdp-formatter/extract',
      '/api/kdp-formatter/enhance-text',
      '/api/kdp-formatter/format-pdf'
    ]
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server startup complete! Visit / to check available routes');
}); 