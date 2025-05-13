require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const ideogramRoutes = require('./routes/ideogram');
const bookCoverRoutes = require('./routes/book-cover');
const coloringBookRoutes = require('./routes/coloring-book');

const app = express();
const PORT = process.env.PORT || 3000;

// CRITICAL: Health check endpoint for Railway
// This MUST be defined before any other middleware to ensure it's always accessible
app.get('/health', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Health check request received from ${req.ip}`);
  
  // Log headers for debugging
  console.log('Request headers:', req.headers);
  
  // Include detailed environment information
  const healthData = {
    status: 'healthy',
    timestamp: timestamp,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 3000,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    pid: process.pid
  };
  
  console.log('Responding with health data:', healthData);
  
  // Send a 200 OK response
  res.status(200).json(healthData);
});

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
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://puzzlemakeribral.vercel.app',
      'https://puzzle-craft-forge.vercel.app',
      'http://localhost:5177',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
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
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
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

app.use('/api/book-cover', bookCoverRoutes);
console.log('Book cover routes registered at /api/book-cover');

app.use('/api/coloring-book', coloringBookRoutes);
console.log('Coloring book routes registered at /api/coloring-book');

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

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Keep the process running
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the process running
});

// Start server
const serverPort = process.env.PORT || 3000;
app.listen(serverPort, '0.0.0.0', () => {
  console.log(`Server running on port ${serverPort}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Ideogram API Key configured:', !!process.env.IDEOGRAM_API_KEY);
  console.log('Server URL:', `http://0.0.0.0:${serverPort}`);
  console.log('Health check path available at: /health');
}); 