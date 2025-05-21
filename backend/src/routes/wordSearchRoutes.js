/**
 * Word Search Puzzle API Routes
 * 
 * Routes for generating word search puzzles and downloadable PDFs
 */

const express = require('express');
const router = express.Router();
const wordSearchController = require('../controllers/wordSearchController');

// Generate word search puzzles
router.post('/generate', wordSearchController.generateWordSearch);

// Generate word list from a theme using AI
router.post('/generate-words', wordSearchController.generateWordsFromTheme);

// Check generation status
router.get('/status/:id', wordSearchController.checkGenerationStatus);

// Get PDF download link
router.get('/download/:id', wordSearchController.getDownloadLink);

module.exports = router; 