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

// Vectorization endpoint
router.post('/vectorize', upload.single('image'), vectorizeController.vectorizeImage);

module.exports = router; 