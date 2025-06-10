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

// AI-powered structure detection with line-by-line semantic understanding
async function detectBookStructureWithAI(text) {
  if (!openai) {
    console.log('OpenAI not available, using fallback structure detection');
    return detectBookStructureFallback(text);
  }

  try {
    console.log(`Starting line-by-line semantic analysis for ${text.length} characters`);
    
    // PHASE 1: Line-by-Line Semantic Analysis
    console.log('Phase 1: Performing line-by-line semantic analysis...');
    const semanticStructure = await performSemanticAnalysis(text);
    
    // PHASE 2: Document Structure Understanding
    console.log('Phase 2: Understanding overall document structure...');
    const documentStructure = await analyzeDocumentStructure(semanticStructure);
    
    // PHASE 3: Content Organization & Validation
    console.log('Phase 3: Organizing and validating content...');
    const finalStructure = await organizeAndValidateContent(semanticStructure, documentStructure, text);
    
    console.log(`Semantic analysis complete: Found ${finalStructure.chapters.length} content sections`);
    return finalStructure;
    
  } catch (error) {
    console.error('Semantic analysis failed:', error.message);
    
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log('API quota exceeded, using enhanced fallback');
    }
    
    return detectBookStructureFallback(text);
  }
}

// PHASE 1: Perform line-by-line semantic analysis
async function performSemanticAnalysis(text) {
  const lines = text.split('\n');
  const semanticLines = [];
  
  // Process lines in chunks for AI analysis
  const chunkSize = 50; // Analyze 50 lines at a time
  const chunks = [];
  
  for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize));
  }
  
  console.log(`Processing ${chunks.length} chunks of ${chunkSize} lines each...`);
  
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    const chunkText = chunk.join('\n');
    
    try {
      const analysisPrompt = `You are analyzing lines from a book to understand their semantic meaning. Analyze each line and identify what type of content it is.

LINES TO ANALYZE (Line ${chunkIndex * chunkSize + 1} to ${chunkIndex * chunkSize + chunk.length}):
${chunkText}

For EACH line, determine its semantic type:

CONTENT TYPES:
- "copyright": Copyright notices, publication info, ISBN, publisher details
- "title_page": Book title, subtitle, author name, main title page elements
- "dedication": Dedication text to someone
- "toc_header": "Table of Contents", "Contents", etc.
- "toc_entry": Chapter/section entries in table of contents with page numbers
- "chapter_header": Chapter titles, lesson titles, section headers
- "subheader": Subsection titles, part headers
- "paragraph": Regular body text, narrative content
- "quote": Quoted text, dialogue, citations
- "question": Questions, numbered questions, Q&A
- "exercise": Exercises, activities, practice problems
- "instruction": Instructions, steps, how-to content
- "list_item": Bulleted lists, numbered lists
- "blank": Empty lines, whitespace
- "metadata": Page numbers, headers, footers
- "acknowledgments": Acknowledgments, thanks
- "preface": Preface, foreword, introduction
- "appendix": Appendix content, references
- "glossary": Glossary entries, definitions
- "answer": Answers, solutions to questions

Return JSON array with one object per line:
[
  {
    "line_number": 1,
    "content": "actual line text",
    "semantic_type": "copyright/title_page/chapter_header/paragraph/etc",
    "confidence": "high/medium/low",
    "notes": "brief explanation why this classification"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text.`;

      const response = await makeRateLimitedRequest(() => openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a document semantic analyzer. Analyze each line carefully and return only valid JSON."
          },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0,
        max_tokens: 4000
      }));

      const chunkAnalysis = JSON.parse(
        response.choices[0].message.content.trim().replace(/```json\n?|```\n?/g, '')
      );
      
      // Add to semantic lines with proper line numbers
      chunkAnalysis.forEach((lineAnalysis, index) => {
        semanticLines.push({
          ...lineAnalysis,
          line_number: chunkIndex * chunkSize + index + 1,
          original_content: chunk[index] || ''
        });
      });
      
      console.log(`Processed chunk ${chunkIndex + 1}/${chunks.length}`);
      
      // Add delay to avoid rate limiting
      if (chunkIndex < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (e) {
      console.log(`Failed to analyze chunk ${chunkIndex + 1}, using heuristic analysis:`, e.message);
      
      // Fallback heuristic analysis for this chunk
      chunk.forEach((line, index) => {
        semanticLines.push({
          line_number: chunkIndex * chunkSize + index + 1,
          content: line,
          original_content: line,
          semantic_type: classifyLineHeuristically(line),
          confidence: 'medium',
          notes: 'heuristic classification'
        });
      });
    }
  }
  
  console.log(`Semantic analysis complete: ${semanticLines.length} lines analyzed`);
  return semanticLines;
}

// Enhanced heuristic line classification when AI is not available
function classifyLineHeuristically(line) {
  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();
  
  // Empty lines
  if (!trimmed) return 'blank';
  
  // Copyright and legal information
  if (lower.includes('copyright') || lower.includes('©') || lower.includes('(c)') || 
      lower.includes('isbn') || lower.includes('publisher') || lower.includes('published by') ||
      lower.includes('all rights reserved') || lower.includes('no part of this') ||
      lower.match(/^\d{4}\s+by/) || lower.includes('printing')) {
    return 'copyright';
  }
  
  // Title page elements
  if ((trimmed.length < 100 && trimmed.length > 5) && 
      (/^[A-Z][A-Z\s:]+$/.test(trimmed) || // ALL CAPS titles
       (trimmed.split(' ').length <= 8 && /^[A-Z]/.test(trimmed) && !trimmed.endsWith('.')))) {
    // Check if it's likely a title vs header
    if (lower.includes('chapter') || lower.includes('lesson') || lower.includes('part')) {
      return 'chapter_header';
    }
    return 'title_page';
  }
  
  // Table of Contents
  if (lower.includes('table of contents') || lower === 'contents' || 
      lower.includes('index') && trimmed.length < 20) {
    return 'toc_header';
  }
  
  // TOC entries (lines with page numbers at the end)
  if (trimmed.match(/.*\.\.*\s*\d+\s*$/) || // "Chapter 1....... 5"
      trimmed.match(/.*\s+\d+\s*$/) && trimmed.includes('.')) { // "Chapter 1    5"
    return 'toc_entry';
  }
  
  // Chapter and section headers
  if (trimmed.match(/^(Chapter|Lesson|Unit|Section|Part)\s+(\d+|[IVXLC]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)[\s:.-]*/i)) {
    return 'chapter_header';
  }
  
  // Numbered sections
  if (trimmed.match(/^\d+\.\s+[A-Z]/) && trimmed.length < 100) {
    return 'subheader';
  }
  
  // Questions (various patterns)
  if (trimmed.match(/^\d+\.\s*.{10,}\?/) || // "1. What is...?"
      trimmed.match(/^Q\d+[\.:]\s*./) || // "Q1: ..." or "Q1. ..."
      trimmed.match(/^\d+\)\s*.{10,}\?/) || // "1) What is...?"
      lower.match(/^(what|how|why|when|where|which|who)\b.*\?/) || // Question words
      lower.includes('true or false') || lower.includes('multiple choice') ||
      trimmed.match(/^[A-D]\)\s+/) || // Multiple choice options
      lower.includes('answer:') || lower.includes('answers:')) {
    return 'question';
  }
  
  // Exercises and activities
  if (lower.includes('exercise') && (trimmed.match(/^\d+/) || lower.includes('exercise'))) {
    return 'exercise';
  }
  if (lower.includes('activity') || lower.includes('practice') || 
      lower.includes('try this') || lower.includes('complete the')) {
    return 'exercise';
  }
  
  // Instructions and steps
  if (trimmed.match(/^(Step\s+\d+|First|Second|Third|Next|Finally|Then)[\s:.-]/i) ||
      lower.includes('follow these') || lower.includes('instructions') ||
      trimmed.match(/^\d+\.\s+(Do|Try|Complete|Follow|Find|List)/i)) {
    return 'instruction';
  }
  
  // Lists
  if (trimmed.match(/^[-•*]\s+/) || // Bulleted lists
      trimmed.match(/^[a-z]\)\s+/) || // a) b) c) lists
      trimmed.match(/^[ivx]+\.\s+/i)) { // Roman numeral lists
    return 'list_item';
  }
  
  // Quotes and dialogue
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith('"') || trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      trimmed.match(/^".*"$/) ||
      trimmed.includes('" said') || trimmed.includes('" asked') ||
      trimmed.includes('said "') || trimmed.includes('asked "')) {
    return 'quote';
  }
  
  // Special sections
  if (lower.includes('dedication') || (lower.includes('to my') || lower.includes('for my')) && trimmed.length < 100) {
    return 'dedication';
  }
  if (lower.includes('acknowledgment') || lower.includes('thanks to') || 
      lower.includes('grateful to') || lower.includes('special thanks')) {
    return 'acknowledgments';
  }
  if (lower.includes('preface') || lower.includes('foreword') || 
      lower.includes('introduction') && trimmed.length < 50) {
    return 'preface';
  }
  if (lower.includes('appendix') || lower.includes('references') || 
      lower.includes('bibliography') || lower.includes('glossary')) {
    return 'appendix';
  }
  
  // Page numbers and metadata
  if (trimmed.match(/^\d+$/) || // Just a number
      trimmed.match(/^page\s+\d+/i) ||
      trimmed.match(/^\d+\s*[-–—]\s*\d+$/) || // Page ranges
      (trimmed.length < 10 && trimmed.match(/^\d/))) {
    return 'metadata';
  }
  
  // Answers
  if (lower.includes('answer:') || lower.includes('solution:') || 
      lower.includes('answers:') || trimmed.match(/^Answer\s+\d+/i)) {
    return 'answer';
  }
  
  // Fill-in-the-blank patterns
  if (trimmed.match(/_{3,}/) || // Underscores for blanks
      trimmed.includes('_____') ||
      trimmed.match(/\[\s*\]/) || // Empty brackets
      trimmed.includes('(blank)')) {
    return 'exercise';
  }
  
  // Subheaders (short lines that look like headers)
  if (trimmed.length < 80 && trimmed.length > 10 && 
      /^[A-Z]/.test(trimmed) && !trimmed.endsWith('.') && 
      !trimmed.endsWith('?') && !trimmed.endsWith('!') &&
      trimmed.split(' ').length <= 8) {
    return 'subheader';
  }
  
  // Regular paragraphs (default)
  if (trimmed.length > 20 && 
      (trimmed.includes('.') || trimmed.includes(',') || trimmed.includes(';'))) {
    return 'paragraph';
  }
  
  // Short text (might be headers or metadata)
  if (trimmed.length <= 20) {
    return 'metadata';
  }
  
  // Default to paragraph
  return 'paragraph';
}

// PHASE 2: Analyze overall document structure
async function analyzeDocumentStructure(semanticLines) {
  // Group semantic lines by type
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
    preface: [],
    acknowledgments: [],
    appendix: [],
    glossary: [],
    answer: []
  };
  
  semanticLines.forEach(line => {
    const type = line.semantic_type;
    if (groupedContent[type]) {
      groupedContent[type].push(line);
    }
  });
  
  // Analyze document structure with AI
  const structurePrompt = `Based on the semantic analysis of this document, determine its overall structure and organization:

DOCUMENT ANALYSIS:
- Copyright lines: ${groupedContent.copyright.length}
- Title page elements: ${groupedContent.title_page.length}  
- Dedication: ${groupedContent.dedication.length}
- Table of contents: ${groupedContent.toc_header.length} headers, ${groupedContent.toc_entry.length} entries
- Chapter headers: ${groupedContent.chapter_header.length}
- Paragraphs: ${groupedContent.paragraph.length}
- Questions: ${groupedContent.question.length}
- Exercises: ${groupedContent.exercise.length}
- Quotes: ${groupedContent.quote.length}

SAMPLE CHAPTER HEADERS:
${groupedContent.chapter_header.slice(0, 5).map(h => h.content).join('\n')}

SAMPLE TOC ENTRIES:
${groupedContent.toc_entry.slice(0, 5).map(t => t.content).join('\n')}

Determine:
1. Document type (novel, textbook, workbook, manual, etc.)
2. Has formal structure (title page, TOC, etc.)
3. Main content organization
4. Special elements present

Return JSON:
{
  "document_type": "specific type",
  "has_title_page": true/false,
  "has_table_of_contents": true/false,
  "has_copyright": true/false,
  "has_dedication": true/false,
  "main_content_type": "chapters/lessons/stories/sections",
  "total_chapters": number,
  "has_questions": true/false,
  "has_exercises": true/false,
  "has_interactive_elements": true/false,
  "organization_style": "formal/informal/mixed",
  "estimated_book_length": "short/medium/long",
  "special_sections": ["list of special sections found"]
}`;

  try {
    const response = await makeRateLimitedRequest(() => openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a document structure analyst. Analyze the semantic content and return JSON only."
        },
        { role: "user", content: structurePrompt }
      ],
      temperature: 0,
      max_tokens: 800
    }));

    const documentStructure = JSON.parse(
      response.choices[0].message.content.trim().replace(/```json\n?|```\n?/g, '')
    );
    
    // Add the grouped content for reference
    documentStructure.grouped_content = groupedContent;
    
    return documentStructure;
    
  } catch (e) {
    console.log('Failed to analyze document structure, using heuristic:', e.message);
    
    return analyzeDocumentStructureHeuristically(groupedContent);
  }
}

// Enhanced heuristic document structure analysis
function analyzeDocumentStructureHeuristically(groupedContent) {
  // Determine document type based on content patterns
  let documentType = 'general';
  
  if (groupedContent.exercise.length > 10 || groupedContent.question.length > 20) {
    documentType = 'workbook';
  } else if (groupedContent.question.length > 5 || groupedContent.instruction.length > 10) {
    documentType = 'textbook';
  } else if (groupedContent.quote.length > groupedContent.paragraph.length * 0.1) {
    documentType = 'novel';
  } else if (groupedContent.instruction.length > 5) {
    documentType = 'manual';
  }
  
  // Analyze structure complexity
  const totalLines = Object.values(groupedContent).reduce((sum, arr) => sum + arr.length, 0);
  const organizationStyle = groupedContent.chapter_header.length > 3 ? 'formal' : 
                          groupedContent.subheader.length > 5 ? 'structured' : 'informal';
  
  const estimatedLength = totalLines > 1000 ? 'long' : totalLines > 300 ? 'medium' : 'short';
  
  // Identify special sections
  const specialSections = [];
  if (groupedContent.dedication.length > 0) specialSections.push('dedication');
  if (groupedContent.acknowledgments.length > 0) specialSections.push('acknowledgments');
  if (groupedContent.preface.length > 0) specialSections.push('preface');
  if (groupedContent.appendix.length > 0) specialSections.push('appendix');
  if (groupedContent.toc_entry.length > 0) specialSections.push('table_of_contents');
  
  return {
    document_type: documentType,
    has_title_page: groupedContent.title_page.length > 0,
    has_table_of_contents: groupedContent.toc_entry.length > 3,
    has_copyright: groupedContent.copyright.length > 0,
    has_dedication: groupedContent.dedication.length > 0,
    main_content_type: documentType === 'novel' ? 'chapters' : 
                      documentType === 'textbook' ? 'lessons' : 
                      documentType === 'workbook' ? 'activities' : 'sections',
    total_chapters: Math.max(groupedContent.chapter_header.length, 3),
    has_questions: groupedContent.question.length > 0,
    has_exercises: groupedContent.exercise.length > 0,
    has_interactive_elements: groupedContent.question.length > 0 || groupedContent.exercise.length > 0,
    organization_style: organizationStyle,
    estimated_book_length: estimatedLength,
    special_sections: specialSections,
    grouped_content: groupedContent,
    content_confidence: 'heuristic-enhanced'
  };
}

// PHASE 3: Organize and validate final content structure
async function organizeAndValidateContent(semanticLines, documentStructure, originalText) {
  const finalStructure = {
    title: 'Untitled Book',
    chapters: [],
    metadata: {
      documentType: documentStructure.document_type,
      hasTitle: documentStructure.has_title_page,
      hasTOC: documentStructure.has_table_of_contents,
      hasCopyright: documentStructure.has_copyright,
      hasDedication: documentStructure.has_dedication,
      totalChapters: documentStructure.total_chapters,
      analysisMethod: 'semantic-line-by-line',
      organizationStyle: documentStructure.organization_style
    },
    bookAnalysis: {
      genre: documentStructure.document_type,
      hasInteractiveElements: documentStructure.has_interactive_elements,
      contentOrganization: documentStructure.main_content_type,
      estimatedLength: documentStructure.estimated_book_length
    },
    formatRequirements: {
      needsQuestionFormatting: documentStructure.has_questions,
      needsExerciseSpacing: documentStructure.has_exercises,
      needsTitlePage: documentStructure.has_title_page,
      needsTOC: documentStructure.has_table_of_contents,
      needsCopyright: documentStructure.has_copyright
    },
    semanticStructure: {
      totalLines: semanticLines.length,
      contentBreakdown: getContentBreakdown(semanticLines)
    }
  };
  
  // Extract title from title page elements
  const titleElements = documentStructure.grouped_content.title_page;
  if (titleElements.length > 0) {
    finalStructure.title = titleElements[0].content.trim();
  }
  
  // Organize content into chapters/sections
  const chapterHeaders = documentStructure.grouped_content.chapter_header;
  
  if (chapterHeaders.length > 0) {
    // Use detected chapter structure
    for (let i = 0; i < chapterHeaders.length; i++) {
      const currentHeader = chapterHeaders[i];
      const nextHeader = chapterHeaders[i + 1];
      
      const startLine = currentHeader.line_number;
      const endLine = nextHeader ? nextHeader.line_number : semanticLines.length;
      
      // Extract content between this chapter and next
      const chapterContent = semanticLines
        .slice(startLine - 1, endLine - 1)
        .map(line => line.original_content)
        .join('\n');
      
      // Analyze this chapter's special elements
      const chapterSemantics = semanticLines.slice(startLine - 1, endLine - 1);
      const chapterAnalysis = analyzeChapterContent(chapterSemantics);
      
      finalStructure.chapters.push({
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
        semanticBreakdown: chapterAnalysis.breakdown
      });
    }
  } else {
    // No clear chapters found, create intelligent sections
    const contentLines = semanticLines.filter(line => 
      ['paragraph', 'quote', 'question', 'exercise'].includes(line.semantic_type)
    );
    
    const sectionSize = Math.floor(contentLines.length / 3); // Create 3 sections
    
    for (let i = 0; i < 3; i++) {
      const startIndex = i * sectionSize;
      const endIndex = i === 2 ? contentLines.length : (i + 1) * sectionSize;
      
      const sectionContent = contentLines
        .slice(startIndex, endIndex)
        .map(line => line.original_content)
        .join('\n');
      
      const sectionSemantics = contentLines.slice(startIndex, endIndex);
      const sectionAnalysis = analyzeChapterContent(sectionSemantics);
      
      finalStructure.chapters.push({
        id: `section-${i + 1}`,
        title: `Section ${i + 1}`,
        content: sectionContent.trim(),
        level: 1,
        type: 'section',
        hasQuestions: sectionAnalysis.hasQuestions,
        hasExercises: sectionAnalysis.hasExercises,
        specialElements: sectionAnalysis.specialElements,
        semanticBreakdown: sectionAnalysis.breakdown
      });
    }
  }
  
  return finalStructure;
}

// Analyze individual chapter content
function analyzeChapterContent(chapterSemantics) {
  const breakdown = {};
  const specialElements = [];
  
  chapterSemantics.forEach(line => {
    const type = line.semantic_type;
    breakdown[type] = (breakdown[type] || 0) + 1;
  });
  
  const hasQuestions = (breakdown.question || 0) > 0;
  const hasExercises = (breakdown.exercise || 0) > 0;
  const hasQuotes = (breakdown.quote || 0) > 0;
  const hasInstructions = (breakdown.instruction || 0) > 0;
  
  if (hasQuestions) specialElements.push('questions');
  if (hasExercises) specialElements.push('exercises');
  if (hasQuotes) specialElements.push('quotes');
  if (hasInstructions) specialElements.push('instructions');
  
  return {
    hasQuestions,
    hasExercises,
    hasQuotes,
    hasInstructions,
    specialElements,
    breakdown
  };
}

// Get overall content breakdown
function getContentBreakdown(semanticLines) {
  const breakdown = {};
  
  semanticLines.forEach(line => {
    const type = line.semantic_type;
    breakdown[type] = (breakdown[type] || 0) + 1;
  });
  
  return breakdown;
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