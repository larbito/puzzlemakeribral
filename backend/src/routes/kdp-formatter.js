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

// Intelligent preprocessing to remove page headers/footers and repetitive elements
function preprocessDocumentText(text) {
  console.log('Preprocessing document to remove page headers/footers and repetitive elements...');
  
  const lines = text.split('\n');
  const cleanedLines = [];
  
  // Step 1: Identify repetitive elements (headers/footers)
  const repetitiveElements = identifyRepetitiveElements(lines);
  
  console.log(`Found ${repetitiveElements.length} repetitive patterns:`);
  repetitiveElements.forEach(elem => {
    console.log(`  - "${elem.text}" (appears ${elem.frequency} times)`);
  });
  
  // Step 2: Remove identified repetitive elements
  let removedCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip completely empty lines initially
    if (!line) {
      cleanedLines.push(lines[i]);
      continue;
    }
    
    // Check if this line is a repetitive element (header/footer)
    let isRepetitive = false;
    for (const repetitivePattern of repetitiveElements) {
      // For regular repetitive elements, check exact match
      if (repetitivePattern.type === 'repetitive' || repetitivePattern.type === 'page_pattern') {
        if (line.toLowerCase().includes(repetitivePattern.text.toLowerCase()) ||
            repetitivePattern.text.toLowerCase().includes(line.toLowerCase())) {
          isRepetitive = true;
          console.log(`Removing ${repetitivePattern.type} at line ${i + 1}: "${line}"`);
          removedCount++;
          break;
        }
      }
      
      // For header/footer patterns, check if this line matches any of the examples
      if (repetitivePattern.type === 'header_footer_pattern') {
        const lineNormalized = line.toLowerCase();
        
        // Check if this line contains the pattern key
        if (lineNormalized.includes(repetitivePattern.text)) {
          isRepetitive = true;
          console.log(`Removing header/footer pattern at line ${i + 1}: "${line}"`);
          removedCount++;
          break;
        }
        
        // Also check against example patterns for more precise matching
        for (const example of repetitivePattern.examples || []) {
          if (line.toLowerCase() === example.toLowerCase()) {
            isRepetitive = true;
            console.log(`Removing exact header/footer match at line ${i + 1}: "${line}"`);
            removedCount++;
            break;
          }
        }
        
        if (isRepetitive) break;
      }
    }
    
    // Check for common page artifacts
    if (!isRepetitive) {
      const artifactResult = isPageArtifact(line, i, lines);
      if (artifactResult) {
        console.log(`Removing page artifact at line ${i + 1}: "${line}"`);
        isRepetitive = true;
        removedCount++;
      }
    }
    
    // Only add non-repetitive, non-artifact lines
    if (!isRepetitive) {
      cleanedLines.push(lines[i]);
    }
  }
  
  // Step 3: Clean up excessive blank lines after removal
  const finalText = cleanedLines.join('\n')
    .replace(/\n{5,}/g, '\n\n\n') // Max 3 consecutive empty lines
    .trim();
  
  const originalLineCount = lines.length;
  const cleanedLineCount = cleanedLines.length;
  
  console.log(`Preprocessing complete: Removed ${removedCount} repetitive/artifact lines (${originalLineCount} → ${cleanedLineCount})`);
  console.log(`Text length: ${text.length} → ${finalText.length} characters`);
  
  return finalText;
}

// Identify repetitive elements that appear multiple times (likely headers/footers)
function identifyRepetitiveElements(lines) {
  const lineFrequency = new Map();
  const repetitiveElements = [];
  const linePositions = new Map(); // Track where lines appear
  
  // Count frequency of each non-empty line and track positions
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length > 2 && trimmed.length < 150) { // Focus on potential header/footer length
      const normalized = trimmed.toLowerCase();
      
      // Track frequency
      lineFrequency.set(normalized, (lineFrequency.get(normalized) || 0) + 1);
      
      // Track positions
      if (!linePositions.has(normalized)) {
        linePositions.set(normalized, []);
      }
      linePositions.get(normalized).push(i);
    }
  }
  
  // Identify lines that appear multiple times (likely headers/footers)
  for (const [text, frequency] of lineFrequency.entries()) {
    const positions = linePositions.get(text);
    
    if (frequency >= 3) { // Appears 3+ times = likely repetitive
      // Check if positions suggest page header/footer pattern
      const isRegularPattern = isRegularPagePattern(positions, lines.length);
      
      // Additional checks to avoid removing legitimate repeated content
      if (isLikelyHeaderFooter(text) || isRegularPattern) {
        repetitiveElements.push({
          text: text,
          frequency: frequency,
          positions: positions,
          type: isRegularPattern ? 'page_pattern' : 'repetitive'
        });
        console.log(`Identified ${isRegularPattern ? 'page pattern' : 'repetitive'} element: "${text}" (appears ${frequency} times)`);
      }
    }
  }
  
  // Also detect patterns like "Author Name - Page X" or "Book Title | Chapter Y"
  const headerFooterPatterns = detectHeaderFooterPatterns(lines);
  repetitiveElements.push(...headerFooterPatterns);
  
  return repetitiveElements;
}

// Check if positions suggest a regular page header/footer pattern
function isRegularPagePattern(positions, totalLines) {
  if (positions.length < 3) return false;
  
  // Check if elements appear at regular intervals (suggesting page breaks)
  const intervals = [];
  for (let i = 1; i < positions.length; i++) {
    intervals.push(positions[i] - positions[i-1]);
  }
  
  // If intervals are roughly similar, it's likely a page pattern
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  
  // If standard deviation is low relative to average, it's a regular pattern
  return stdDev < avgInterval * 0.5 && avgInterval > 10; // Regular pattern with reasonable spacing
}

// Detect header/footer patterns like "Author - Page 5" or "Book Title | Chapter 2"
function detectHeaderFooterPatterns(lines) {
  const patterns = [];
  const headerFooterRegexes = [
    /^(.+)\s*[-–—]\s*page\s*\d+\s*$/i,          // "Author Name - Page 5"
    /^(.+)\s*[-–—]\s*\d+\s*$/,                   // "Book Title - 23"
    /^(.+)\s*\|\s*(.+)$/,                        // "Title | Chapter"
    /^page\s*\d+\s*[-–—]\s*(.+)$/i,             // "Page 5 - Book Title"
    /^\d+\s*[-–—]\s*(.+)$/,                      // "23 - Title"
    /^(.+)\s*chapter\s*\d+/i,                    // "Book Title Chapter 5"
    /^chapter\s*\d+\s*[-–—]\s*(.+)/i            // "Chapter 5 - Title"
  ];
  
  for (const regex of headerFooterRegexes) {
    const matchingLines = new Map();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(regex);
      
      if (match) {
        // Extract the non-page/chapter part as the key
        const key = match[1] ? match[1].trim().toLowerCase() : line.toLowerCase();
        
        if (!matchingLines.has(key)) {
          matchingLines.set(key, []);
        }
        matchingLines.get(key).push({ line: line, position: i });
      }
    }
    
    // Add patterns that appear multiple times
    for (const [key, occurrences] of matchingLines.entries()) {
      if (occurrences.length >= 3) {
        patterns.push({
          text: key,
          frequency: occurrences.length,
          positions: occurrences.map(occ => occ.position),
          type: 'header_footer_pattern',
          examples: occurrences.slice(0, 3).map(occ => occ.line)
        });
        console.log(`Detected header/footer pattern: "${key}" (${occurrences.length} variations)`);
      }
    }
  }
  
  return patterns;
}

// Check if a repeated line is likely a header/footer vs legitimate content
function isLikelyHeaderFooter(text) {
  const lower = text.toLowerCase();
  
  // Likely headers/footers contain:
  // - Author names (often just 2-3 words)
  // - Book titles (but not super long)
  // - Publisher info
  // - Page indicators
  // - Chapter references
  
  // Skip if it looks like a chapter title or important content
  if (lower.includes('chapter ') || lower.includes('section ') || 
      lower.includes('part ') || lower.includes('lesson ')) {
    return false;
  }
  
  // Skip if it looks like a question or substantial content
  if (lower.includes('?') || lower.includes('what ') || lower.includes('how ')) {
    return false;
  }
  
  // Likely header/footer patterns
  return (
    // Short author-like names (2-4 words, proper case)
    (text.split(' ').length >= 2 && text.split(' ').length <= 4 && /^[A-Z]/.test(text)) ||
    // Contains publishing keywords
    lower.includes('copyright') || lower.includes('published') || 
    lower.includes('edition') || lower.includes('press') ||
    // Short title-like phrases
    (text.length < 50 && text.split(' ').length <= 6 && /^[A-Z]/.test(text)) ||
    // Page number patterns
    /^\d+$/.test(text) || lower.includes('page ') ||
    // Common header/footer elements
    lower.includes('continued') || lower.includes('chapter') && text.length < 30
  );
}

// Check if an individual line is a page artifact
function isPageArtifact(line, lineIndex, allLines) {
  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();
  
  // Page numbers (standalone numbers)
  if (/^\d+$/.test(trimmed) && trimmed.length <= 3) {
    return true;
  }
  
  // Page indicators
  if (lower.match(/^page\s+\d+/) || lower.match(/^\d+\s*[-–—]\s*\d+$/)) {
    return true;
  }
  
  // Very short lines that appear isolated (likely artifacts)
  if (trimmed.length <= 3) {
    return true;
  }
  
  // Lines that are just initials or very short names in isolation
  if (trimmed.length <= 15 && /^[A-Z][a-z]*\s*[A-Z]?[a-z]*$/.test(trimmed)) {
    // Check if surrounded by empty lines (isolated = likely header/footer)
    const prevLine = lineIndex > 0 ? allLines[lineIndex - 1].trim() : '';
    const nextLine = lineIndex < allLines.length - 1 ? allLines[lineIndex + 1].trim() : '';
    
    if (!prevLine && !nextLine) {
      return true; // Isolated short text = likely artifact
    }
  }
  
  return false;
}

// AI-powered structure detection with complete text extraction first
async function detectBookStructureWithAI(text) {
  console.log(`Starting comprehensive analysis for ${text.length} characters`);
  
  // PHASE 1: We already have the complete raw text extracted
  console.log('Phase 1: Complete text extraction - DONE');
  console.log(`Extracted ${text.length} characters of raw content`);
  
  // PHASE 1.5: Intelligent preprocessing to remove page artifacts
  console.log('Phase 1.5: Preprocessing to remove page headers/footers...');
  const cleanedText = preprocessDocumentText(text);
  console.log(`Preprocessing complete: ${text.length} → ${cleanedText.length} characters`);
  
  // PHASE 2: Give the cleaned text to AI for line-by-line semantic understanding
  console.log('Phase 2: AI semantic understanding of cleaned content...');
  const intelligentAnalysis = await performIntelligentTextAnalysis(cleanedText);
  
  // PHASE 3: Structure the results for formatting
  console.log('Phase 3: Structuring results for KDP formatting...');
  const finalStructure = await organizeContentForKDP(intelligentAnalysis, cleanedText);
  
  // Add both raw and cleaned text to the result for reference
  finalStructure.rawText = text;
  finalStructure.cleanedText = cleanedText;
  
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
    console.log('Performing comprehensive single-pass document analysis...');
    
    // Simplified but more effective single analysis
    const analysisPrompt = `Analyze this complete document for professional book formatting. 

DOCUMENT TEXT:
"""
${completeText}
"""

Extract and analyze:

1. METADATA:
- Title: [exact title found]
- Author: [exact author found]
- Document type: [novel/textbook/manual/etc]

2. STRUCTURE:
- Main sections/chapters found
- Table of contents if present
- Content organization

3. FORMATTING NEEDS:
- Questions or exercises present?
- Special elements (quotes, lists, etc)?
- Professional formatting requirements

Respond in this format:

TITLE: [title or "Not found"]
AUTHOR: [author or "Not found"]  
TYPE: [document type]
CHAPTERS: [list main sections found]
STRUCTURE: [describe organization]
ELEMENTS: [special content types found]
RECOMMENDATIONS: [formatting guidance]

Be specific about what you actually see in the document.`;

    const response = await makeRateLimitedRequest(() => openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a document analyst who extracts structure and content information for professional formatting. Be precise and only describe what you actually see."
        },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0,
      max_tokens: 2000
    }));

    const analysis = response.choices[0].message.content;
    console.log('AI analysis completed successfully');
    
    // Create simple semantic structure based on analysis and heuristics
    const semanticStructure = createSimpleSemanticStructure(completeText, analysis);
    
    return {
      aiAnalysis: analysis,
      semanticStructure: semanticStructure,
      method: 'simplified-ai-analysis'
    };
    
  } catch (error) {
    console.error('AI analysis failed:', error.message);
    console.log('Falling back to enhanced heuristic analysis');
    return performEnhancedHeuristicAnalysis(completeText);
  }
}

// Create simple semantic structure without complex chunking
function createSimpleSemanticStructure(text, aiAnalysis) {
  console.log('Creating semantic structure from AI analysis...');
  
  const lines = text.split('\n');
  
  // Extract key info from AI analysis
  const titleMatch = aiAnalysis.match(/TITLE:\s*(.+)/i);
  const authorMatch = aiAnalysis.match(/AUTHOR:\s*(.+)/i);
  const chaptersMatch = aiAnalysis.match(/CHAPTERS:\s*(.+)/i);
  
  const detectedTitle = titleMatch && !titleMatch[1].includes('Not found') ? titleMatch[1].trim() : null;
  const detectedAuthor = authorMatch && !authorMatch[1].includes('Not found') ? authorMatch[1].trim() : null;
  const hasChapters = chaptersMatch && !chaptersMatch[1].toLowerCase().includes('none');
  
  console.log('AI detected:', { title: detectedTitle, author: detectedAuthor, hasChapters });
  
  // Classify lines with AI insights
  const semanticLines = lines.map((line, index) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      return {
        line_number: index + 1,
        content: line,
        semantic_type: 'blank',
        confidence: 'high',
        analysis_method: 'simple_ai_guided'
      };
    }
    
    // Enhanced classification using AI insights
    let semanticType = classifyLineHeuristically(line);
    let confidence = 'medium';
    
    // Use AI insights to improve classification
    if (detectedTitle && trimmed.toLowerCase().includes(detectedTitle.toLowerCase()) && index < 50) {
      semanticType = 'title_page';
      confidence = 'high';
    } else if (detectedAuthor && trimmed.toLowerCase().includes(detectedAuthor.toLowerCase()) && index < 50) {
      semanticType = 'title_page';
      confidence = 'high';
    }
    
    return {
      line_number: index + 1,
      content: line,
      semantic_type: semanticType,
      confidence: confidence,
      analysis_method: 'simple_ai_guided'
    };
  });
  
  console.log(`Created semantic structure with ${semanticLines.length} lines`);
  return semanticLines;
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
  } else if (metadata.tocEntries && metadata.tocEntries.length > 0) {
    // Use TOC entries to create professional chapter structure
    finalStructure.chapters = createChaptersFromTOC(metadata.tocEntries, semanticStructure, originalText);
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
    recommendTOC: false,
    tocEntries: []
  };
  
  // Extract title using the new format
  const titleMatch = aiAnalysis.match(/TITLE:\s*(.+)/i);
  if (titleMatch && titleMatch[1].trim() !== 'Not found' && titleMatch[1].trim() !== '[Exact title from the document, or "Not found" if no clear title]') {
    metadata.title = titleMatch[1].trim().replace(/['"]/g, '');
  }
  
  // Extract author using the new format
  const authorMatch = aiAnalysis.match(/AUTHOR:\s*(.+)/i);
  if (authorMatch && authorMatch[1].trim() !== 'Not found' && authorMatch[1].trim() !== '[Exact author name from the document, or "Not found" if no clear author]') {
    metadata.author = authorMatch[1].trim().replace(/['"]/g, '');
  }
  
  // Extract subtitle
  const subtitleMatch = aiAnalysis.match(/SUBTITLE:\s*(.+)/i);
  if (subtitleMatch && subtitleMatch[1].trim() !== 'None' && subtitleMatch[1].trim() !== '[Subtitle if present, or "None"]') {
    metadata.subtitle = subtitleMatch[1].trim().replace(/['"]/g, '');
  }
  
  // Extract document type
  const docTypeMatch = aiAnalysis.match(/TYPE:\s*(.+)/i);
  if (docTypeMatch) {
    metadata.documentType = docTypeMatch[1].trim().toLowerCase();
  }
  
  // Check if TOC was found
  const tocFoundMatch = aiAnalysis.match(/TABLE_OF_CONTENTS_FOUND:\s*(Yes|No)/i);
  if (tocFoundMatch && tocFoundMatch[1].toLowerCase() === 'yes') {
    metadata.recommendTOC = true;
    
    // Extract TOC entries - now completely generic
    const tocSection = aiAnalysis.match(/TOC_ENTRIES:\s*([\s\S]*?)(?=CHAPTER_STRUCTURE:|SPECIAL_ELEMENTS:|$)/i);
    if (tocSection) {
      const tocLines = tocSection[1].split('\n');
      for (const line of tocLines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('[') && trimmedLine.length > 3) {
          // Remove leading numbers and clean up
          const cleanedEntry = trimmedLine.replace(/^\d+\.\s*/, '').trim();
          if (cleanedEntry.length > 0) {
            metadata.tocEntries.push({
              title: cleanedEntry,
              original: trimmedLine
            });
          }
        }
      }
    }
  }
  
  // Extract special elements counts
  const questionsMatch = aiAnalysis.match(/Questions:\s*(\d+)/i);
  if (questionsMatch) {
    metadata.questionsCount = parseInt(questionsMatch[1]);
  }
  
  const exercisesMatch = aiAnalysis.match(/Exercises:\s*(\d+)/i);
  if (exercisesMatch) {
    metadata.exercisesCount = parseInt(exercisesMatch[1]);
  }
  
  const listsMatch = aiAnalysis.match(/Lists:\s*(\d+)/i);
  if (listsMatch) {
    metadata.listsCount = parseInt(listsMatch[1]);
  }
  
  const quotesMatch = aiAnalysis.match(/Quotes:\s*(\d+)/i);
  if (quotesMatch) {
    metadata.quotesCount = parseInt(quotesMatch[1]);
  }
  
  // Check formatting recommendations
  if (aiAnalysis.toLowerCase().includes('needs title page: yes')) {
    metadata.recommendTitlePage = true;
  }
  
  if (aiAnalysis.toLowerCase().includes('needs table of contents: yes')) {
    metadata.recommendTOC = true;
  }
  
  if (aiAnalysis.toLowerCase().includes('chapter formatting needed: yes')) {
    metadata.needsChapterFormatting = true;
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

// Enhanced heuristic analysis for when AI is not available
function performEnhancedHeuristicAnalysis(text) {
  console.log('Performing enhanced heuristic analysis of complete text');
  
  // First preprocess the text to remove headers/footers
  const cleanedText = preprocessDocumentText(text);
  console.log(`Heuristic analysis: preprocessed ${text.length} → ${cleanedText.length} characters`);
  
  const lines = cleanedText.split('\n');
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

// Enhanced heuristic line classification when AI is not available
function classifyLineHeuristically(line) {
  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();
  
  // Empty lines
  if (!trimmed) return 'blank';
  
  // Copyright and legal information
  if (lower.includes('copyright') || lower.includes('©') || lower.includes('(c)') || 
      lower.includes('isbn') || lower.includes('publisher') || lower.includes('published by') ||
      lower.includes('all rights reserved') || lower.match(/^\d{4}\s+by/)) {
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
  
  // Questions (various patterns)
  if (trimmed.match(/^\d+\.\s*.{10,}\?/) || // "1. What is...?"
      trimmed.match(/^Q\d+[\.:]\s*./) || // "Q1: ..." or "Q1. ..."
      trimmed.match(/^\d+\)\s*.{10,}\?/) || // "1) What is...?"
      lower.match(/^(what|how|why|when|where|which|who)\b.*\?/) || // Question words
      lower.includes('true or false') || lower.includes('multiple choice') ||
      trimmed.match(/^[A-D]\)\s+/)) { // Multiple choice options
    return 'question';
  }
  
  // Exercises and activities
  if (lower.includes('exercise') || lower.includes('activity') || 
      lower.includes('practice') || lower.includes('try this') ||
      lower.includes('complete the')) {
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
      trimmed.includes('" said') || trimmed.includes('" asked') ||
      trimmed.includes('said "') || trimmed.includes('asked "')) {
    return 'quote';
  }
  
  // Special sections
  if (lower.includes('dedication') || 
      (lower.includes('to my') || lower.includes('for my')) && trimmed.length < 100) {
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

// Helper function to create chapters from extracted TOC entries
function createChaptersFromTOC(tocEntries, semanticStructure, originalText) {
  console.log(`Creating chapters from ${tocEntries.length} TOC entries`);
  
  const chapters = [];
  const lines = originalText.split('\n');
  
  for (let i = 0; i < tocEntries.length; i++) {
    const tocEntry = tocEntries[i];
    const nextTocEntry = tocEntries[i + 1];
    
    // Find the start of this chapter in the text using multiple strategies
    let startLineIndex = -1;
    let endLineIndex = lines.length;
    
    // Strategy 1: Look for exact title match
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex].trim();
      
      // Try exact match first
      if (line.toLowerCase() === tocEntry.title.toLowerCase()) {
        startLineIndex = lineIndex;
        break;
      }
      
      // Try partial match (line contains TOC title or vice versa)
      if (line.length > 5 && tocEntry.title.length > 5) {
        if (line.toLowerCase().includes(tocEntry.title.toLowerCase()) ||
            tocEntry.title.toLowerCase().includes(line.toLowerCase())) {
          // Make sure this isn't the TOC line itself
          const surroundingText = lines.slice(Math.max(0, lineIndex - 2), lineIndex + 3).join(' ').toLowerCase();
          if (!surroundingText.includes('contents') && !surroundingText.includes('table of')) {
            startLineIndex = lineIndex;
            break;
          }
        }
      }
    }
    
    // Strategy 2: Look for common chapter patterns if exact match failed
    if (startLineIndex === -1) {
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex].trim();
        
        // Look for chapter/section patterns
        const chapterPatterns = [
          new RegExp(`^(chapter|ch\\.?)\\s*${i + 1}`, 'i'),
          new RegExp(`^${i + 1}\\.\\s*`, 'i'),
          new RegExp(`^(part|section)\\s*${i + 1}`, 'i'),
          new RegExp(`^(lesson|unit)\\s*${i + 1}`, 'i')
        ];
        
        for (const pattern of chapterPatterns) {
          if (pattern.test(line)) {
            startLineIndex = lineIndex;
            break;
          }
        }
        
        if (startLineIndex !== -1) break;
      }
    }
    
    // Strategy 3: Use line position estimation if still not found
    if (startLineIndex === -1 && tocEntries.length > 1) {
      const estimatedPosition = Math.floor((lines.length / tocEntries.length) * i);
      startLineIndex = estimatedPosition;
    }
    
    // Find the end of this chapter
    if (startLineIndex !== -1 && nextTocEntry) {
      // Look for the start of the next chapter
      for (let lineIndex = startLineIndex + 10; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex].trim();
        
        // Try to find next chapter using same strategies
        if (line.toLowerCase() === nextTocEntry.title.toLowerCase() ||
            (line.length > 5 && nextTocEntry.title.length > 5 && 
             (line.toLowerCase().includes(nextTocEntry.title.toLowerCase()) ||
              nextTocEntry.title.toLowerCase().includes(line.toLowerCase())))) {
          endLineIndex = lineIndex;
          break;
        }
        
        // Look for next chapter patterns
        const nextChapterPatterns = [
          new RegExp(`^(chapter|ch\\.?)\\s*${i + 2}`, 'i'),
          new RegExp(`^${i + 2}\\.\\s*`, 'i'),
          new RegExp(`^(part|section)\\s*${i + 2}`, 'i')
        ];
        
        for (const pattern of nextChapterPatterns) {
          if (pattern.test(line)) {
            endLineIndex = lineIndex;
            break;
          }
        }
        
        if (endLineIndex < lines.length) break;
      }
    }
    
    // Extract content for this chapter
    let chapterContent = '';
    if (startLineIndex !== -1) {
      const chapterLines = lines.slice(startLineIndex, endLineIndex);
      chapterContent = chapterLines.join('\n').trim();
    }
    
    // If no content found, create a placeholder
    if (!chapterContent || chapterContent.length < 50) {
      chapterContent = `Content for "${tocEntry.title}" - Content extraction in progress. This section contains the material related to ${tocEntry.title}.`;
    }
    
    // Determine chapter type generically
    let chapterType = 'chapter';
    let specialElements = [];
    
    // Generic content analysis
    const contentLower = chapterContent.toLowerCase();
    if (contentLower.includes('question') || contentLower.includes('?')) {
      specialElements.push('questions');
    }
    if (contentLower.includes('exercise') || contentLower.includes('practice')) {
      specialElements.push('exercises');
    }
    if (contentLower.includes('"') || contentLower.includes('said') || contentLower.includes('told')) {
      specialElements.push('dialogue');
    }
    if (contentLower.includes('•') || contentLower.includes('- ') || contentLower.includes('1.') || contentLower.includes('2.')) {
      specialElements.push('lists');
    }
    
    chapters.push({
      id: `chapter-${i + 1}`,
      title: tocEntry.title,
      content: chapterContent,
      level: 1,
      type: chapterType,
      specialElements: specialElements,
      hasQuestions: specialElements.includes('questions'),
      hasExercises: specialElements.includes('exercises'),
      hasQuotes: specialElements.includes('dialogue'),
      wordCount: chapterContent.split(/\s+/).length,
      startLine: startLineIndex + 1,
      endLine: endLineIndex,
      extractionMethod: startLineIndex !== -1 ? 'found' : 'estimated'
    });
  }
  
  // If no chapters were successfully created, fall back to intelligent sections
  if (chapters.length === 0 || chapters.every(ch => ch.extractionMethod === 'estimated' && ch.content.length < 100)) {
    console.log('TOC-based chapter creation failed, falling back to intelligent sections');
    return createIntelligentSections(semanticStructure, { title: 'Extracted Content' });
  }
  
  console.log(`Successfully created ${chapters.length} chapters from TOC`);
  return chapters;
}

// Enhanced line-by-line semantic tagging based on AI analysis
async function performSemanticTagging(text, aiAnalysis) {
  const lines = text.split('\n');
  console.log(`Performing TRUE AI line-by-line semantic analysis on ${lines.length} lines`);
  
  if (!openai) {
    console.log('OpenAI not available, using heuristic line classification');
    return lines.map((line, index) => ({
      line_number: index + 1,
      content: line,
      semantic_type: line.trim() ? classifyLineHeuristically(line) : 'blank',
      confidence: 'medium'
    }));
  }

  try {
    const semanticLines = [];
    const chunkSize = 20; // Process 20 lines at a time for AI analysis
    
    // Process lines in chunks
    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize);
      const startLineNum = i + 1;
      
      console.log(`AI analyzing lines ${startLineNum} to ${startLineNum + chunk.length - 1}...`);
      
      try {
        const chunkAnalysis = await analyzeChunkWithAI(chunk, startLineNum, aiAnalysis);
        semanticLines.push(...chunkAnalysis);
        
        // Add delay to respect rate limits
        if (i + chunkSize < lines.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.log(`AI analysis failed for chunk ${Math.floor(i/chunkSize) + 1}, using heuristic fallback:`, error.message);
        
        // Fallback to heuristic analysis for this chunk
        const heuristicChunk = chunk.map((line, index) => ({
          line_number: startLineNum + index,
          content: line,
          semantic_type: line.trim() ? classifyLineHeuristically(line) : 'blank',
          confidence: 'medium',
          analysis_method: 'heuristic_fallback'
        }));
        
        semanticLines.push(...heuristicChunk);
      }
    }
    
    console.log(`Completed AI line-by-line analysis of ${semanticLines.length} lines`);
    return semanticLines;
    
  } catch (error) {
    console.error('Line-by-line AI analysis failed completely:', error.message);
    
    // Complete fallback to heuristic analysis
    return lines.map((line, index) => ({
      line_number: index + 1,
      content: line,
      semantic_type: line.trim() ? classifyLineHeuristically(line) : 'blank',
      confidence: 'medium',
      analysis_method: 'heuristic_complete_fallback'
    }));
  }
}

// AI-powered analysis of a chunk of lines
async function analyzeChunkWithAI(lines, startLineNum, documentContext) {
  const numberedLines = lines.map((line, index) => 
    `${startLineNum + index}: ${line}`
  ).join('\n');
  
  const prompt = `You are analyzing a document line by line. Here is the document context:

DOCUMENT CONTEXT:
${documentContext}

LINES TO ANALYZE (with line numbers):
${numberedLines}

For EACH line, determine its semantic type. Read each line carefully and classify it based on its content and purpose in the document.

SEMANTIC TYPES:
- "title_page": Main title, subtitle, author name on title page
- "copyright": Copyright notices, ISBN, publisher info, publication details
- "dedication": Dedication text
- "toc_header": "Table of Contents", "Contents", "Index" headers
- "toc_entry": Table of contents entries (chapter listings with page numbers)
- "chapter_header": Chapter titles, section headers, main divisions
- "subheader": Subsection titles, smaller headings
- "paragraph": Regular body text, narrative content
- "quote": Quoted text, dialogue, citations
- "question": Questions, numbered questions, Q&A
- "exercise": Exercises, activities, practice problems
- "instruction": Instructions, steps, how-to content
- "list_item": Bulleted or numbered list items
- "answer": Answers to questions, solutions
- "preface": Preface, foreword, introduction sections
- "acknowledgments": Acknowledgments, thanks
- "appendix": Appendix content, references, bibliography
- "metadata": Page numbers, headers, footers, publication info
- "blank": Empty lines

RESPOND WITH VALID JSON ONLY:
[
  {
    "line_number": 1,
    "content": "actual line content",
    "semantic_type": "classification",
    "confidence": "high/medium/low",
    "reasoning": "brief explanation"
  }
]

Analyze each line individually and return the JSON array.`;

  const response = await makeRateLimitedRequest(() => openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { 
        role: "system", 
        content: "You are a document semantic analyzer. Analyze each line carefully and return only valid JSON. Be precise in your classifications."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0,
    max_tokens: 2000
  }));

  let analysisResult;
  try {
    const responseText = response.choices[0].message.content.trim();
    // Clean up the response to ensure valid JSON
    const cleanedResponse = responseText.replace(/```json\n?|```\n?/g, '');
    analysisResult = JSON.parse(cleanedResponse);
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError.message);
    throw new Error('Invalid JSON response from AI');
  }

  // Validate and ensure we have results for all lines
  if (!Array.isArray(analysisResult) || analysisResult.length !== lines.length) {
    throw new Error(`AI returned ${analysisResult?.length || 0} results for ${lines.length} lines`);
  }

  return analysisResult.map((result, index) => ({
    line_number: startLineNum + index,
    content: lines[index],
    semantic_type: result.semantic_type || 'paragraph',
    confidence: result.confidence || 'medium',
    reasoning: result.reasoning || '',
    analysis_method: 'ai_powered'
  }));
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