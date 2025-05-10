require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const ideogramRoutes = require('./routes/ideogram');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://puzzle-craft-forge.vercel.app',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/ideogram', ideogramRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Puzzle Craft Forge API - Image Generation Service' });
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
}); 