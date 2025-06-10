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

// Add rate limiting and quota management
let requestCount = 0;
let lastRequestTime = Date.now();
const REQUEST_LIMIT_PER_MINUTE = 3; // Conservative limit
const MIN_REQUEST_INTERVAL = 20000; // 20 seconds between requests

async function makeRateLimitedRequest(requestFn) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  // Reset counter if more than a minute has passed
  if (timeSinceLastRequest > 60000) {
    requestCount = 0;
  }
  
  // Check if we've hit the rate limit
  if (requestCount >= REQUEST_LIMIT_PER_MINUTE) {
    console.log('Rate limit exceeded, skipping AI request');
    throw new Error('Rate limit exceeded');
  }
  
  // Ensure minimum interval between requests
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Waiting ${waitTime}ms before next request to avoid quota issues`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  try {
    requestCount++;
    lastRequestTime = Date.now();
    return await requestFn();
  } catch (error) {
    if (error.message && error.message.includes('429')) {
      console.log('OpenAI quota exceeded, implementing exponential backoff');
      // Implement exponential backoff
      const backoffTime = Math.min(300000, 60000 * Math.pow(2, requestCount)); // Max 5 minutes
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      throw error;
    }
    throw error;
  }
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

// AI-powered structure detection with complete text extraction first
async function detectBookStructureWithAI(text) {
  console.log(`Starting comprehensive analysis for ${text.length} characters`);
  
  // PHASE 1: We already have the complete raw text extracted
  console.log('Phase 1: Complete text extraction - DONE');
  console.log(`Extracted ${text.length} characters of raw content`);
  
  // PHASE 2: Give the complete text to AI for line-by-line semantic understanding
  console.log('Phase 2: AI semantic understanding of complete content...');
  const intelligentAnalysis = await performIntelligentTextAnalysis(text);
  
  // PHASE 3: Structure the results for formatting
  console.log('Phase 3: Structuring results for KDP formatting...');
  const finalStructure = await organizeContentForKDP(intelligentAnalysis, text);
  
  console.log(`Analysis complete: Found ${finalStructure.chapters.length} content sections`);
  return finalStructure;
}

// PHASE 2: Intelligent AI analysis of complete text
async function performIntelligentTextAnalysis(completeText) {
  if (!openai) {
    console.log('OpenAI not available, using enhanced heuristic analysis');
    return performEnhancedHeuristicAnalysis(completeText);
  }

  try {
    console.log('Sending complete text to AI for intelligent analysis...');
    
    // Prepare the complete text for AI analysis
    const analysisPrompt = `You are a professional document analyst. I'm going to give you the COMPLETE text content of a book/document. Please read through it carefully and provide a comprehensive analysis.

COMPLETE DOCUMENT TEXT:
"""
${completeText}
"""

Please analyze this document and provide:

1. DOCUMENT OVERVIEW:
   - Document type (novel, textbook, workbook, manual, children's book, etc.)
   - Main topic/subject
   - Estimated target audience
   - Overall structure and organization

2. CONTENT IDENTIFICATION:
   - Title (actual book title from the text)
   - Author name (if mentioned)
   - Subtitle (if present)
   - Copyright information (if present)
   - Table of contents structure (if present)

3. CHAPTER/SECTION ANALYSIS:
   - How many clear chapters/sections are there?
   - What are the chapter titles/headings?
   - What is the main content type in each section?

4. SPECIAL ELEMENTS FOUND:
   - Questions (count and examples)
   - Exercises/activities (count and examples)
   - Quotes or dialogue (count and examples)
   - Instructions or step-by-step content
   - Lists or bullet points
   - Answers or solutions
   - Any other special formatting needs

5. RECOMMENDED FORMATTING:
   - Should this have a title page?
   - Should this have a table of contents?
   - What special formatting is needed for questions/exercises?
   - Any other formatting recommendations?

Please be specific and detailed. This analysis will be used to format the document professionally for KDP publishing.

Return your analysis in a clear, structured format.`;

    const response = await makeRateLimitedRequest(() => openai.chat.completions.create({
      model: "gpt-4", // Use GPT-4 for better analysis
      messages: [
        { 
          role: "system", 
          content: "You are a professional document analyst specializing in book structure and content organization. Provide detailed, accurate analysis of the complete document content."
        },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      max_tokens: 2000 // More tokens for detailed analysis
    }));

    const analysis = response.choices[0].message.content;
    console.log('AI Analysis completed successfully');
    
    // Now do line-by-line semantic tagging based on the analysis
    const semanticStructure = await performSemanticTagging(completeText, analysis);
    
    return {
      aiAnalysis: analysis,
      semanticStructure: semanticStructure,
      method: 'complete-text-ai-analysis'
    };
    
  } catch (error) {
    console.error('AI analysis failed:', error.message);
    console.log('Falling back to enhanced heuristic analysis');
    return performEnhancedHeuristicAnalysis(completeText);
  }
}

// Enhanced line-by-line semantic tagging based on AI analysis
async function performSemanticTagging(text, aiAnalysis) {
  const lines = text.split('\n');
  console.log(`Performing semantic tagging on ${lines.length} lines`);
  
  // Use AI analysis context to improve line classification
  const semanticLines = lines.map((line, index) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      return {
        line_number: index + 1,
        content: line,
        semantic_type: 'blank',
        confidence: 'high'
      };
    }
    
    // Enhanced classification using AI context
    const semanticType = classifyLineWithContext(trimmed, aiAnalysis, index, lines);
    
    return {
      line_number: index + 1,
      content: line,
      semantic_type: semanticType,
      confidence: 'high'
    };
  });
  
  return semanticLines;
}

// Intelligent line classification using AI analysis context
function classifyLineWithContext(line, aiAnalysis, lineIndex, allLines) {
  const lower = line.toLowerCase();
  const aiLower = aiAnalysis.toLowerCase();
  
  // Use AI analysis to inform classification
  
  // Copyright detection (enhanced with AI context)
  if (lower.includes('copyright') || lower.includes('©') || lower.includes('(c)') || 
      lower.includes('isbn') || lower.includes('publisher') || lower.includes('published by') ||
      lower.includes('all rights reserved') || lower.match(/^\d{4}\s+by/)) {
    return 'copyright';
  }
  
  // Title detection (use AI analysis to identify actual title)
  if (aiAnalysis.includes('Title:') || aiAnalysis.includes('title:')) {
    // Extract title from AI analysis and match against line
    const titleMatch = aiAnalysis.match(/title[:\s]+([^\n]+)/i);
    if (titleMatch && line.includes(titleMatch[1].trim())) {
      return 'title_page';
    }
  }
  
  // Chapter detection (enhanced with AI context)
  if (line.match(/^(Chapter|Lesson|Unit|Section|Part)\s+(\d+|[IVXLC]+)/i) ||
      (aiLower.includes('chapter') && line.length < 100 && /^[A-Z]/.test(line))) {
    return 'chapter_header';
  }
  
  // Table of contents detection
  if (lower.includes('table of contents') || lower === 'contents' || 
      lower.includes('index') && line.length < 20) {
    return 'toc_header';
  }
  
  // TOC entries (lines with page numbers)
  if (line.match(/.*\.\.*\s*\d+\s*$/) || 
      (line.match(/.*\s+\d+\s*$/) && line.includes('.'))) {
    return 'toc_entry';
  }
  
  // Question detection (enhanced based on AI analysis)
  if (line.match(/^\d+\.\s*.{10,}\?/) || 
      line.match(/^Q\d+[\.:]\s*/) ||
      line.match(/^\d+\)\s*.{10,}\?/) ||
      lower.match(/^(what|how|why|when|where|which|who)\b.*\?/) ||
      lower.includes('true or false') || 
      lower.includes('multiple choice') ||
      line.match(/^[A-D]\)\s+/) ||
      (aiLower.includes('question') && line.endsWith('?'))) {
    return 'question';
  }
  
  // Exercise detection (enhanced with AI context)
  if (lower.includes('exercise') || lower.includes('activity') || 
      lower.includes('practice') || lower.includes('try this') ||
      lower.includes('complete the') ||
      (aiLower.includes('exercise') && line.match(/^\d+/))) {
    return 'exercise';
  }
  
  // Answer detection
  if (lower.includes('answer:') || lower.includes('solution:') || 
      lower.includes('answers:') || line.match(/^Answer\s+\d+/i)) {
    return 'answer';
  }
  
  // Instructions and steps
  if (line.match(/^(Step\s+\d+|First|Second|Third|Next|Finally|Then)[\s:.-]/i) ||
      lower.includes('follow these') || lower.includes('instructions') ||
      line.match(/^\d+\.\s+(Do|Try|Complete|Follow|Find|List)/i)) {
    return 'instruction';
  }
  
  // Lists
  if (line.match(/^[-•*]\s+/) || 
      line.match(/^[a-z]\)\s+/) || 
      line.match(/^[ivx]+\.\s+/i)) {
    return 'list_item';
  }
  
  // Quotes and dialogue
  if ((line.startsWith('"') && line.endsWith('"')) ||
      (line.startsWith('"') || line.endsWith('"')) ||
      line.includes('" said') || line.includes('" asked') ||
      line.includes('said "') || line.includes('asked "')) {
    return 'quote';
  }
  
  // Special sections
  if (lower.includes('dedication') || 
      (lower.includes('to my') || lower.includes('for my')) && line.length < 100) {
    return 'dedication';
  }
  if (lower.includes('acknowledgment') || lower.includes('thanks to') || 
      lower.includes('grateful to') || lower.includes('special thanks')) {
    return 'acknowledgments';
  }
  if (lower.includes('preface') || lower.includes('foreword') || 
      (lower.includes('introduction') && line.length < 50)) {
    return 'preface';
  }
  if (lower.includes('appendix') || lower.includes('references') || 
      lower.includes('bibliography') || lower.includes('glossary')) {
    return 'appendix';
  }
  
  // Page numbers and metadata
  if (line.match(/^\d+$/) || 
      line.match(/^page\s+\d+/i) ||
      line.match(/^\d+\s*[-–—]\s*\d+$/) ||
      (line.length < 10 && line.match(/^\d/))) {
    return 'metadata';
  }
  
  // Subheaders (enhanced detection)
  if (line.length < 80 && line.length > 10 && 
      /^[A-Z]/.test(line) && !line.endsWith('.') && 
      !line.endsWith('?') && !line.endsWith('!') &&
      line.split(' ').length <= 8) {
    return 'subheader';
  }
  
  // Regular paragraphs
  if (line.length > 20 && 
      (line.includes('.') || line.includes(',') || line.includes(';'))) {
    return 'paragraph';
  }
  
  // Short text
  if (line.length <= 20) {
    return 'metadata';
  }
  
  // Default to paragraph
  return 'paragraph';
}

// Enhanced heuristic analysis for when AI is not available
function performEnhancedHeuristicAnalysis(text) {
  console.log('Performing enhanced heuristic analysis of complete text');
  
  const lines = text.split('\n');
  const semanticLines = lines.map((line, index) => {
    const trimmed = line.trim();
    
    return {
      line_number: index + 1,
      content: line,
      semantic_type: trimmed ? classifyLineHeuristically(line) : 'blank',
      confidence: 'medium'
    };
  });
  
  // Analyze the overall structure
  const analysis = `HEURISTIC ANALYSIS:
Document type: ${determineDocumentType(semanticLines)}
Total lines: ${lines.length}
Estimated structure: ${estimateStructure(semanticLines)}
Special elements detected: ${detectSpecialElements(semanticLines)}
Formatting recommendations: Standard book formatting with detected elements`;
  
  return {
    aiAnalysis: analysis,
    semanticStructure: semanticLines,
    method: 'enhanced-heuristic-analysis'
  };
}

// Helper functions for heuristic analysis
function determineDocumentType(semanticLines) {
  const questionCount = semanticLines.filter(l => l.semantic_type === 'question').length;
  const exerciseCount = semanticLines.filter(l => l.semantic_type === 'exercise').length;
  const quoteCount = semanticLines.filter(l => l.semantic_type === 'quote').length;
  const paragraphCount = semanticLines.filter(l => l.semantic_type === 'paragraph').length;
  
  if (questionCount > 20 || exerciseCount > 10) return 'workbook';
  if (questionCount > 5 || exerciseCount > 5) return 'textbook';
  if (quoteCount > paragraphCount * 0.1) return 'novel';
  return 'general book';
}

function estimateStructure(semanticLines) {
  const chapterCount = semanticLines.filter(l => l.semantic_type === 'chapter_header').length;
  const tocCount = semanticLines.filter(l => l.semantic_type === 'toc_entry').length;
  
  if (chapterCount > 3) return `${chapterCount} chapters detected`;
  if (tocCount > 3) return `Table of contents with ${tocCount} entries`;
  return 'Unstructured or single-section document';
}

function detectSpecialElements(semanticLines) {
  const elements = [];
  const questionCount = semanticLines.filter(l => l.semantic_type === 'question').length;
  const exerciseCount = semanticLines.filter(l => l.semantic_type === 'exercise').length;
  const quoteCount = semanticLines.filter(l => l.semantic_type === 'quote').length;
  
  if (questionCount > 0) elements.push(`${questionCount} questions`);
  if (exerciseCount > 0) elements.push(`${exerciseCount} exercises`);
  if (quoteCount > 0) elements.push(`${quoteCount} quotes`);
  
  return elements.length > 0 ? elements.join(', ') : 'Standard text content';
}

// PHASE 3: Organize content for KDP formatting
async function organizeContentForKDP(intelligentAnalysis, originalText) {
  console.log('Organizing content for professional KDP formatting...');
  
  const { aiAnalysis, semanticStructure } = intelligentAnalysis;
  
  // Extract metadata from AI analysis
  const metadata = extractMetadataFromAnalysis(aiAnalysis);
  
  // Group semantic content
  const groupedContent = groupSemanticContent(semanticStructure);
  
  // Create final structure
  const finalStructure = {
    title: metadata.title || 'Untitled Book',
    subtitle: metadata.subtitle || '',
    author: metadata.author || '',
    chapters: [],
    metadata: {
      documentType: metadata.documentType,
      hasTitle: groupedContent.title_page.length > 0,
      hasTOC: groupedContent.toc_entry.length > 3,
      hasCopyright: groupedContent.copyright.length > 0,
      hasDedication: groupedContent.dedication.length > 0,
      totalLines: semanticStructure.length,
      analysisMethod: intelligentAnalysis.method,
      aiAnalysis: aiAnalysis
    },
    formatRequirements: {
      needsQuestionFormatting: groupedContent.question.length > 0,
      needsExerciseSpacing: groupedContent.exercise.length > 0,
      needsSpecialHandling: groupedContent.instruction.length > 0 || groupedContent.list_item.length > 0,
      needsTitlePage: metadata.recommendTitlePage,
      needsTOC: metadata.recommendTOC
    },
    contentBreakdown: {
      questions: groupedContent.question.length,
      exercises: groupedContent.exercise.length,
      paragraphs: groupedContent.paragraph.length,
      quotes: groupedContent.quote.length,
      chapters: groupedContent.chapter_header.length
    }
  };
  
  // Organize chapters/sections
  if (groupedContent.chapter_header.length > 0) {
    finalStructure.chapters = createChaptersFromHeaders(groupedContent.chapter_header, semanticStructure);
  } else {
    finalStructure.chapters = createIntelligentSections(semanticStructure, metadata);
  }
  
  return finalStructure;
}

// Helper function to extract metadata from AI analysis
function extractMetadataFromAnalysis(aiAnalysis) {
  const metadata = {
    title: 'Untitled Book',
    subtitle: '',
    author: '',
    documentType: 'general book',
    recommendTitlePage: true,
    recommendTOC: false
  };
  
  // Extract title
  const titleMatch = aiAnalysis.match(/title[:\s]*([^\n\.]+)/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim().replace(/['"]/g, '');
  }
  
  // Extract subtitle
  const subtitleMatch = aiAnalysis.match(/subtitle[:\s]*([^\n\.]+)/i);
  if (subtitleMatch) {
    metadata.subtitle = subtitleMatch[1].trim().replace(/['"]/g, '');
  }
  
  // Extract author
  const authorMatch = aiAnalysis.match(/author[:\s]*([^\n\.]+)/i);
  if (authorMatch) {
    metadata.author = authorMatch[1].trim().replace(/['"]/g, '');
  }
  
  // Extract document type
  const docTypeMatch = aiAnalysis.match(/document type[:\s]*([^\n\.]+)/i);
  if (docTypeMatch) {
    metadata.documentType = docTypeMatch[1].trim().toLowerCase();
  }
  
  // Check recommendations
  if (aiAnalysis.toLowerCase().includes('table of contents') || 
      aiAnalysis.toLowerCase().includes('should have a toc')) {
    metadata.recommendTOC = true;
  }
  
  return metadata;
}

// Helper function to group semantic content
function groupSemanticContent(semanticStructure) {
  const groupedContent = {
    copyright: [],
    title_page: [],
    dedication: [],
    toc_header: [],
    toc_entry: [],
    chapter_header: [],
    subheader: [],
    paragraph: [],
    quote: [],
    question: [],
    exercise: [],
    instruction: [],
    list_item: [],
    preface: [],
    acknowledgments: [],
    appendix: [],
    glossary: [],
    answer: [],
    blank: [],
    metadata: []
  };
  
  semanticStructure.forEach(line => {
    const type = line.semantic_type;
    if (groupedContent[type]) {
      groupedContent[type].push(line);
    }
  });
  
  return groupedContent;
}

// Helper function to create chapters from detected headers
function createChaptersFromHeaders(chapterHeaders, semanticStructure) {
  const chapters = [];
  
  for (let i = 0; i < chapterHeaders.length; i++) {
    const currentHeader = chapterHeaders[i];
    const nextHeader = chapterHeaders[i + 1];
    
    const startLine = currentHeader.line_number;
    const endLine = nextHeader ? nextHeader.line_number : semanticStructure.length;
    
    // Extract content between this chapter and next
    const chapterContent = semanticStructure
      .slice(startLine - 1, endLine - 1)
      .map(line => line.content)
      .join('\n');
    
    // Analyze this chapter's content
    const chapterSemantics = semanticStructure.slice(startLine - 1, endLine - 1);
    const chapterAnalysis = analyzeChapterSemantics(chapterSemantics);
    
    chapters.push({
      id: `chapter-${i + 1}`,
      title: currentHeader.content.trim(),
      content: chapterContent.trim(),
      level: 1,
      type: 'chapter',
      startLine,
      endLine: endLine - 1,
      hasQuestions: chapterAnalysis.hasQuestions,
      hasExercises: chapterAnalysis.hasExercises,
      hasQuotes: chapterAnalysis.hasQuotes,
      specialElements: chapterAnalysis.specialElements,
      wordCount: chapterContent.split(' ').length
    });
  }
  
  return chapters;
}

// Helper function to create intelligent sections when no clear chapters exist
function createIntelligentSections(semanticStructure, metadata) {
  const contentLines = semanticStructure.filter(line => 
    ['paragraph', 'quote', 'question', 'exercise', 'instruction'].includes(line.semantic_type)
  );
  
  if (contentLines.length === 0) {
    // If no content found, create a single section with all text
    return [{
      id: 'section-1',
      title: metadata.title || 'Complete Text',
      content: semanticStructure.map(line => line.content).join('\n'),
      level: 1,
      type: 'section',
      hasQuestions: false,
      hasExercises: false,
      specialElements: [],
      wordCount: semanticStructure.join(' ').split(' ').length
    }];
  }
  
  // Create 3 intelligent sections
  const sections = [];
  const sectionSize = Math.ceil(contentLines.length / 3);
  
  for (let i = 0; i < 3; i++) {
    const startIndex = i * sectionSize;
    const endIndex = Math.min(startIndex + sectionSize, contentLines.length);
    
    if (startIndex >= contentLines.length) break;
    
    const sectionLines = contentLines.slice(startIndex, endIndex);
    const sectionContent = sectionLines.map(line => line.content).join('\n');
    const sectionAnalysis = analyzeChapterSemantics(sectionLines);
    
    // Generate a smart title based on content
    let sectionTitle = `Section ${i + 1}`;
    const firstParagraph = sectionLines.find(line => line.semantic_type === 'paragraph');
    if (firstParagraph && firstParagraph.content.length > 20) {
      const words = firstParagraph.content.trim().split(' ').slice(0, 6);
      sectionTitle = words.join(' ').replace(/[^\w\s]/g, '');
      if (sectionTitle.length > 50) {
        sectionTitle = sectionTitle.substring(0, 47) + '...';
      }
    }
    
    sections.push({
      id: `section-${i + 1}`,
      title: sectionTitle,
      content: sectionContent.trim(),
      level: 1,
      type: 'section',
      hasQuestions: sectionAnalysis.hasQuestions,
      hasExercises: sectionAnalysis.hasExercises,
      specialElements: sectionAnalysis.specialElements,
      wordCount: sectionContent.split(' ').length
    });
  }
  
  return sections;
}

// Helper function to analyze individual chapter/section semantics
function analyzeChapterSemantics(chapterLines) {
  const breakdown = {};
  const specialElements = [];
  
  chapterLines.forEach(line => {
    const type = line.semantic_type;
    breakdown[type] = (breakdown[type] || 0) + 1;
  });
  
  const hasQuestions = (breakdown.question || 0) > 0;
  const hasExercises = (breakdown.exercise || 0) > 0;
  const hasQuotes = (breakdown.quote || 0) > 0;
  const hasInstructions = (breakdown.instruction || 0) > 0;
  const hasLists = (breakdown.list_item || 0) > 0;
  
  if (hasQuestions) specialElements.push('questions');
  if (hasExercises) specialElements.push('exercises');
  if (hasQuotes) specialElements.push('quotes');
  if (hasInstructions) specialElements.push('instructions');
  if (hasLists) specialElements.push('lists');
  
  return {
    hasQuestions,
    hasExercises,
    hasQuotes,
    hasInstructions,
    hasLists,
    specialElements,
    breakdown
  };
}

// Enhanced heuristic line classification when AI is not available
function classifyLineHeuristically(line) {
  // Implementation of classifyLineHeuristically function
}

// Enhanced fallback structure detection with better chapter naming
async function detectBookStructureFallback(text) {
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
    { pattern: /^Chapter\s+(\d+|[IVXLC]+)(?:[:.]\s*|\s+)(.*)$/i, priority: 1, requiresFollowingContent: true },  // "Chapter 1: Title"
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