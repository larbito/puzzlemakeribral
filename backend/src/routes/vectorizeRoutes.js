const express = require('express');
const router = express.Router();
const multer = require('multer');
const vectorizeController = require('../controllers/vectorizeController');
const localVectorizeController = require('../controllers/localVectorizeController');
const replicateVectorizeController = require('../controllers/replicateVectorizeController');

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
    vectorizerApiSecretConfigured: !!process.env.VECTORIZER_API_SECRET,
    replicateApiConfigured: !!process.env.REPLICATE_API_TOKEN
  });
});

// API-based vectorization endpoint (uses external Vectorizer.AI API)
router.post('/vectorize', upload.single('image'), vectorizeController.vectorizeImage);

// Local vectorization endpoint (uses Potrace library locally - no API costs)
router.post('/vectorize-local', upload.single('image'), localVectorizeController.vectorizeImage);

// Replicate API-based vectorization endpoint (high quality but has API costs)
router.post('/vectorize-replicate', upload.single('image'), replicateVectorizeController.vectorizeImage);

module.exports = router; 