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

// AI-powered structure detection with true content understanding
async function detectBookStructureWithAI(text) {
  if (!openai) {
    console.log('OpenAI not available, using fallback structure detection');
    return detectBookStructureFallback(text);
  }

  try {
    console.log(`Starting intelligent book analysis for ${text.length} characters`);
    
    // STAGE 1: Content Sampling & Understanding
    const contentSamples = extractContentSamples(text);
    console.log('Stage 1: Analyzing content samples...');
    
    const bookIntelligence = await analyzeContentSamples(contentSamples);
    console.log('Book intelligence:', bookIntelligence);
    
    // STAGE 2: Pattern Recognition Based on Understanding
    console.log('Stage 2: Recognizing content patterns...');
    const contentPatterns = recognizeContentPatterns(text, bookIntelligence);
    
    // STAGE 3: Structure Mapping
    console.log('Stage 3: Mapping book structure...');
    const structureMap = await mapBookStructure(text, bookIntelligence, contentPatterns);
    
    // STAGE 4: Content Extraction & Validation
    console.log('Stage 4: Extracting and validating content...');
    const finalStructure = await extractAndValidateContent(text, structureMap, bookIntelligence);
    
    console.log(`Intelligent analysis complete: Found ${finalStructure.chapters.length} sections`);
    return finalStructure;
    
  } catch (error) {
    console.error('Intelligent analysis failed:', error.message);
    
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log('API quota exceeded, using enhanced fallback');
    }
    
    return detectBookStructureFallback(text);
  }
}

// STAGE 1: Extract representative samples from different parts of the book
function extractContentSamples(text) {
  const samples = {};
  const lines = text.split('\n').filter(line => line.trim());
  
  // Beginning sample (first 15%)
  const beginningEnd = Math.floor(lines.length * 0.15);
  samples.beginning = lines.slice(0, beginningEnd).join('\n');
  
  // Middle sample (middle 10%)
  const middleStart = Math.floor(lines.length * 0.45);
  const middleEnd = Math.floor(lines.length * 0.55);
  samples.middle = lines.slice(middleStart, middleEnd).join('\n');
  
  // End sample (last 10%)
  const endStart = Math.floor(lines.length * 0.9);
  samples.end = lines.slice(endStart).join('\n');
  
  // Random samples (for pattern validation)
  samples.random1 = lines.slice(
    Math.floor(lines.length * 0.25), 
    Math.floor(lines.length * 0.30)
  ).join('\n');
  
  samples.random2 = lines.slice(
    Math.floor(lines.length * 0.70), 
    Math.floor(lines.length * 0.75)
  ).join('\n');
  
  console.log(`Extracted samples: beginning(${samples.beginning.length}), middle(${samples.middle.length}), end(${samples.end.length})`);
  return samples;
}

// STAGE 1: Analyze content samples to understand book type and characteristics
async function analyzeContentSamples(samples) {
  const analysisPrompt = `You are analyzing samples from a book to understand its nature and structure. Read these samples carefully:

BEGINNING SAMPLE:
${samples.beginning.substring(0, 3000)}

MIDDLE SAMPLE:
${samples.middle.substring(0, 2000)}

RANDOM SAMPLE:
${samples.random1.substring(0, 2000)}

Based on these samples, determine:

1. What TYPE of book is this? (Look for patterns like:)
   - Textbook: Has chapters, exercises, review questions, academic tone
   - Workbook: Has activities, fill-in-blanks, practice problems
   - Novel: Has narrative, dialogue, character development
   - Manual: Has procedures, steps, instructions
   - Reference: Has definitions, lists, organized facts
   - Children's book: Simple language, stories, activities
   - Academic: Complex concepts, citations, formal tone

2. What ELEMENTS does it contain? (Look for:)
   - Question patterns: "1. What is...", "Answer:", "True/False"
   - Exercise patterns: "Exercise 1:", "Practice:", "Try this:"
   - Chapter patterns: "Chapter X", numbered sections
   - Instructional patterns: "Step 1:", "How to:", "Follow these"
   - Narrative patterns: dialogue, character names, story flow

3. How is content ORGANIZED?
   - Sequential chapters/lessons
   - Topic-based sections
   - Question-answer format
   - Story progression
   - Reference organization

Return ONLY this JSON:
{
  "bookType": "exact type detected",
  "confidence": "High/Medium/Low",
  "primaryElements": ["questions", "exercises", "chapters", "stories", etc],
  "contentOrganization": "how content is structured",
  "hasQuestions": true/false,
  "hasExercises": true/false,
  "hasNarrative": true/false,
  "hasInstructions": true/false,
  "targetAudience": "who this is for",
  "complexity": "Simple/Moderate/Advanced",
  "estimatedSections": "rough number of main sections"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a book content analyst. Analyze samples carefully to understand book type and structure. Return only valid JSON."
        },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0,
      max_tokens: 600
    });

    const intelligence = JSON.parse(
      response.choices[0].message.content.trim().replace(/```json\n?|```\n?/g, '')
    );
    
    return intelligence;
  } catch (e) {
    console.log('AI analysis failed, using heuristic analysis:', e.message);
    return analyzeContentHeuristically(samples);
  }
}

// Heuristic analysis when AI is not available
function analyzeContentHeuristically(samples) {
  const fullText = Object.values(samples).join('\n').toLowerCase();
  
  // Count various patterns
  const patterns = {
    questions: (fullText.match(/\b(what|how|why|when|where|which)\b.*\?/g) || []).length,
    exercises: (fullText.match(/\b(exercise|activity|practice|problem)\s*\d+/g) || []).length,
    chapters: (fullText.match(/\b(chapter|lesson|unit|section)\s*\d+/g) || []).length,
    instructions: (fullText.match(/\b(step|follow|complete|do|try)\b/g) || []).length,
    narrative: (fullText.match(/\b(said|thought|looked|walked|went)\b/g) || []).length
  };
  
  // Determine book type based on patterns
  let bookType = "General Text";
  if (patterns.exercises > 5) bookType = "Workbook";
  else if (patterns.questions > 10) bookType = "Textbook";
  else if (patterns.narrative > 20) bookType = "Novel";
  else if (patterns.instructions > 10) bookType = "Manual";
  
  return {
    bookType,
    confidence: "Medium",
    primaryElements: Object.keys(patterns).filter(k => patterns[k] > 0),
    hasQuestions: patterns.questions > 0,
    hasExercises: patterns.exercises > 0,
    hasNarrative: patterns.narrative > 5,
    hasInstructions: patterns.instructions > 5,
    estimatedSections: Math.max(patterns.chapters, 3)
  };
}

// STAGE 2: Recognize patterns based on book understanding
function recognizeContentPatterns(text, intelligence) {
  const patterns = {
    sectionBreaks: [],
    questionBlocks: [],
    exerciseBlocks: [],
    specialSections: []
  };
  
  const lines = text.split('\n');
  
  // Build patterns based on book type
  if (intelligence.bookType.toLowerCase().includes('textbook')) {
    patterns.sectionBreaks = [
      /^Chapter\s+(\d+|[IVXLC]+)[\s:.-]*(.*)$/i,
      /^Lesson\s+(\d+)[\s:.-]*(.*)$/i,
      /^Unit\s+(\d+)[\s:.-]*(.*)$/i
    ];
    patterns.questionBlocks = [
      /^(\d+\.|Q\d+|\d+\))\s*(.*)$/,
      /^Questions?[\s:]*$/i,
      /^Review Questions?[\s:]*$/i
    ];
  } else if (intelligence.bookType.toLowerCase().includes('workbook')) {
    patterns.exerciseBlocks = [
      /^Exercise\s+(\d+)[\s:.-]*(.*)$/i,
      /^Activity\s+(\d+)[\s:.-]*(.*)$/i,
      /^Practice\s+(\d+)[\s:.-]*(.*)$/i
    ];
    patterns.questionBlocks = [
      /^(\d+\.|Q\d+|\d+\))\s*(.*)$/,
      /^\s*_+\s*$/, // Fill in the blanks
      /^Answer[\s:]+(.*)$/i
    ];
  } else if (intelligence.bookType.toLowerCase().includes('novel')) {
    patterns.sectionBreaks = [
      /^Chapter\s+(\d+|[IVXLC]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)[\s:.-]*(.*)$/i,
      /^Part\s+(\d+|[IVXLC]+|One|Two|Three)[\s:.-]*(.*)$/i
    ];
  }
  
  // Find pattern matches in text
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check section breaks
    for (const pattern of patterns.sectionBreaks) {
      const match = line.match(pattern);
      if (match) {
        patterns.foundSections = patterns.foundSections || [];
        patterns.foundSections.push({
          line: i,
          text: line,
          title: match[2] || match[1],
          number: match[1]
        });
      }
    }
    
    // Check question patterns
    for (const pattern of patterns.questionBlocks) {
      if (pattern.test(line)) {
        patterns.foundQuestions = patterns.foundQuestions || [];
        patterns.foundQuestions.push({ line: i, text: line });
      }
    }
    
    // Check exercise patterns
    for (const pattern of patterns.exerciseBlocks) {
      if (pattern.test(line)) {
        patterns.foundExercises = patterns.foundExercises || [];
        patterns.foundExercises.push({ line: i, text: line });
      }
    }
  }
  
  console.log(`Pattern recognition: ${patterns.foundSections?.length || 0} sections, ${patterns.foundQuestions?.length || 0} questions, ${patterns.foundExercises?.length || 0} exercises`);
  return patterns;
}

// STAGE 3: Map book structure based on patterns and intelligence
async function mapBookStructure(text, intelligence, patterns) {
  const structureMap = {
    sections: [],
    specialBlocks: [],
    contentFlow: intelligence.contentOrganization
  };
  
  const lines = text.split('\n');
  
  // If we found clear section patterns, use them
  if (patterns.foundSections && patterns.foundSections.length > 1) {
    for (let i = 0; i < patterns.foundSections.length; i++) {
      const section = patterns.foundSections[i];
      const nextSection = patterns.foundSections[i + 1];
      
      const startLine = section.line;
      const endLine = nextSection ? nextSection.line : lines.length;
      
      structureMap.sections.push({
        title: section.title || `Section ${i + 1}`,
        startLine,
        endLine,
        type: 'chapter',
        content: lines.slice(startLine, endLine).join('\n')
      });
    }
  } else {
    // Use intelligent chunking based on book type
    const chunkSize = Math.floor(lines.length / parseInt(intelligence.estimatedSections));
    for (let i = 0; i < parseInt(intelligence.estimatedSections); i++) {
      const startLine = i * chunkSize;
      const endLine = Math.min((i + 1) * chunkSize, lines.length);
      
      // Try to find a good title for this section
      const sectionText = lines.slice(startLine, Math.min(startLine + 20, endLine)).join(' ');
      const title = extractSectionTitle(sectionText, i + 1, intelligence.bookType);
      
      structureMap.sections.push({
        title,
        startLine,
        endLine,
        type: 'section',
        content: lines.slice(startLine, endLine).join('\n')
      });
    }
  }
  
  // Map special blocks (questions, exercises)
  if (patterns.foundQuestions) {
    structureMap.specialBlocks.push({
      type: 'questions',
      locations: patterns.foundQuestions
    });
  }
  
  if (patterns.foundExercises) {
    structureMap.specialBlocks.push({
      type: 'exercises', 
      locations: patterns.foundExercises
    });
  }
  
  return structureMap;
}

// Extract intelligent section title
function extractSectionTitle(sectionText, sectionNumber, bookType) {
  // Look for title-like patterns in the first few lines
  const lines = sectionText.split('\n').slice(0, 5);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 5 && trimmed.length < 80) {
      // Check if it looks like a title
      if (/^[A-Z]/.test(trimmed) && !trimmed.endsWith('.')) {
        return trimmed;
      }
    }
  }
  
  // Generate appropriate title based on book type
  if (bookType.toLowerCase().includes('textbook')) {
    return `Lesson ${sectionNumber}`;
  } else if (bookType.toLowerCase().includes('workbook')) {
    return `Activity ${sectionNumber}`;
  } else if (bookType.toLowerCase().includes('manual')) {
    return `Section ${sectionNumber}`;
  } else {
    return `Chapter ${sectionNumber}`;
  }
}

// STAGE 4: Extract and validate final content structure
async function extractAndValidateContent(text, structureMap, intelligence) {
  const finalStructure = {
    title: 'Untitled Book',
    chapters: [],
    metadata: {
      bookType: intelligence.bookType,
      primaryPurpose: `${intelligence.bookType} content`,
      targetAudience: intelligence.targetAudience || 'General',
      totalSections: structureMap.sections.length,
      analysisMethod: 'intelligent-multi-stage',
      confidence: intelligence.confidence
    },
    bookAnalysis: {
      genre: intelligence.bookType,
      complexity: intelligence.complexity || 'Moderate',
      hasInteractiveElements: intelligence.hasQuestions || intelligence.hasExercises,
      contentOrganization: intelligence.contentOrganization
    },
    formatRequirements: {
      needsQuestionFormatting: intelligence.hasQuestions,
      needsExerciseSpacing: intelligence.hasExercises,
      needsSpecialHandling: intelligence.hasInstructions
    }
  };
  
  // Extract title from beginning if possible
  const firstLines = text.split('\n').slice(0, 10);
  for (const line of firstLines) {
    const trimmed = line.trim();
    if (trimmed.length > 5 && trimmed.length < 100 && /^[A-Z]/.test(trimmed)) {
      finalStructure.title = trimmed;
      break;
    }
  }
  
  // Process each section
  structureMap.sections.forEach((section, index) => {
    finalStructure.chapters.push({
      id: `section-${index + 1}`,
      title: section.title,
      content: section.content.trim(),
      level: 1,
      type: section.type,
      hasQuestions: hasQuestionsInContent(section.content),
      hasExercises: hasExercisesInContent(section.content),
      specialElements: identifySpecialElements(section.content, intelligence)
    });
  });
  
  return finalStructure;
}

// Helper functions
function hasQuestionsInContent(content) {
  return /\b(what|how|why|when|where)\b.*\?/i.test(content) || 
         /^\s*\d+\.\s*.{10,}\?/m.test(content);
}

function hasExercisesInContent(content) {
  return /\b(exercise|activity|practice|complete|solve)\b/i.test(content) ||
         /^\s*\d+\.\s*.{10,}$/m.test(content);
}

function identifySpecialElements(content, intelligence) {
  const elements = [];
  
  if (hasQuestionsInContent(content)) elements.push('questions');
  if (hasExercisesInContent(content)) elements.push('exercises');
  if (/\b(table|chart|diagram|figure)\b/i.test(content)) elements.push('tables');
  if (/^\s*_+\s*$/m.test(content)) elements.push('fill-in-blanks');
  if (/\b(answer|solution)[\s:]/i.test(content)) elements.push('answers');
  
  return elements;
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