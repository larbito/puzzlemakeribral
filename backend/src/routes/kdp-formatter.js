const express = require('express');
const router = express.Router();
const multer = require('multer');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

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
  },
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

// Configure OpenAI API with new client
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn('OpenAI API key not configured. AI enhancement features will be disabled.');
}

// Helper function to extract text from different file types
async function extractTextFromFile(filePath, fileType) {
  try {
    switch (fileType) {
      case 'application/pdf':
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: docxBuffer });
        return result.value;
        
      case 'text/plain':
        return fs.readFileSync(filePath, 'utf8');
        
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

// Helper function to process text into chapters
function processTextIntoChapters(text) {
  // Extract title (assume first line is title if it's short enough)
  const lines = text.split('\n').filter(line => line.trim() !== '');
  let title = 'Untitled Book';
  
  if (lines.length > 0 && lines[0].length < 100) {
    title = lines[0].trim();
  }
  
  // Try to identify chapters - look for patterns like:
  // "Chapter X" or "X. Chapter Title" or lines in all caps or lines that start with #
  const chapterPatterns = [
    /^Chapter\s+\d+(?:[:.]\s*|\s+)(.+)$/i,  // "Chapter 1: Title" or "Chapter 1. Title" or "Chapter 1 Title"
    /^(\d+)\.\s+(.+)$/,                     // "1. Chapter Title"
    /^#\s+(.+)$/,                           // "# Chapter Title" (Markdown style)
    /^([A-Z\s]{3,50})$/                     // All caps titles (3-50 chars)
  ];
  
  const chapters = [];
  let currentChapter = null;
  let chapterCounter = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if this line matches any chapter pattern
    let isChapterTitle = false;
    let chapterTitle = '';
    
    for (const pattern of chapterPatterns) {
      const match = line.match(pattern);
      if (match) {
        isChapterTitle = true;
        chapterTitle = match[1] || match[0];
        break;
      }
    }
    
    // If we found a chapter title, start a new chapter
    if (isChapterTitle) {
      // Save the previous chapter if it exists
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      
      // Start a new chapter
      currentChapter = {
        id: `chapter-${chapterCounter++}`,
        title: chapterTitle,
        content: '',
        level: 1
      };
    } else if (currentChapter) {
      // Add content to the current chapter
      if (currentChapter.content) {
        currentChapter.content += '\n\n' + line;
      } else {
        currentChapter.content = line;
      }
    } else {
      // If no chapter has been started yet, create a default first chapter
      currentChapter = {
        id: `chapter-${chapterCounter++}`,
        title: 'Chapter 1',
        content: line,
        level: 1
      };
    }
  }
  
  // Add the last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }
  
  // If no chapters were found, create a single chapter with all content
  if (chapters.length === 0) {
    chapters.push({
      id: 'chapter-1',
      title: 'Chapter 1',
      content: text,
      level: 1
    });
  }
  
  return {
    title,
    chapters,
    metadata: {}
  };
}

// Parse and extract content from uploaded document
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    
    // Extract text from the file
    const extractedText = await extractTextFromFile(filePath, fileType);
    
    // Process the text into structured content
    const structuredContent = processTextIntoChapters(extractedText);
    
    // Clean up the uploaded file after processing
    fs.unlinkSync(filePath);
    
    res.json({ 
      success: true, 
      content: {
        rawText: extractedText,
        ...structuredContent
      }
    });
  } catch (error) {
    console.error('Error extracting content:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to extract content from file: ' + error.message });
  }
});

// Enhance text with AI
router.post('/enhance-text', async (req, res) => {
  try {
    const { text, enhancementType } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided for enhancement' });
    }
    
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI enhancement service is not available. Please configure the OpenAI API key to use this feature.',
        code: 'AI_SERVICE_UNAVAILABLE'
      });
    }
    
    // Create prompt based on enhancement type
    let systemPrompt = '';
    let userPrompt = text;
    
    switch (enhancementType) {
      case 'improve':
        systemPrompt = 'You are a professional editor. Improve the following text to make it more engaging, clear, and professional while maintaining the original meaning and style. Focus on enhancing readability, flow, and impact.';
        break;
      case 'simplify':
        systemPrompt = 'You are a writing coach specializing in clear communication. Simplify the following text to make it easier to understand, using simpler vocabulary and shorter sentences while preserving the meaning and important details.';
        break;
      case 'formal':
        systemPrompt = 'You are an academic writing expert. Rewrite the following text in a more formal, academic style with sophisticated vocabulary and professional tone while maintaining the original meaning and structure.';
        break;
      case 'creative':
        systemPrompt = 'You are a creative writing expert. Rewrite the following text in a more creative, descriptive, and evocative way while maintaining the original meaning and narrative flow. Add vivid imagery and engaging language.';
        break;
      case 'grammar':
        systemPrompt = 'You are a grammar and style expert. Correct any grammar, spelling, punctuation, and stylistic issues in the following text while preserving the original meaning, voice, and structure.';
        break;
      default:
        systemPrompt = 'You are a professional editor. Improve the following text while maintaining its original meaning and style.';
    }
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });
    
    const enhancedText = completion.choices[0].message.content;
    
    res.json({ 
      success: true, 
      enhancedText: enhancedText.trim(),
      originalLength: text.length,
      enhancedLength: enhancedText.length
    });
  } catch (error) {
    console.error('Error enhancing text:', error);
    
    if (error.code === 'insufficient_quota') {
      res.status(402).json({ error: 'OpenAI API quota exceeded. Please try again later.' });
    } else if (error.code === 'invalid_api_key') {
      res.status(401).json({ error: 'Invalid OpenAI API key configuration.' });
    } else {
      res.status(500).json({ error: 'Failed to enhance text with AI: ' + error.message });
    }
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