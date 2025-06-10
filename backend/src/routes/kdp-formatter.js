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
    
    // PHASE 1: Comprehensive Book Understanding
    const bookUnderstandingPrompt = `You are a professional book analyst and editor. Your job is to completely understand this book before formatting it.

COMPLETE BOOK CONTENT:
${text}

COMPREHENSIVE ANALYSIS INSTRUCTIONS:
1. READ THE ENTIRE BOOK CAREFULLY
2. Understand what TYPE of book this is
3. Identify ALL structural elements present
4. Understand the book's purpose and audience
5. Note any special formatting requirements

Analyze and categorize this book completely:

BOOK TYPE IDENTIFICATION:
- Is this a novel, textbook, workbook, manual, poetry, children's book, academic text, etc.?
- What is the primary purpose? (entertainment, education, reference, practice, etc.)

STRUCTURAL ELEMENTS ANALYSIS:
- Title page elements (title, subtitle, author, publisher, etc.)
- Table of Contents (if present)
- Foreword, Preface, Introduction
- Main content organization (chapters, units, sections, lessons, stories, etc.)
- Special elements (questions, quizzes, exercises, diagrams, tables, etc.)
- Appendices, glossary, index, bibliography
- Any unique formatting patterns

CONTENT CHARACTERISTICS:
- Writing style and tone
- Target audience level
- Complexity of content
- Interactive elements present
- Visual elements mentioned
- Educational components

Return this EXACT JSON structure:
{
  "bookUnderstanding": {
    "bookType": "specific type (novel, textbook, workbook, manual, etc.)",
    "primaryPurpose": "main purpose of this book",
    "targetAudience": "who this book is for",
    "contentStyle": "writing style and approach",
    "complexity": "content complexity level",
    "interactiveElements": ["list of interactive elements found"],
    "specialFeatures": ["unique aspects of this book"]
  },
  "structuralAnalysis": {
    "hasTableOfContents": true/false,
    "mainOrganization": "how content is organized (chapters, lessons, units, etc.)",
    "totalSections": "number of main sections",
    "specialSections": ["list of special sections like appendix, glossary, etc."],
    "questionSections": ["locations of questions/quizzes/exercises"],
    "visualElements": ["tables, diagrams, charts mentioned"],
    "formatRequirements": ["special formatting needs identified"]
  },
  "extractedMetadata": {
    "title": "exact book title",
    "subtitle": "subtitle if present",
    "author": "author name",
    "publisher": "publisher if mentioned",
    "year": "publication year if mentioned",
    "isbn": "ISBN if present",
    "dedication": "dedication text if present",
    "copyright": "copyright info if present"
  }
}`;

    console.log('Phase 1: Analyzing book comprehensively...');
    const understandingResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are an expert book analyst. Read and understand the COMPLETE book before analyzing. Return valid JSON only."
        },
        { role: "user", content: bookUnderstandingPrompt }
      ],
      temperature: 0,
      max_tokens: 2000
    });

    let bookUnderstanding = {};
    try {
      const understandingText = understandingResponse.choices[0].message.content.trim();
      const cleanedUnderstanding = understandingText.replace(/```json\n?|```\n?/g, '').trim();
      bookUnderstanding = JSON.parse(cleanedUnderstanding);
      console.log('Book understanding complete:', bookUnderstanding.bookUnderstanding?.bookType);
    } catch (e) {
      console.log('Failed to parse book understanding:', e.message);
      bookUnderstanding = {
        bookUnderstanding: { bookType: "Unknown", primaryPurpose: "Unknown" },
        structuralAnalysis: { mainOrganization: "chapters", totalSections: "unknown" },
        extractedMetadata: { title: "Untitled Book", author: "Unknown Author" }
      };
    }

    // PHASE 2: Detailed Content Extraction Based on Understanding
    const contentExtractionPrompt = `Based on your understanding, this is a ${bookUnderstanding.bookUnderstanding?.bookType} with ${bookUnderstanding.structuralAnalysis?.mainOrganization} organization.

COMPLETE BOOK CONTENT:
${text}

DETAILED EXTRACTION INSTRUCTIONS:
Now extract ALL content sections based on what you understand about this book:

1. Find ALL main sections (${bookUnderstanding.structuralAnalysis?.mainOrganization})
2. Extract ANY questions, quizzes, or exercises found
3. Identify special formatting sections
4. Preserve exact titles and content as written
5. Note any tables, lists, or special formatting needed
6. Include ALL content - don't skip anything

SPECIFIC EXTRACTION RULES:
- For textbooks: Find chapters, lessons, exercises, review questions
- For workbooks: Find activities, worksheets, answer keys
- For novels: Find chapters, parts, sections
- For manuals: Find procedures, steps, troubleshooting sections
- For academic texts: Find chapters, case studies, references
- For children's books: Find stories, activities, illustrations mentioned

Return this EXACT JSON structure:
{
  "contentSections": [
    {
      "sectionNumber": 1,
      "sectionType": "chapter/lesson/unit/story/activity/etc",
      "title": "exact title as it appears",
      "content": "complete content including all text, questions, exercises",
      "specialElements": ["questions", "tables", "exercises", "etc"],
      "formattingNotes": "any special formatting requirements",
      "wordCount": "approximate word count"
    }
  ],
  "specialSections": [
    {
      "type": "table_of_contents/glossary/appendix/answer_key/etc",
      "title": "section title",
      "content": "complete content",
      "location": "beginning/middle/end"
    }
  ],
  "formatRequirements": {
    "needsQuestionFormatting": true/false,
    "needsTableFormatting": true/false,
    "needsExerciseSpacing": true/false,
    "needsAnswerKeySection": true/false,
    "specialLayoutNeeds": ["list any special layout requirements"]
  }
}`;

    console.log('Phase 2: Extracting all content sections...');
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: `You are extracting content from a ${bookUnderstanding.bookUnderstanding?.bookType}. Extract ALL sections and preserve ALL content including questions, exercises, and special elements. Return valid JSON only.`
        },
        { role: "user", content: contentExtractionPrompt }
      ],
      temperature: 0,
      max_tokens: 8000
    });

    let contentAnalysis = {};
    try {
      const extractionText = extractionResponse.choices[0].message.content.trim();
      const cleanedExtraction = extractionText.replace(/```json\n?|```\n?/g, '').trim();
      contentAnalysis = JSON.parse(cleanedExtraction);
      console.log(`Content extraction complete: Found ${contentAnalysis.contentSections?.length || 0} sections`);
    } catch (e) {
      console.error('Failed to parse content extraction:', e.message);
      
      // Fallback to chunk analysis
      console.log('Using fallback chunk analysis...');
      return await analyzeInChunks(text, bookUnderstanding.extractedMetadata || {});
    }

    // PHASE 3: Convert to our format with proper understanding
    const allSections = [];
    
    // Add main content sections
    if (contentAnalysis.contentSections) {
      contentAnalysis.contentSections.forEach((section, index) => {
        allSections.push({
          id: `section-${index + 1}`,
          title: section.title || `${section.sectionType} ${index + 1}`,
          content: section.content,
          level: 1,
          type: section.sectionType || 'chapter',
          specialElements: section.specialElements || [],
          formattingNotes: section.formattingNotes || '',
          wordCount: section.wordCount
        });
      });
    }

    // Add special sections
    if (contentAnalysis.specialSections) {
      contentAnalysis.specialSections.forEach((section, index) => {
        allSections.push({
          id: `special-${index + 1}`,
          title: section.title,
          content: section.content,
          level: 1,
          type: section.type,
          location: section.location
        });
      });
    }

    console.log(`Comprehensive analysis complete: ${allSections.length} total sections found`);
    
    return {
      title: bookUnderstanding.extractedMetadata?.title || 'Untitled Book',
      chapters: allSections,
      metadata: {
        ...bookUnderstanding.extractedMetadata,
        bookType: bookUnderstanding.bookUnderstanding?.bookType,
        primaryPurpose: bookUnderstanding.bookUnderstanding?.primaryPurpose,
        targetAudience: bookUnderstanding.bookUnderstanding?.targetAudience,
        interactiveElements: bookUnderstanding.bookUnderstanding?.interactiveElements,
        specialFeatures: bookUnderstanding.bookUnderstanding?.specialFeatures,
        totalSections: allSections.length,
        formatRequirements: contentAnalysis.formatRequirements
      },
      bookAnalysis: bookUnderstanding.bookUnderstanding,
      structuralAnalysis: bookUnderstanding.structuralAnalysis,
      formatRequirements: contentAnalysis.formatRequirements
    };
    
  } catch (error) {
    console.error('Comprehensive AI analysis failed:', error.message);
    console.log('Using fallback detection');
    return detectBookStructureFallback(text);
  }
}

// Fallback analysis for large texts
async function analyzeInChunks(text, basicMetadata = {}) {
  console.log('Performing chunk-based analysis...');
  
  const chunkSize = 8000; // Characters per chunk
  const chunks = [];
  
  // Split text into manageable chunks
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  
  console.log(`Analyzing ${chunks.length} chunks...`);
  
  // Analyze first few chunks for structure
  const analysisChunks = chunks.slice(0, 3); // First 3 chunks
  const allSections = [];
  
  for (let i = 0; i < analysisChunks.length; i++) {
    const chunk = analysisChunks[i];
    
    try {
      if (openai) {
        const chunkPrompt = `Analyze this section of text and extract any structural elements:

TEXT SECTION:
${chunk}

Find any:
- Chapter titles or section headings
- Questions or exercises
- Special formatting requirements
- Content breaks

Return JSON with sections found:
{
  "sections": [
    {
      "title": "section title",
      "content": "section content",
      "type": "chapter/question/exercise/etc"
    }
  ]
}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: "Extract structural elements from text. Return valid JSON only." },
            { role: "user", content: chunkPrompt }
          ],
          temperature: 0,
          max_tokens: 1000
        });

        const chunkResult = JSON.parse(response.choices[0].message.content.trim().replace(/```json\n?|```\n?/g, ''));
        
        if (chunkResult.sections) {
          chunkResult.sections.forEach((section, idx) => {
            allSections.push({
              id: `chunk-${i}-section-${idx}`,
              title: section.title || `Section ${allSections.length + 1}`,
              content: section.content,
              level: 1,
              type: section.type || 'section'
            });
          });
        }
      }
    } catch (e) {
      console.log(`Chunk ${i} analysis failed:`, e.message);
    }
  }
  
  // If no sections found, treat entire text as one section
  if (allSections.length === 0) {
    allSections.push({
      id: 'full-content',
      title: basicMetadata.title || 'Complete Content',
      content: text,
      level: 1,
      type: 'chapter'
    });
  }
  
  return {
    title: basicMetadata.title || 'Untitled Book',
    chapters: allSections,
    metadata: {
      ...basicMetadata,
      totalSections: allSections.length,
      analysisMethod: 'chunk-based'
    }
  };
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