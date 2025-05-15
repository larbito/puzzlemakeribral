const express = require('express');
const router = express.Router();
const multer = require('multer');
const replicateBackgroundRemovalController = require('../controllers/replicateBackgroundRemovalController');

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

// Background removal endpoints (support both paths for backward compatibility)
router.post('/remove-background', upload.single('image'), replicateBackgroundRemovalController.removeBackground);
router.post('/vectorize/remove-background', upload.single('image'), replicateBackgroundRemovalController.removeBackground);

// SVG vectorization endpoint (placeholder for future implementation)
router.post('/vectorize', (req, res) => {
  return res.status(501).json({
    error: 'SVG vectorization not implemented yet',
    message: 'This feature will be available in a future update'
  });
});

// Export the router
module.exports = router; 