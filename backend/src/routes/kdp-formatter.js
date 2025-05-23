const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/kdp-formatter');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  }
});

// Configure OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Parse and extract content from uploaded document
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    
    // This is a placeholder - in a real implementation, you would use 
    // appropriate libraries to extract text based on file type
    // For example: pdf.js for PDFs, mammoth for DOCX, etc.
    
    // Mock response for MVP
    const mockContent = {
      title: 'Sample Book',
      chapters: [
        {
          id: '1',
          title: 'Chapter 1: Introduction',
          content: 'This is the introduction to the book. It contains important information about what the reader will learn.',
          level: 1
        },
        {
          id: '2',
          title: 'Chapter 2: Main Content',
          content: 'This chapter contains the main content of the book. It is divided into several sections that explore different aspects of the topic.',
          level: 1
        },
        {
          id: '3',
          title: 'Chapter 3: Conclusion',
          content: 'This chapter summarizes the key points presented in the book and offers some final thoughts on the subject.',
          level: 1
        }
      ],
      metadata: {
        author: 'Sample Author',
        publisher: 'Sample Publisher',
        year: '2023'
      }
    };
    
    // Clean up the uploaded file after processing
    fs.unlinkSync(filePath);
    
    res.json({ success: true, content: mockContent });
  } catch (error) {
    console.error('Error extracting content:', error);
    res.status(500).json({ error: 'Failed to extract content from file' });
  }
});

// Enhance text with AI
router.post('/enhance-text', async (req, res) => {
  try {
    const { prompt, enhancementType } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'No text provided for enhancement' });
    }
    
    // In a real implementation, send to OpenAI API
    // For MVP, we'll return a mock response
    
    // Mock response
    const mockResponse = {
      enhancedText: `This is an AI-enhanced version of your text using the "${enhancementType}" style.
      
      Your original text has been improved with better grammar, more engaging language, and clearer structure. The AI has maintained your original meaning while making it more compelling to read.
      
      This example shows how the text would be formatted with proper paragraphs and spacing. In a real implementation, the OpenAI API would process your text and return an enhanced version based on the selected enhancement type.`
    };
    
    // Add simulated delay for UX
    setTimeout(() => {
      res.json(mockResponse);
    }, 1500);
  } catch (error) {
    console.error('Error enhancing text:', error);
    res.status(500).json({ error: 'Failed to enhance text with AI' });
  }
});

// Format PDF (most of this would be handled client-side)
router.post('/format-pdf', async (req, res) => {
  try {
    const { settings, content } = req.body;
    
    // This endpoint would be used for server-side PDF generation if needed
    // For MVP, we'll return success since PDF generation happens client-side
    
    res.json({ success: true, message: 'PDF formatting options received' });
  } catch (error) {
    console.error('Error formatting PDF:', error);
    res.status(500).json({ error: 'Failed to format PDF' });
  }
});

module.exports = router; 