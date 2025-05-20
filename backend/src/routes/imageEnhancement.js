const express = require('express');
const router = express.Router();
const multer = require('multer');
const { enhanceImage, checkEnhancementStatus, getAvailableModels } = require('../controllers/imageEnhancementController');

// Configure multer for memory storage (avoid writing to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

/**
 * Get available enhancement models
 * GET /api/image-enhancement/models
 */
router.get('/models', async (req, res) => {
  return await getAvailableModels(req, res);
});

/**
 * Enhance image quality using selected upscaler model
 * POST /api/image-enhancement/enhance
 * Body:
 *   - image: File upload
 *   - model: Model ID (optional, defaults to text-upscaler)
 *   - scale: Upscale factor (optional, defaults to 4)
 */
router.post('/enhance', upload.single('image'), async (req, res) => {
  return await enhanceImage(req, res);
});

/**
 * Check status of an enhancement job
 * GET /api/image-enhancement/status/:predictionId
 */
router.get('/status/:predictionId', async (req, res) => {
  return await checkEnhancementStatus(req, res);
});

module.exports = router; 