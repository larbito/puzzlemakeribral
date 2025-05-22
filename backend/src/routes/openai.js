const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { OpenAI } = require('openai');

// Configure OpenAI API key from environment with fallback
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'fallback_key_for_local_development_only';

// Initialize the OpenAI client
let openai;
try {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
  console.log('OpenAI client initialized successfully');
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

/**
 * Middleware to check if OpenAI API key is configured
 */
const checkApiKey = (req, res, next) => {
  if (!openai) {
    console.error('OpenAI client not initialized');
    // Instead of failing, we'll use a mock response
    req.useLocalMock = true;
  } else if (OPENAI_API_KEY === 'fallback_key_for_local_development_only') {
    console.warn('Using fallback API key - responses will be mocked');
    req.useLocalMock = true;
  }
  next();
};

router.use(checkApiKey);

// Helper function to generate mock data for local development
const generateMockResponse = (endpoint, params) => {
  console.log(`Generating mock response for ${endpoint}`, params);
  
  switch (endpoint) {
    case 'generate-toc':
      return {
        success: true,
        chapters: [
          { id: '1', title: 'Introduction', content: '', wordCount: 0 },
          { id: '2', title: 'Chapter 1: Understanding the Basics', content: '', wordCount: 0 },
          { id: '3', title: 'Chapter 2: Key Concepts', content: '', wordCount: 0 },
          { id: '4', title: 'Chapter 3: Advanced Topics', content: '', wordCount: 0 },
          { id: '5', title: 'Chapter 4: Practical Applications', content: '', wordCount: 0 },
          { id: '6', title: 'Conclusion', content: '', wordCount: 0 }
        ]
      };
    case 'generate-book-proposal':
      return {
        success: true,
        proposal: {
          title: `The Complete Guide to ${params.bookSummary.split(' ').slice(0, 3).join(' ')}`,
          subtitle: `Master the Art of ${params.bookSummary.split(' ').slice(-3).join(' ')}`,
          description: `This comprehensive book explores ${params.bookSummary}. Written in a ${params.tone.toLowerCase()} tone for ${params.audience.toLowerCase()} readers, it provides valuable insights and practical advice.`,
          tableOfContents: [
            { id: '1', title: 'Introduction', content: '', wordCount: 0 },
            { id: '2', title: 'Chapter 1: Understanding the Basics', content: '', wordCount: 0 },
            { id: '3', title: 'Chapter 2: Key Concepts', content: '', wordCount: 0 },
            { id: '4', title: 'Chapter 3: Advanced Topics', content: '', wordCount: 0 },
            { id: '5', title: 'Chapter 4: Practical Applications', content: '', wordCount: 0 },
            { id: '6', title: 'Conclusion', content: '', wordCount: 0 }
          ]
        }
      };
    default:
      return { success: false, error: 'Endpoint not supported in mock mode' };
  }
};

/**
 * Enhance a prompt with GPT-4
 * POST /api/openai/enhance-prompt
 */
router.post('/enhance-prompt', express.json(), async (req, res) => {
  try {
    console.log('Enhance prompt request received');
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = context || 'You are a helpful assistant that enhances user prompts for generating image content.';
    
    console.log('Calling OpenAI API to enhance prompt');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Enhance this book cover prompt with more detailed visual descriptions: "${prompt}"` }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to enhance prompt with OpenAI',
        details: errorData
      });
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0]?.message?.content?.trim();
    
    if (!enhancedPrompt) {
      return res.status(500).json({ error: 'No enhanced prompt received from OpenAI' });
    }

    console.log('Prompt enhanced successfully');
    res.json({ enhancedPrompt });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    res.status(500).json({ 
      error: 'Failed to enhance prompt',
      details: error.message
    });
  }
});

/**
 * Extract a prompt from an image using GPT-4 Vision
 * POST /api/openai/extract-prompt
 */
router.post('/extract-prompt', express.json(), async (req, res) => {
  try {
    console.log('Extract prompt from image request received');
    const { imageUrl, context } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const systemPrompt = context || 'You are a helpful assistant that analyses images and produces detailed descriptions.';
    
    console.log('Calling OpenAI API to extract prompt from image');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'Create a detailed description of this image that could be used as a prompt to generate a similar flat illustration. Do not mention book covers or mockups in your description.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.5
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to extract prompt from image with OpenAI',
        details: errorData
      });
    }

    const data = await response.json();
    const extractedPrompt = data.choices[0]?.message?.content?.trim();
    
    if (!extractedPrompt) {
      return res.status(500).json({ error: 'No extracted prompt received from OpenAI' });
    }

    console.log('Prompt extracted successfully');
    res.json({ extractedPrompt });
  } catch (error) {
    console.error('Error extracting prompt:', error);
    res.status(500).json({ 
      error: 'Failed to extract prompt from image',
      details: error.message
    });
  }
});

// Add the generate-toc endpoint
router.post('/generate-toc', async (req, res) => {
  try {
    const { bookSummary, tone, audience } = req.body;
    
    if (!bookSummary || !tone || !audience) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: bookSummary, tone, and audience are required' 
      });
    }
    
    console.log('Generating TOC with:', { bookSummary, tone, audience });
    
    // Use mock response if API key is not available
    if (req.useLocalMock) {
      console.log('Using mock TOC generator');
      return res.json(generateMockResponse('generate-toc', { bookSummary, tone, audience }));
    }
    
    // Call OpenAI to generate the table of contents
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert book editor and writer. Generate a detailed table of contents for a book based on the provided summary, tone, and target audience. The TOC should be logical, comprehensive, and appropriate for the specified audience.`
        },
        {
          role: "user",
          content: `Create a detailed table of contents for a book with the following details:
          
          Summary: ${bookSummary}
          Tone: ${tone}
          Target Audience: ${audience}
          
          Return ONLY a JSON array of chapter objects with the format:
          [
            { 
              "id": "1",
              "title": "Introduction",
              "content": "",
              "wordCount": 0
            },
            {
              "id": "2", 
              "title": "Chapter 1: Example Title",
              "content": "",
              "wordCount": 0
            }
          ]
          
          Create 5-10 chapters depending on the complexity of the topic. Include an introduction and conclusion chapter.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    // Parse the response
    const responseContent = completion.choices[0].message.content;
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(responseContent);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw response:', responseContent);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse AI response' 
      });
    }
    
    // Map the response to the expected format
    const chapters = parsedContent.map((chapter, index) => ({
      id: (index + 1).toString(),
      title: chapter.title,
      content: '',
      wordCount: 0,
      subtopics: chapter.subtopics || []
    }));
    
    return res.json({ 
      success: true, 
      chapters 
    });
  } catch (error) {
    console.error('Error generating TOC:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Add the generate-book-proposal endpoint
router.post('/generate-book-proposal', async (req, res) => {
  try {
    const { bookSummary, tone, audience, includeTableOfContents } = req.body;
    
    if (!bookSummary || !tone || !audience) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: bookSummary, tone, and audience are required' 
      });
    }
    
    console.log('Generating book proposal with:', { bookSummary, tone, audience, includeTableOfContents });
    
    // Use mock response if API key is not available
    if (req.useLocalMock) {
      console.log('Using mock proposal generator');
      return res.json(generateMockResponse('generate-book-proposal', { bookSummary, tone, audience }));
    }
    
    // Call OpenAI to generate the book proposal
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert book editor and writer. Generate a comprehensive book proposal based on the provided summary, tone, and target audience. The proposal should include a compelling title, subtitle, detailed description, and a detailed table of contents with 5-10 chapters.`
        },
        {
          role: "user",
          content: `Create a book proposal with the following details:
          
          Summary: ${bookSummary}
          Tone: ${tone}
          Target Audience: ${audience}
          
          Return ONLY a JSON object with the format:
          {
            "title": "The title of the book",
            "subtitle": "A compelling subtitle that supports the title",
            "description": "A detailed 2-3 paragraph description of what the book will contain",
            "tableOfContents": [
              {
                "id": "1",
                "title": "Introduction",
                "content": "",
                "wordCount": 0
              },
              {
                "id": "2",
                "title": "Chapter 1: First Chapter Title",
                "content": "",
                "wordCount": 0
              }
              // Additional chapters here
            ]
          }
          
          Make the title catchy and appropriate for the tone and audience. The subtitle should complement the title and give more context. The description should convince readers why they should read this book. The table of contents should include an introduction, 5-10 logical chapters, and a conclusion.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    // Parse the response
    const responseContent = completion.choices[0].message.content;
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(responseContent);
      console.log('Parsed proposal:', parsedContent);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw response:', responseContent);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse AI response' 
      });
    }
    
    // Ensure the response has the expected format
    if (!parsedContent.title || !parsedContent.subtitle || !parsedContent.description) {
      console.error('Invalid proposal format:', parsedContent);
      return res.status(500).json({
        success: false,
        error: 'Invalid proposal format returned by AI'
      });
    }
    
    // If the AI didn't generate a table of contents, create one separately
    if (!parsedContent.tableOfContents || !Array.isArray(parsedContent.tableOfContents) || parsedContent.tableOfContents.length === 0) {
      // Call the generate-toc endpoint internally
      try {
        const tocCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an expert book editor and writer. Generate a detailed table of contents for a book based on the provided summary, tone, and target audience. The TOC should be logical, comprehensive, and appropriate for the specified audience.`
            },
            {
              role: "user",
              content: `Create a detailed table of contents for a book with the following details:
              
              Title: ${parsedContent.title}
              Subtitle: ${parsedContent.subtitle}
              Summary: ${bookSummary}
              Tone: ${tone}
              Target Audience: ${audience}
              
              Return ONLY a JSON array of chapter objects with the format:
              [
                { 
                  "id": "1",
                  "title": "Introduction",
                  "content": "",
                  "wordCount": 0
                },
                {
                  "id": "2", 
                  "title": "Chapter 1: Example Title",
                  "content": "",
                  "wordCount": 0
                }
              ]
              
              Create 5-10 chapters depending on the complexity of the topic. Include an introduction and conclusion chapter.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        const tocContent = tocCompletion.choices[0].message.content;
        let tocData = JSON.parse(tocContent);
        parsedContent.tableOfContents = tocData;
      } catch (tocError) {
        console.error('Error generating TOC:', tocError);
        // Generate a basic TOC if AI fails
        parsedContent.tableOfContents = [
          { id: '1', title: 'Introduction', content: '', wordCount: 0 },
          { id: '2', title: 'Chapter 1: Understanding the Basics', content: '', wordCount: 0 },
          { id: '3', title: 'Chapter 2: Key Concepts', content: '', wordCount: 0 },
          { id: '4', title: 'Chapter 3: Advanced Topics', content: '', wordCount: 0 },
          { id: '5', title: 'Chapter 4: Practical Applications', content: '', wordCount: 0 },
          { id: '6', title: 'Conclusion', content: '', wordCount: 0 }
        ];
      }
    }
    
    return res.json({ 
      success: true, 
      proposal: {
        title: parsedContent.title,
        subtitle: parsedContent.subtitle,
        description: parsedContent.description,
        tableOfContents: parsedContent.tableOfContents || []
      }
    });
  } catch (error) {
    console.error('Error generating book proposal:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Book Generator PDF endpoint
router.post('/generate-pdf', async (req, res) => {
  try {
    // Extract book data from request
    const { 
      title, 
      subtitle, 
      chapters, 
      bookSize, 
      fontFamily, 
      fontSize, 
      lineSpacing, 
      includePageNumbers, 
      includeTOC,
      titlePage,
      copyrightPage,
      dedicationPage,
      authorBio,
      includeAuthorBio,
      closingThoughts,
      includeGlossary,
      glossaryContent
    } = req.body;
    
    if (!title || !chapters || chapters.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required book data: title and chapters are required'
      });
    }
    
    console.log('Generating PDF for book:', title);
    
    try {
      // Import PDF generation libraries
      const PDFDocument = require('pdfkit');
      const { Buffer } = require('buffer');
      const fs = require('fs');
      const path = require('path');
      
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `book-${timestamp}.pdf`;
      const filepath = path.join(__dirname, '..', '..', 'public', 'books', filename);
      
      // Ensure the directory exists
      fs.mkdirSync(path.join(__dirname, '..', '..', 'public', 'books'), { recursive: true });
      
      // Calculate page dimensions based on book size
      let pageWidth, pageHeight;
      switch (bookSize) {
        case '5x8':
          pageWidth = 5 * 72; // 5 inches in points
          pageHeight = 8 * 72; // 8 inches in points
          break;
        case '6x9':
          pageWidth = 6 * 72;
          pageHeight = 9 * 72;
          break;
        case '7x10':
          pageWidth = 7 * 72;
          pageHeight = 10 * 72;
          break;
        case '8.5x11':
        default:
          pageWidth = 8.5 * 72;
          pageHeight = 11 * 72;
          break;
      }
      
      // Create a PDF document
      const doc = new PDFDocument({
        size: [pageWidth, pageHeight],
        margins: {
          top: 72, // 1 inch margins
          bottom: 72,
          left: 72,
          right: 72
        },
        bufferPages: true // For page numbers
      });
      
      // Pipe the PDF to a file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
      
      // Set font and font size
      const font = fontFamily === 'Times New Roman' ? 'Times-Roman' : 'Helvetica';
      doc.font(font);
      doc.fontSize(fontSize);
      
      // Title page
      doc.fontSize(24)
         .text(title, { align: 'center' })
         .moveDown();
      
      if (subtitle) {
        doc.fontSize(18)
           .text(subtitle, { align: 'center' })
           .moveDown(2);
      } else {
        doc.moveDown(3);
      }
      
      doc.fontSize(12)
         .text(titlePage || 'By [Author Name]', { align: 'center' });
      
      doc.addPage();
      
      // Copyright page
      if (copyrightPage) {
        doc.fontSize(12)
           .text(copyrightPage, { align: 'center' })
           .moveDown();
        doc.addPage();
      }
      
      // Dedication page
      if (dedicationPage) {
        doc.fontSize(12)
           .text(dedicationPage, { align: 'center' })
           .moveDown();
        doc.addPage();
      }
      
      // Table of Contents
      if (includeTOC) {
        doc.fontSize(18)
           .text('Table of Contents', { align: 'center' })
           .moveDown(2);
        
        let tocY = doc.y;
        doc.fontSize(12);
        
        chapters.forEach((chapter, index) => {
          const chapterTitle = chapter.title;
          
          // Check if we need to add a page
          if (doc.y > pageHeight - 100) {
            doc.addPage();
            tocY = doc.y;
          }
          
          doc.text(chapterTitle, { continued: true });
          
          // Add dots between title and page number
          const titleWidth = doc.widthOfString(chapterTitle);
          const pageNumWidth = doc.widthOfString(`${index + 1}`);
          const dotsWidth = pageWidth - 144 - titleWidth - pageNumWidth; // 144 = margins
          const dots = '.'.repeat(Math.floor(dotsWidth / doc.widthOfString('.')));
          
          doc.text(dots, { continued: true });
          doc.text(`${index + 1}`, { align: 'right' });
          doc.moveDown();
        });
        
        doc.addPage();
      }
      
      // Chapter content
      chapters.forEach((chapter) => {
        // Add chapter title
        doc.fontSize(18)
           .text(chapter.title, { align: 'center' })
           .moveDown(2);
        
        // Add chapter content with markdown formatting
        doc.fontSize(fontSize);
        
        // Split content into paragraphs
        const paragraphs = chapter.content.split(/\n\n+/);
        
        paragraphs.forEach((paragraph) => {
          // Check if it's a heading
          if (paragraph.startsWith('# ')) {
            doc.fontSize(16)
               .text(paragraph.substring(2), { align: 'center' })
               .moveDown();
            doc.fontSize(fontSize);
          } else if (paragraph.startsWith('## ')) {
            doc.fontSize(14)
               .text(paragraph.substring(3), { align: 'left' })
               .moveDown();
            doc.fontSize(fontSize);
          } else if (paragraph.startsWith('- ')) {
            // Bullet points
            const bulletItems = paragraph.split(/\n- /);
            bulletItems.forEach((item, index) => {
              if (index === 0 && item === '') return;
              const bulletText = index === 0 ? item.substring(2) : item;
              doc.text(`• ${bulletText}`, { indent: 20 });
              doc.moveDown(0.5);
            });
          } else {
            // Regular paragraph
            doc.text(paragraph, { align: 'left', lineGap: (lineSpacing - 1) * 12 });
            doc.moveDown();
          }
          
          // Check if we need to add a page
          if (doc.y > pageHeight - 100) {
            doc.addPage();
          }
        });
        
        // Add a page break after each chapter
        doc.addPage();
      });
      
      // Author bio
      if (includeAuthorBio && authorBio) {
        doc.fontSize(16)
           .text('About the Author', { align: 'center' })
           .moveDown();
        
        doc.fontSize(fontSize)
           .text(authorBio, { align: 'left', lineGap: (lineSpacing - 1) * 12 })
           .moveDown();
        
        doc.addPage();
      }
      
      // Closing thoughts
      if (closingThoughts) {
        doc.fontSize(fontSize)
           .text(closingThoughts, { align: 'left', lineGap: (lineSpacing - 1) * 12 })
           .moveDown();
      }
      
      // Glossary
      if (includeGlossary && glossaryContent) {
        doc.fontSize(16)
           .text('Glossary', { align: 'center' })
           .moveDown();
        
        doc.fontSize(fontSize)
           .text(glossaryContent, { align: 'left', lineGap: (lineSpacing - 1) * 12 })
           .moveDown();
      }
      
      // Add page numbers if requested
      if (includePageNumbers) {
        const pageCount = doc.bufferedPageCount;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          
          // Skip page numbers on title, copyright, dedication pages
          if (i < 3) continue;
          
          doc.fontSize(10)
             .text(`${i + 1}`, 
                  0, 
                  pageHeight - 50, 
                  { align: 'center', width: pageWidth });
        }
      }
      
      // Finalize the PDF
      doc.end();
      
      // Wait for the PDF to be written
      stream.on('finish', () => {
        // Return the URL to the generated PDF
        const pdfUrl = `/books/${filename}`;
        console.log('PDF generated successfully:', pdfUrl);
        
        res.json({
          success: true,
          pdfUrl,
          message: 'PDF generated successfully'
        });
      });
      
      stream.on('error', (err) => {
        console.error('Error writing PDF file:', err);
        res.status(500).json({
          success: false,
          error: 'Error generating PDF file'
        });
      });
      
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      
      // Return a mock PDF URL for testing
      const fallbackUrl = 'https://puzzlemakeribral-production.up.railway.app/api/static/sample-book.pdf';
      
      res.json({
        success: true,
        pdfUrl: fallbackUrl,
        message: 'Using fallback PDF URL due to generation error'
      });
    }
    
  } catch (error) {
    console.error('Error handling PDF generation request:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Generate chapter content endpoint
router.post('/generate-chapter-content', async (req, res) => {
  try {
    const { 
      title, 
      subtitle, 
      bookSummary, 
      tone, 
      targetAudience, 
      chapterTitle, 
      chapterNumber, 
      totalChapters 
    } = req.body;
    
    if (!title || !bookSummary || !chapterTitle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, bookSummary, and chapterTitle are required'
      });
    }
    
    console.log('Generating chapter content for:', { chapterTitle, chapterNumber });
    
    // Use mock response if API key is not available
    if (req.useLocalMock) {
      console.log('Using mock chapter content generator');
      return res.json({
        success: true,
        content: generateMockChapterContent(chapterTitle, chapterNumber, totalChapters)
      });
    }
    
    // Call OpenAI to generate the chapter content
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: `You are an expert book writer and editor specializing in creating high-quality book content that follows Amazon KDP guidelines. 
          
You will generate a complete, well-structured chapter for a book based on the provided information. 
The chapter should be approximately 1500-2500 words, properly formatted with headings, subheadings, and paragraphs.

Follow these guidelines:
1. Create a cohesive narrative that fits within the overall book context
2. Use appropriate formatting (markdown headings, bullet points, etc.)
3. Follow KDP guidelines (no excessive formatting, appropriate content, etc.)
4. Match the tone and style to the specified audience
5. Include 5-8 well-developed sections with subheadings
6. Create engaging, informative content that flows naturally
7. Ensure proper transitions between sections
8. Include an introduction and conclusion to the chapter
9. Use markdown formatting: # for main headings, ## for subheadings
10. For non-fiction: include practical examples, actionable advice, and key takeaways
11. For fiction: develop characters, advance the plot, and maintain consistent voice`
        },
        {
          role: "user",
          content: `Generate a complete chapter for a book with the following details:
          
Book Title: ${title}
${subtitle ? `Book Subtitle: ${subtitle}` : ''}
Book Summary: ${bookSummary}
Tone: ${tone || 'Educational'}
Target Audience: ${targetAudience || 'Adults'}
Chapter Title: ${chapterTitle}
Chapter Number: ${chapterNumber} of ${totalChapters}

Create a comprehensive, well-structured chapter that follows KDP guidelines. The chapter should be approximately 2000 words and include:
- An engaging introduction that sets the context for this chapter
- 5-8 well-developed sections with clear subheadings
- Proper transitions between sections
- A conclusion that summarizes key points and connects to the next chapter
- Use markdown for formatting (# for headings, ## for subheadings, etc.)
- For lists, use proper markdown bullet points or numbered lists
- Ensure the content is substantive, informative, and engaging

The chapter should feel like a professional, published book chapter that's ready for KDP publishing.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });
    
    // Extract the generated content
    const content = completion.choices[0].message.content.trim();
    
    // Calculate approximate word count
    const wordCount = content.split(/\s+/).length;
    
    return res.json({
      success: true,
      content,
      wordCount
    });
    
  } catch (error) {
    console.error('Error generating chapter content:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper function to generate mock chapter content
function generateMockChapterContent(chapterTitle, chapterNumber, totalChapters) {
  // Create a sample chapter based on the chapter title
  let content = `# ${chapterTitle}\n\n`;
  
  // Add an introduction
  content += `As we dive into ${chapterTitle}, it's important to understand how this fits into the overall context of our topic. This chapter will explore key concepts, provide practical examples, and give you actionable insights that you can apply immediately.\n\n`;
  
  // Add 5-7 sections with subheadings and content
  const sectionCount = 5 + Math.floor(Math.random() * 3);
  const sections = [
    "Understanding the Fundamentals",
    "Key Principles to Consider",
    "Practical Applications",
    "Common Challenges and Solutions",
    "Advanced Strategies",
    "Expert Insights",
    "Future Developments",
    "Case Studies and Examples",
    "Implementation Guide"
  ];
  
  for (let i = 0; i < sectionCount; i++) {
    const sectionTitle = sections[i % sections.length];
    content += `## ${sectionTitle}\n\n`;
    
    // Add 2-3 paragraphs per section
    const paragraphCount = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < paragraphCount; j++) {
      content += `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\n`;
    }
    
    // Add a bullet list to some sections
    if (i % 2 === 0) {
      content += `Here are some important points to remember:\n\n`;
      content += `- Important point related to ${chapterTitle}\n`;
      content += `- Another crucial element to consider\n`;
      content += `- Final point to remember\n\n`;
    }
  }
  
  // Add a conclusion
  content += `## Conclusion\n\n`;
  content += `In this chapter, we've explored ${chapterTitle} in depth. We've covered the fundamental concepts, examined practical applications, and provided strategies for implementation. As we move to ${chapterNumber < totalChapters ? 'the next chapter' : 'the conclusion of our book'}, we'll build upon these ideas to further enhance your understanding and capabilities.\n\n`;
  content += `Remember that mastering these concepts takes practice and patience. By applying what you've learned here consistently, you'll see significant improvements in your results over time.\n\n`;
  
  return content;
}

module.exports = router; 