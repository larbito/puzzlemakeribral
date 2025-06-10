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

// AI-powered structure detection with comprehensive book understanding
async function detectBookStructureWithAI(text) {
  if (!openai) {
    console.log('OpenAI not available, using fallback structure detection');
    return detectBookStructureFallback(text);
  }

  try {
    console.log(`Starting comprehensive book analysis for ${text.length} characters`);
    
    // OPTIMIZATION: Limit text size for AI analysis to reduce token usage
    const maxAnalysisLength = 50000; // 50K characters max for AI analysis
    const analysisText = text.length > maxAnalysisLength 
      ? text.substring(0, maxAnalysisLength) + '\n\n[Content truncated for analysis...]'
      : text;
    
    console.log(`Using ${analysisText.length} characters for AI analysis (${text.length > maxAnalysisLength ? 'truncated' : 'full'})`);
    
    // PHASE 1: Comprehensive Book Understanding (OPTIMIZED)
    const bookUnderstandingPrompt = `You are a professional book analyst. Analyze this book sample to understand its structure and type.

BOOK CONTENT SAMPLE:
${analysisText}

ANALYSIS INSTRUCTIONS:
1. Identify the book type (novel, textbook, workbook, manual, etc.)
2. Determine primary purpose and target audience
3. Note any special elements (questions, exercises, tables, etc.)
4. Understand content organization

Return CONCISE JSON:
{
  "bookType": "specific type",
  "primaryPurpose": "main purpose", 
  "targetAudience": "audience",
  "complexity": "Simple/Moderate/Complex",
  "interactiveElements": ["list if found"],
  "mainOrganization": "chapters/lessons/units/etc",
  "hasQuestions": true/false,
  "hasExercises": true/false,
  "estimatedSections": "rough count",
  "title": "book title",
  "author": "author name"
}`;

    console.log('Phase 1: Quick book analysis...');
    const understandingResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use cheaper model for analysis
      messages: [
        { 
          role: "system", 
          content: "You are a book analyst. Analyze quickly and return concise JSON only."
        },
        { role: "user", content: bookUnderstandingPrompt }
      ],
      temperature: 0,
      max_tokens: 800 // Reduced tokens
    });

    let bookUnderstanding = {};
    try {
      const understandingText = understandingResponse.choices[0].message.content.trim();
      const cleanedUnderstanding = understandingText.replace(/```json\n?|```\n?/g, '').trim();
      bookUnderstanding = JSON.parse(cleanedUnderstanding);
      console.log('Book understanding complete:', bookUnderstanding.bookType);
    } catch (e) {
      console.log('Failed to parse book understanding, using fallback:', e.message);
      return detectBookStructureFallback(text);
    }

    // PHASE 2: Smart Content Extraction (OPTIMIZED)
    // Only do detailed extraction for smaller books or if quota allows
    if (text.length > 100000) {
      console.log('Large book detected, using hybrid approach...');
      return await hybridAnalysis(text, bookUnderstanding);
    }

    const contentExtractionPrompt = `Based on understanding that this is a ${bookUnderstanding.bookType}, extract key sections:

BOOK CONTENT:
${analysisText}

Extract main sections and any special elements:
{
  "sections": [
    {
      "title": "section title", 
      "type": "chapter/lesson/exercise/etc",
      "hasQuestions": true/false,
      "hasExercises": true/false
    }
  ],
  "needsQuestionFormatting": true/false,
  "needsExerciseSpacing": true/false
}`;

    console.log('Phase 2: Content extraction...');
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `Extract sections from a ${bookUnderstanding.bookType}. Return JSON only.`
        },
        { role: "user", content: contentExtractionPrompt }
      ],
      temperature: 0,
      max_tokens: 1500
    });

    let contentAnalysis = {};
    try {
      const extractionText = extractionResponse.choices[0].message.content.trim();
      const cleanedExtraction = extractionText.replace(/```json\n?|```\n?/g, '').trim();
      contentAnalysis = JSON.parse(cleanedExtraction);
      console.log(`Content extraction complete: Found ${contentAnalysis.sections?.length || 0} sections`);
    } catch (e) {
      console.error('Failed to parse content extraction:', e.message);
      return await hybridAnalysis(text, bookUnderstanding);
    }

    // Convert to our format
    const allSections = [];
    
    if (contentAnalysis.sections) {
      contentAnalysis.sections.forEach((section, index) => {
        allSections.push({
          id: `section-${index + 1}`,
          title: section.title || `${section.type} ${index + 1}`,
          content: extractSectionContent(text, section.title, index),
          level: 1,
          type: section.type || 'chapter',
          hasQuestions: section.hasQuestions || false,
          hasExercises: section.hasExercises || false
        });
      });
    }

    // If no sections found, use fallback
    if (allSections.length === 0) {
      console.log('No sections found in AI analysis, using fallback');
      return detectBookStructureFallback(text);
    }

    console.log(`Optimized AI analysis complete: ${allSections.length} sections found`);
    
    return {
      title: bookUnderstanding.title || 'Untitled Book',
      chapters: allSections,
      metadata: {
        author: bookUnderstanding.author || '',
        bookType: bookUnderstanding.bookType,
        primaryPurpose: bookUnderstanding.primaryPurpose,
        targetAudience: bookUnderstanding.targetAudience,
        interactiveElements: bookUnderstanding.interactiveElements || [],
        totalSections: allSections.length,
        analysisMethod: 'optimized-ai'
      },
      bookAnalysis: {
        genre: bookUnderstanding.bookType,
        complexity: bookUnderstanding.complexity,
        hasInteractiveElements: bookUnderstanding.hasQuestions || bookUnderstanding.hasExercises
      },
      formatRequirements: {
        needsQuestionFormatting: contentAnalysis.needsQuestionFormatting || false,
        needsExerciseSpacing: contentAnalysis.needsExerciseSpacing || false
      }
    };
    
  } catch (error) {
    console.error('Optimized AI analysis failed:', error.message);
    
    // Check if it's a quota error
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log('API quota exceeded, using enhanced fallback');
      return detectBookStructureFallback(text);
    }
    
    console.log('Using fallback detection');
    return detectBookStructureFallback(text);
  }
}

// Hybrid analysis for large books
async function hybridAnalysis(text, bookUnderstanding) {
  console.log('Using hybrid analysis for large book...');
  
  // Use fallback detection for structure, but enhance with AI understanding
  const fallbackResult = detectBookStructureFallback(text);
  
  // Enhance with AI-provided metadata
  return {
    ...fallbackResult,
    metadata: {
      ...fallbackResult.metadata,
      bookType: bookUnderstanding.bookType,
      primaryPurpose: bookUnderstanding.primaryPurpose,
      targetAudience: bookUnderstanding.targetAudience,
      analysisMethod: 'hybrid'
    },
    bookAnalysis: {
      genre: bookUnderstanding.bookType,
      complexity: bookUnderstanding.complexity,
      hasInteractiveElements: bookUnderstanding.hasQuestions || bookUnderstanding.hasExercises
    }
  };
}

// Extract section content from full text
function extractSectionContent(fullText, sectionTitle, sectionIndex) {
  // Simple extraction - split text into roughly equal parts
  const lines = fullText.split('\n');
  const sectionSize = Math.floor(lines.length / 5); // Assume max 5 sections
  const startIndex = sectionIndex * sectionSize;
  const endIndex = Math.min(startIndex + sectionSize, lines.length);
  
  return lines.slice(startIndex, endIndex).join('\n').trim() || 'Content extracted...';
}

// Enhanced fallback structure detection with better chapter naming
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
  
  // Much more conservative chapter detection patterns - only detect CLEAR chapter markers
  const chapterPatterns = [
    { pattern: /^Chapter\s+(\d+|[IVXLCDM]+)(?:[:.]\s*|\s+)(.*)$/i, priority: 1, requiresFollowingContent: true },  // "Chapter 1: Title"
    { pattern: /^(\d+)\.\s+(.{10,})$/, priority: 2, requiresFollowingContent: true },                             // "1. Chapter Title" (at least 10 chars)
    { pattern: /^#{1,3}\s+(.{5,})$/, priority: 3, requiresFollowingContent: true },                               // "# Chapter Title" (Markdown, at least 5 chars)
    { pattern: /^CHAPTER\s+(\d+|[IVXLCDM]+)(?:\s*[:.]\s*(.*))?$/i, priority: 4, requiresFollowingContent: true }, // "CHAPTER 1" or "CHAPTER 1: Title"
    { pattern: /^Part\s+(\d+|[IVXLCDM]+)(?:\s*[:.]\s*(.*))?$/i, priority: 5, requiresFollowingContent: true },    // "Part 1" or "Part 1: Title"
  ];
  
  const chapters = [];
  let currentChapter = null;
  let chapterCounter = 1;
  let contentBuffer = [];
  let actualChapterCount = 0;
  
  // Keep track of titles we've already used to avoid repetition
  const usedTitles = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if this line matches any chapter pattern
    let isChapterTitle = false;
    let chapterTitle = '';
    let matchedPattern = null;
    
    // Sort patterns by priority and find the best match
    const sortedPatterns = chapterPatterns.sort((a, b) => a.priority - b.priority);
    
    for (const { pattern, priority, requiresFollowingContent } of sortedPatterns) {
      const match = line.match(pattern);
      if (match) {
        // If this pattern requires following content, check that there's substantial content after
        if (requiresFollowingContent) {
          const nextLines = lines.slice(i + 1, i + 5).join(' ').trim();
          if (nextLines.length < 50) continue; // Not enough content after this "chapter"
        }
        
        isChapterTitle = true;
        matchedPattern = pattern;
        actualChapterCount++;
        
        // Extract title from match groups
        if (match[2] && match[2].trim()) {
          chapterTitle = match[2].trim();
        } else if (match[1] && match[1].trim()) {
          chapterTitle = match[1].trim();
        } else {
          chapterTitle = `Chapter ${actualChapterCount}`;
        }
        break;
      }
    }
    
    // More conservative heuristic detection - only for very clear cases
    if (!isChapterTitle && actualChapterCount === 0) { // Only try this if we haven't found any chapters yet
      // Check if line is isolated and looks like a very clear title
      const prevLineEmpty = i === 0 || !lines[i-1]?.trim();
      const nextLineEmpty = i === lines.length-1 || !lines[i+1]?.trim();
      const nextLinesContent = lines.slice(i + 1, i + 10).join(' ').trim();
      
      if (prevLineEmpty && nextLineEmpty && 
          line.length < 80 && line.length > 10 && 
          nextLinesContent.length > 200) { // Must have substantial content following
        
        // Very strict criteria for title detection
        const isAllCaps = line === line.toUpperCase() && line.includes(' ');
        const hasNoSentenceEnding = !line.endsWith('.') && !line.endsWith('!') && !line.endsWith('?');
        const hasNoCommonWords = !line.toLowerCase().includes('the ') && 
                                 !line.toLowerCase().includes('and ') &&
                                 !line.toLowerCase().includes(' of ') &&
                                 !line.toLowerCase().includes(' in ');
        const isNotPartOfSentence = !/\b(said|says|told|asked|replied|continued|began|started)\b/i.test(line);
        
        if (isAllCaps && hasNoSentenceEnding && hasNoCommonWords && isNotPartOfSentence) {
          isChapterTitle = true;
          chapterTitle = line;
          actualChapterCount++;
        }
      }
    }
    
    // Very strict check for repetitive titles - avoid creating chapters with repeated titles
    if (isChapterTitle && chapterTitle) {
      if (usedTitles.has(chapterTitle.toLowerCase()) || 
          chapterTitle.length < 3) {
        isChapterTitle = false; // Don't create a chapter for repeated/generic titles
      } else {
        usedTitles.add(chapterTitle.toLowerCase());
      }
    }
    
    if (isChapterTitle && chapterTitle) {
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
    // No chapters detected - treat entire content as one chapter
    // Extract a meaningful title from the beginning of the content
    const contentStart = contentBuffer.slice(0, 20).join(' ');
    const firstSentence = contentStart.split(/[.!?]/)[0]?.trim();
    let detectedTitle = 'Chapter 1';
    
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 60) {
      detectedTitle = firstSentence.split(' ').slice(0, 6).join(' ');
      if (detectedTitle.length > 50) {
        detectedTitle = detectedTitle.substring(0, 47) + '...';
      }
    }
    
    chapters.push({
      id: 'chapter-1',
      title: detectedTitle,
      content: contentBuffer.join('\n\n'),
      level: 1
    });
  }
  
  // If we still have no chapters, create a single chapter
  if (chapters.length === 0) {
    chapters.push({
      id: 'chapter-1',
      title: 'Complete Text',
      content: text,
      level: 1
    });
  }
  
  // Post-process: merge very short chapters (likely false positives)
  const processedChapters = mergeShortChapters(chapters);
  
  console.log(`Detected ${processedChapters.length} chapters from ${lines.length} lines`);
  
  return {
    title,
    chapters: processedChapters,
    metadata: {}
  };
}

// Merge chapters that are too short (likely false detections)
function mergeShortChapters(chapters) {
  if (chapters.length <= 1) return chapters;
  
  const processed = [];
  
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    
    // If this chapter is very short (less than 500 characters), merge it
    if (chapter.content.length < 500 && processed.length > 0) {
      const prevChapter = processed[processed.length - 1];
      prevChapter.content += '\n\n' + chapter.content;
      console.log(`Merged short chapter "${chapter.title}" with previous chapter`);
    } else {
      processed.push(chapter);
    }
  }
  
  return processed;
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