// Vercel serverless function that handles all API routes
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import all route modules from backend
const coloringBookRoutes = require('../backend/src/routes/coloring-book');
const ideogramRoutes = require('../backend/src/routes/ideogram');
const vectorizeRoutes = require('../backend/src/routes/vectorizeRoutes');
const bookCoverRoutes = require('../backend/src/routes/book-cover');
const openaiRoutes = require('../backend/src/routes/openai');
const imageEnhancementRoutes = require('../backend/src/routes/imageEnhancement');
const wordSearchRoutes = require('../backend/src/routes/wordSearchRoutes');
const kdpFormatterRoutes = require('../backend/src/routes/kdp-formatter');

// Create Express app
const app = express();

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Expires', 'Origin', 'X-Enhanced-Image', 'x-enhanced'],
  maxAge: 86400
}));

// Handle OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Cache-Control, Pragma, Expires, Origin, X-Enhanced-Image, x-enhanced');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

// Increase payload size limit
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'vercel'
  });
});

// Register all routes
app.use('/coloring-book', coloringBookRoutes);
app.use('/ideogram', ideogramRoutes);
app.use('/vectorize', vectorizeRoutes);
app.use('/book-cover', bookCoverRoutes);
app.use('/openai', openaiRoutes);
app.use('/image-enhancement', imageEnhancementRoutes);
app.use('/word-search', wordSearchRoutes);
app.use('/kdp-formatter', kdpFormatterRoutes);

// Export for Vercel
module.exports = app; 