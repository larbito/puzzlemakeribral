const express = require('express');
const router = express.Router();
const { processFormData, vectorizeImage } = require('../controllers/vectorizerController');
const { checkRapidAPI } = require('../utils/rapidApiCheck');
const multer = require('multer');
const { removeBackground, getModels } = require('../controllers/replicateBackgroundRemovalController');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * @route POST /api/vectorize
 * @desc Vectorize an image using external API
 * @access Public
 */
router.post('/', processFormData, vectorizeImage);

/**
 * @route POST /api/vectorize/remove-background
 * @desc Remove background from an image using Replicate API
 * @access Public
 */
router.post('/remove-background', upload.single('image'), removeBackground);

/**
 * @route GET /api/vectorize/background-removal-models
 * @desc Get available background removal models
 * @access Public
 */
router.get('/background-removal-models', getModels);

/**
 * @route GET /api/vectorize/check-api
 * @desc Check if the API key is configured and valid
 * @access Public
 */
router.get('/check-api', async (req, res) => {
  try {
    // Check API key configuration
    const apiInfo = await checkRapidAPI();

    // Return status information
    return res.json({
      status: apiInfo.configured ? 'ready' : 'not_configured',
      message: apiInfo.error ? apiInfo.error.message : 'API key is valid'
    });
  } catch (error) {
    console.error('Error checking API:', error);
    return res.status(500).json({
      error: 'Failed to check API configuration',
      message: error.message
  });
  }
});

module.exports = router; 