const express = require('express');
const router = express.Router();
const multer = require('multer');
const vectorizeController = require('../controllers/vectorizeController');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  }
});

// Debug endpoint to test if the API is accessible
router.get('/vectorize-test', (req, res) => {
  console.log('Vectorize test endpoint called');
  res.status(200).json({
    status: 'success',
    message: 'Vectorize API endpoint is accessible',
    timestamp: new Date().toISOString(),
    vectorizerApiId: process.env.VECTORIZER_API_ID || 'using default',
    // Don't expose the actual secret in the response
    vectorizerApiSecretConfigured: !!process.env.VECTORIZER_API_SECRET
  });
});

// Vectorization endpoint
router.post('/vectorize', upload.single('image'), vectorizeController.vectorizeImage);

module.exports = router; 