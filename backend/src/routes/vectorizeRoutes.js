const express = require('express');
const router = express.Router();
const { processFormData, vectorizeImage } = require('../controllers/vectorizerController');
const { checkInkscape, checkCommandFormat } = require('../utils/inkscapeCheck');

/**
 * @route POST /api/vectorize
 * @desc Vectorize an image using Inkscape
 * @access Public
 */
router.post('/', processFormData, vectorizeImage);

/**
 * @route GET /api/vectorize/check-inkscape
 * @desc Check if Inkscape is installed and which command format is supported
 * @access Public
 */
router.get('/check-inkscape', async (req, res) => {
  try {
    // Check Inkscape installation
    const inkscapeInfo = await checkInkscape();
    
    // If installed, check command format
    let formatInfo = { modern: false, legacy: false };
    if (inkscapeInfo.installed) {
      formatInfo = await checkCommandFormat();
    }
    
    // Return combined information
    return res.json({
      inkscape: inkscapeInfo,
      commandFormat: formatInfo,
      status: inkscapeInfo.installed ? 'ready' : 'not_installed'
    });
  } catch (error) {
    console.error('Error checking Inkscape:', error);
    return res.status(500).json({
      error: 'Failed to check Inkscape installation',
      message: error.message
    });
  }
});

module.exports = router; 