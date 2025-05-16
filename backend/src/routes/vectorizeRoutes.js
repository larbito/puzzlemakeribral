const express = require('express');
const router = express.Router();
const multer = require('multer');
const replicateBackgroundRemovalController = require('../controllers/replicateBackgroundRemovalController');
const imageEnhancementController = require('../controllers/imageEnhancementController');
const vectorizerController = require('../controllers/vectorizerController');

// Configure multer for memory storage (avoid writing to disk)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit 
  }
});

// Debug endpoint to test if the API is accessible
router.get('/vectorize-test', (req, res) => {
  console.log('API test endpoint called');
  res.status(200).json({
    status: 'success',
    message: 'API endpoint is accessible',
    timestamp: new Date().toISOString(),
    replicateApiConfigured: !!process.env.REPLICATE_API_TOKEN
  });
});

// Get available background removal models
router.get('/background-removal-models', replicateBackgroundRemovalController.getModels);

// Background removal endpoints (support both paths for backward compatibility)
router.post('/remove-background', upload.single('image'), replicateBackgroundRemovalController.removeBackground);
router.post('/vectorize/remove-background', upload.single('image'), replicateBackgroundRemovalController.removeBackground);

// Image enhancement endpoints (support both paths for backward compatibility)
router.post('/enhance-image', upload.single('image'), imageEnhancementController.enhanceImage);
router.post('/vectorize/enhance-image', upload.single('image'), imageEnhancementController.enhanceImage);

// Image enhancement status check endpoint
router.get('/check-enhancement-status/:predictionId', imageEnhancementController.checkEnhancementStatus);
router.get('/vectorize/check-enhancement-status/:predictionId', imageEnhancementController.checkEnhancementStatus);

// Proxy for ideogram images to avoid CORS issues
router.get('/proxy-ideogram-image', imageEnhancementController.proxyIdeogramImage);
router.get('/vectorize/proxy-ideogram-image', imageEnhancementController.proxyIdeogramImage);

// SVG vectorization endpoints
router.post('/vectorize', upload.single('image'), vectorizerController.vectorizeImage);
router.post('/vectorize/inspect', upload.single('image'), vectorizerController.inspectImage);
router.post('/vectorize/convert', upload.single('image'), vectorizerController.vectorizeImage);

// Export the router
module.exports = router; 