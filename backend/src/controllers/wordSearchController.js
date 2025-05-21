/**
 * Word Search Puzzle Controller
 * 
 * Handles word search puzzle generation, word list generation, and PDF creation
 */

const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const { generatePuzzleBook } = require('../utils/wordSearchGenerator');
const { createWordSearchPDF } = require('../utils/pdfGenerator');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store generation jobs
const generationJobs = {};

/**
 * Generate word search puzzles and create PDF
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateWordSearch = async (req, res) => {
  try {
    console.log('📝 Received word search generation request:', JSON.stringify(req.body, null, 2));
    
    const {
      title,
      subtitle,
      authorName,
      pageSize,
      bleed,
      includePageNumbers,
      interiorTheme,
      fontFamily,
      puzzlesPerPage,
      theme,
      difficulty,
      quantity,
      gridSize,
      wordsPerPuzzle,
      directions,
      includeAnswers,
      includeThemeFacts,
      includeCoverPage,
      customWords,
      aiPrompt
    } = req.body;
    
    // Create a job ID
    const jobId = uuidv4();
    console.log(`🆔 Created job ID: ${jobId}`);
    
    // Store job with initial status
    generationJobs[jobId] = {
      status: 'pending',
      progress: 0,
      downloadUrl: null,
      createdAt: new Date()
    };
    
    // Return job ID immediately
    res.status(202).json({
      jobId,
      message: 'Word search generation started'
    });
    console.log(`✅ Responded with job ID: ${jobId}`);
    
    // Process generation in background
    (async () => {
      try {
        // Update status to generating
        generationJobs[jobId].status = 'generating';
        generationJobs[jobId].progress = 10;
        
        // Generate words from theme using AI if needed
        let words = [];
        if (theme && aiPrompt) {
          try {
            words = await generateWordsFromAI(theme, wordsPerPuzzle, aiPrompt);
            generationJobs[jobId].progress = 30;
          } catch (error) {
            console.error('Error generating words from AI:', error);
            // If AI fails, continue with custom words or empty array
          }
        }
        
        // Process custom words if provided
        if (customWords) {
          const customWordList = customWords
            .split(',')
            .map(word => word.trim())
            .filter(word => word.length > 0);
          
          words = [...words, ...customWordList];
        }
        
        // Generate puzzles
        generationJobs[jobId].progress = 40;
        const puzzles = generatePuzzleBook({
          quantity,
          theme,
          words,
          customWords,
          gridSize,
          wordsPerPuzzle,
          directions,
          difficulty
        });
        
        generationJobs[jobId].progress = 70;
        
        // Create PDF
        const pdfPath = await createWordSearchPDF(
          {
            title,
            subtitle,
            authorName,
            pageSize,
            bleed,
            includeCoverPage,
            includePageNumbers,
            includeAnswers,
            includeThemeFacts,
            interiorTheme,
            fontFamily,
            puzzlesPerPage,
            theme
          },
          puzzles
        );
        
        // Update job status to complete
        generationJobs[jobId].status = 'completed';
        generationJobs[jobId].progress = 100;
        generationJobs[jobId].downloadUrl = pdfPath;
        
      } catch (error) {
        console.error('Error generating word search:', error);
        generationJobs[jobId].status = 'failed';
        generationJobs[jobId].error = error.message;
      }
    })();
    
  } catch (error) {
    console.error('Error initiating word search generation:', error);
    res.status(500).json({
      error: 'Failed to start word search generation',
      details: error.message
    });
  }
};

/**
 * Generate words from a theme using OpenAI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateWordsFromTheme = async (req, res) => {
  try {
    const { theme, count = 20, prompt = '' } = req.body;
    
    if (!theme) {
      return res.status(400).json({
        error: 'Theme is required'
      });
    }
    
    const words = await generateWordsFromAI(theme, count, prompt);
    
    res.status(200).json({
      words
    });
    
  } catch (error) {
    console.error('Error generating words from theme:', error);
    res.status(500).json({
      error: 'Failed to generate words',
      details: error.message
    });
  }
};

/**
 * Check status of a generation job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkGenerationStatus = (req, res) => {
  const { id } = req.params;
  
  if (!generationJobs[id]) {
    return res.status(404).json({
      error: 'Job not found'
    });
  }
  
  // Clean up completed jobs after 1 hour
  const ONE_HOUR = 60 * 60 * 1000;
  const job = generationJobs[id];
  if (job.status === 'completed' && 
      (new Date() - new Date(job.createdAt)) > ONE_HOUR) {
    delete generationJobs[id];
    return res.status(410).json({
      error: 'Job expired'
    });
  }
  
  res.status(200).json({
    jobId: id,
    status: job.status,
    progress: job.progress,
    downloadUrl: job.downloadUrl,
    error: job.error
  });
};

/**
 * Get download link for a completed job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDownloadLink = (req, res) => {
  const { id } = req.params;
  
  if (!generationJobs[id]) {
    return res.status(404).json({
      error: 'Job not found'
    });
  }
  
  const job = generationJobs[id];
  
  if (job.status !== 'completed') {
    return res.status(400).json({
      error: 'Job not completed yet'
    });
  }
  
  if (!job.downloadUrl) {
    return res.status(500).json({
      error: 'Download URL not available'
    });
  }
  
  res.status(200).json({
    downloadUrl: job.downloadUrl
  });
};

/**
 * Generate words from a theme using OpenAI
 * @param {string} theme - The theme for word generation
 * @param {number} count - Number of words to generate
 * @param {string} customPrompt - Custom prompt for the AI
 * @returns {Promise<string[]>} Array of generated words
 */
async function generateWordsFromAI(theme, count = 20, customPrompt = '') {
  try {
    // Default prompt
    let prompt = `Generate ${count} unique, kid-friendly words related to the theme "${theme}" for a word search puzzle.
- Each word should be a single word (no spaces or hyphens)
- All words should be related to the theme
- Words should be appropriate for all ages
- Words should vary in length but not exceed 15 characters
- Return only the words as a comma-separated list`;
    
    // Use custom prompt if provided
    if (customPrompt) {
      prompt = `${customPrompt}

Theme: ${theme}
Number of words: ${count}

Return only the words as a comma-separated list.`;
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates themed word lists for word search puzzles.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const content = response.choices[0].message.content.trim();
    
    // Clean and parse the response
    const words = content
      .split(',')
      .map(word => word.trim().toUpperCase())
      .filter(word => 
        word.length > 0 && 
        word.length <= 15 && 
        /^[A-Z]+$/.test(word)
      );
    
    // Filter to unique words and limit to requested count
    return [...new Set(words)].slice(0, count);
    
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to generate words from AI');
  }
}

// Clean up old jobs periodically
setInterval(() => {
  const now = new Date();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  Object.keys(generationJobs).forEach(jobId => {
    const job = generationJobs[jobId];
    const createdAt = new Date(job.createdAt);
    
    if (now - createdAt > ONE_DAY) {
      delete generationJobs[jobId];
    }
  });
}, 60 * 60 * 1000); // Run every hour 