require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

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

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to allow requests from any origin
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Expires', 'Origin'],
  maxAge: 86400 // Cache preflight request results for 24 hours (86400 seconds)
}));

// Add explicit CORS handler for OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Cache-Control, Pragma, Expires, Origin');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

// Serve static files from the 'static' directory
const staticDir = path.join(__dirname, '..', 'static');
console.log(`Serving static files from: ${staticDir}`);
app.use('/static', express.static(staticDir));

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
      '/api/image-enhancement/test'
    ]
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server startup complete! Visit / to check available routes');
}); 