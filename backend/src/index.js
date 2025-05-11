require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const ideogramRoutes = require('./routes/ideogram');

const app = express();
const PORT = process.env.PORT || 3000;

// Debug logging for all requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    url: req.url,
    originalUrl: req.originalUrl
  });
  next();
});

// Configure CORS
const corsOptions = {
  origin: true, // Reflect the request origin
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours in seconds
  optionsSuccessStatus: 200
};

// Handle preflight requests
app.options('*', cors(corsOptions));

// Apply CORS
app.use(cors(corsOptions));

// Add custom headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Origin, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');
  next();
});

// Request logging
app.use(morgan('dev'));

// Parse JSON requests - only for non-multipart requests
app.use((req, res, next) => {
  if (!req.is('multipart/form-data')) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

// Debug log routes
console.log('Registered routes:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.path)
  }
});

// Routes
app.use('/api/ideogram', ideogramRoutes);
console.log('Ideogram routes registered at /api/ideogram');

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Puzzle Craft Forge API - Image Generation Service' });
});

// Catch-all route for debugging 404s
app.use((req, res, next) => {
  console.log('404 Not Found:', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl
  });
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Ideogram API Key configured:', !!process.env.IDEOGRAM_API_KEY);
  console.log('Server URL:', `http://0.0.0.0:${PORT}`);
}); 