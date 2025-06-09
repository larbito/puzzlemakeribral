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

// Enhanced text extraction with better formatting preservation
async function extractTextFromFile(filePath, fileType) {
  try {
    switch (fileType) {
      case 'application/pdf':
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return cleanRawText(pdfData.text);
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: docxBuffer });
        return cleanRawText(result.value);
        
      case 'text/plain':
        const txtContent = fs.readFileSync(filePath, 'utf8');
        return cleanRawText(txtContent);
        
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

// Clean and normalize raw text while preserving structure
function cleanRawText(text) {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Clean up multiple empty lines (keep max 2)
    .replace(/\n{4,}/g, '\n\n\n')
    // Remove excessive whitespace but preserve intentional spacing
    .replace(/[ \t]+/g, ' ')
    // Remove trailing spaces from lines
    .replace(/[ \t]+$/gm, '')
    // Trim start and end
    .trim();
}

// AI-powered structure detection
async function detectBookStructureWithAI(text) {
  if (!openai) {
    console.log('OpenAI not available, using fallback structure detection');
    return detectBookStructureFallback(text);
  }

  try {
    const prompt = `You are a book formatting assistant. Analyze the following text and detect its structure. 
NEVER change, edit, or rewrite any content. Only identify structure.

Rules:
1. Preserve ALL original content exactly as written
2. Identify chapter breaks and titles 
3. Label sections without clear titles as "Untitled Section"
4. Return valid JSON only

Text to analyze:
${text.substring(0, 8000)}${text.length > 8000 ? '...' : ''}

Return JSON in this exact format:
{
  "title": "Book Title or 'Untitled Book'",
  "chapters": [
    {"title": "Chapter Title", "content": "exact original content", "level": 1},
    {"title": "Untitled Section", "content": "exact original content", "level": 1}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system", 
          content: "You are a formatter that NEVER changes content. You only detect structure and preserve original text exactly."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Validate and ensure we have the full content
    if (result.chapters && result.chapters.length > 0) {
      // If AI only analyzed a portion, merge with remaining content
      const analyzedLength = result.chapters.reduce((sum, ch) => sum + ch.content.length, 0);
      if (analyzedLength < text.length * 0.8) {
        console.log('AI analyzed partial content, merging with fallback');
        const fallbackResult = detectBookStructureFallback(text);
        return fallbackResult;
      }
      
      return {
        title: result.title || 'Untitled Book',
        chapters: result.chapters.map((ch, index) => ({
          id: `chapter-${index + 1}`,
          title: ch.title || `Untitled Section ${index + 1}`,
          content: ch.content,
          level: ch.level || 1
        })),
        metadata: {}
      };
    }
    
    throw new Error('Invalid AI response structure');
    
  } catch (error) {
    console.error('AI structure detection failed:', error);
    console.log('Falling back to rule-based detection');
    return detectBookStructureFallback(text);
  }
}

// Enhanced fallback structure detection
function detectBookStructureFallback(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  let title = 'Untitled Book';
  
  // Try to detect title from first line if it's short and likely a title
  if (lines.length > 0 && lines[0].length < 100 && lines[0].length > 3) {
    const firstLine = lines[0].trim();
    // Check if it looks like a title (not starting with lowercase, not a sentence)
    if (!/^[a-z]/.test(firstLine) && !firstLine.endsWith('.')) {
      title = firstLine;
    }
  }
  
  // Enhanced chapter detection patterns
  const chapterPatterns = [
    /^Chapter\s+(\d+|[IVXLCDM]+)(?:[:.]\s*|\s+)(.*)$/i,  // "Chapter 1: Title" or "Chapter I. Title"
    /^(\d+)\.\s+(.+)$/,                                   // "1. Chapter Title"
    /^#\s+(.+)$/,                                         // "# Chapter Title" (Markdown)
    /^([A-Z][A-Z\s]{2,50})$/,                            // All caps titles (3-50 chars)
    /^(CHAPTER\s+\d+)$/i,                                 // "CHAPTER 1"
    /^(Part\s+\d+)/i,                                     // "Part 1"
    /^([A-Z][^.!?]*[A-Z])$/,                             // Likely titles (start and end with caps, no sentence endings)
  ];
  
  const chapters = [];
  let currentChapter = null;
  let chapterCounter = 1;
  let contentBuffer = [];
  
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
        // Extract title from match groups
        if (match[2]) {
          chapterTitle = match[2]; // Title from second capture group
        } else if (match[1]) {
          chapterTitle = match[1]; // Title from first capture group
        } else {
          chapterTitle = line; // Use whole line
        }
        break;
      }
    }
    
    // Additional heuristics for chapter detection
    if (!isChapterTitle) {
      // Check if line is isolated and looks like a title
      const prevLineEmpty = i === 0 || !lines[i-1].trim();
      const nextLineEmpty = i === lines.length-1 || !lines[i+1].trim();
      
      if (prevLineEmpty && nextLineEmpty && line.length < 80 && line.length > 3) {
        if (!/^[a-z]/.test(line) && !line.endsWith('.') && !line.includes(',')) {
          isChapterTitle = true;
          chapterTitle = line;
        }
      }
    }
    
    if (isChapterTitle) {
      // Save previous chapter
      if (currentChapter && contentBuffer.length > 0) {
        currentChapter.content = contentBuffer.join('\n\n');
        chapters.push(currentChapter);
      }
      
      // Start new chapter
      currentChapter = {
        id: `chapter-${chapterCounter++}`,
        title: chapterTitle,
        content: '',
        level: 1
      };
      contentBuffer = [];
    } else if (currentChapter) {
      // Add content to current chapter
      contentBuffer.push(line);
    } else {
      // No chapter started yet, accumulate content for first chapter
      contentBuffer.push(line);
    }
  }
  
  // Handle remaining content
  if (currentChapter && contentBuffer.length > 0) {
    currentChapter.content = contentBuffer.join('\n\n');
    chapters.push(currentChapter);
  } else if (contentBuffer.length > 0 && chapters.length === 0) {
    // All content goes into a single chapter
    chapters.push({
      id: 'chapter-1',
      title: 'Chapter 1',
      content: contentBuffer.join('\n\n'),
      level: 1
    });
  }
  
  // Ensure we have at least one chapter
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

// Enhanced content extraction endpoint
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    
    console.log(`Processing file: ${req.file.originalname}, Type: ${fileType}, Size: ${req.file.size} bytes`);
    
    // Extract text from the file
    const extractedText = await extractTextFromFile(filePath, fileType);
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error('No readable content found in the file');
    }
    
    console.log(`Extracted ${extractedText.length} characters of text`);
    
    // Use AI-powered structure detection
    const structuredContent = await detectBookStructureWithAI(extractedText);
    
    // Add raw text to the result
    structuredContent.rawText = extractedText;
    
    console.log(`Detected ${structuredContent.chapters.length} chapters`);
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      content: structuredContent
    });
    
  } catch (error) {
    console.error('Error processing file:', error);
    
    // Clean up file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    let errorMessage = 'There was a problem processing your file.';
    
    if (error.message.includes('No readable content')) {
      errorMessage = 'The file appears to be empty or contains no readable text.';
    } else if (error.message.includes('file type')) {
      errorMessage = 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.';
    } else if (error.message.includes('size')) {
      errorMessage = 'File is too large. Please upload a file smaller than 50MB.';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// AI enhancement endpoint for content improvement
router.post('/enhance', async (req, res) => {
  try {
    const { content, enhancementType = 'structure' } = req.body;
    
    if (!openai) {
      return res.status(400).json({
        success: false,
        error: 'AI enhancement not available. OpenAI API key not configured.'
      });
    }
    
    if (!content || !content.chapters) {
      return res.status(400).json({
        success: false,
        error: 'No content provided for enhancement'
      });
    }
    
    let enhancedContent = { ...content };
    
    if (enhancementType === 'structure') {
      // Re-analyze structure with more detailed prompts
      const fullText = content.chapters.map(ch => ch.content).join('\n\n');
      enhancedContent = await detectBookStructureWithAI(fullText);
      enhancedContent.rawText = content.rawText;
    }
    
    res.json({
      success: true,
      content: enhancedContent
    });
    
  } catch (error) {
    console.error('Error enhancing content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance content'
    });
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