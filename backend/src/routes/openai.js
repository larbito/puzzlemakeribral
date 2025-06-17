const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { OpenAI } = require('openai');
const axios = require('axios');
const multer = require('multer');

// Configure multer for handling form data
const upload = multer({
  limits: {
    fieldSize: 20 * 1024 * 1024, // 20MB limit
    fileSize: 20 * 1024 * 1024
  }
});

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

    const systemPrompt = context || `You are an expert book cover designer and publishing professional with exceptional skill at identifying specific individuals, places, and objects in images. You provide precise, accurate descriptions without resorting to generic terms when specifics can be determined.`;
    
    console.log('Calling OpenAI API to extract prompt from image');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this book cover image carefully and identify EXACTLY what you see. 

1. Extract all visible text elements, separating them into categories:
   - TITLE: The exact book title
   - SUBTITLE: Any secondary title or subtitle
   - AUTHOR: The exact author name
   - TAGLINE: Any short marketing phrase or tagline
   - OTHER_TEXT: Any other visible text elements

2. Then provide a detailed description for recreating this cover design, including:
   - EXACTLY who or what is depicted (specific people, objects, scenes)
   - Precise visual elements and their arrangement
   - Exact color scheme with specific color names
   - Detailed artistic style and mood
   - Typography styles
   - Layout and composition
   - Texture and finishing details

CRITICAL: Be extremely specific with identifications. Never use generic terms like "famous scientist" or "sports figure" when you can identify the specific person (e.g., "Albert Einstein", "Lionel Messi"). If you're not 100% certain, provide your best specific guess along with alternative possibilities.

Format your response as a structured JSON object with these fields:
{
  "textElements": {
    "title": "The exact book title",
    "subtitle": "The exact subtitle if present",
    "author": "The exact author name",
    "tagline": "Any marketing tagline if present",
    "otherText": "Any other text visible on the cover"
  },
  "extractedPrompt": "A detailed description of the visual elements, style, colors, layout, etc. that would allow recreating a similar cover design."
}

IMPORTANT: If text is difficult to read or partially obscured, make your best educated guess, but be accurate with what you can clearly see.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent results
        response_format: { type: 'json_object' },
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'Error calling OpenAI API');
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    try {
      // Parse the response to extract the content
      const content = JSON.parse(data.choices[0].message.content);
      
      // Return the structured data with both text elements and extracted prompt
      return res.json({
        textElements: content.textElements,
        extractedPrompt: content.extractedPrompt
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // If parsing fails, return the raw content
      return res.json({
        extractedPrompt: data.choices[0].message.content
      });
    }
  } catch (error) {
    console.error('Error extracting prompt:', error);
    return res.status(500).json({ error: error.message || 'Failed to extract prompt from image' });
  }
});

/**
 * General chat endpoint for prompt enhancement
 * POST /api/openai/chat
 */
router.post('/chat', express.json(), async (req, res) => {
  try {
    console.log('Chat request received');
    const { messages, model = 'gpt-4', max_tokens = 500, temperature = 0.7 } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (req.useLocalMock) {
      // Mock response for local development
      return res.json({
        choices: [{
          message: {
            content: "Enhanced prompt: A highly detailed, photorealistic image with vibrant colors, professional lighting, and artistic composition. The scene should be visually striking with excellent depth of field and masterful use of color theory."
          }
        }]
      });
    }
    
    console.log('Calling OpenAI API for chat completion');
    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature
    });

    console.log('Chat completion successful');
    res.json(response);
  } catch (error) {
    console.error('Error in chat completion:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error.message
    });
  }
});

/**
 * Generate image from prompt using DALL-E
 * POST /api/openai/generate-image-like-this
 */
router.post('/generate-image-like-this', express.json(), async (req, res) => {
  try {
    console.log('Image generation request received');
    const { prompt, size = '1024x1024', model = 'dall-e-3', quality = 'standard' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (req.useLocalMock) {
      // Mock response for local development
      return res.json({
        imageUrl: 'https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=Mock+Generated+Image'
      });
    }
    
    console.log('Calling OpenAI API to generate image');
    const response = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality,
      response_format: 'url'
    });

    const imageUrl = response.data[0].url;
    console.log('Image generated successfully');
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message
    });
  }
});

/**
 * Generate prompt from image using GPT-4 Vision
 * POST /api/openai/generate-prompt-from-image
 */
router.post('/generate-prompt-from-image', express.json(), async (req, res) => {
  try {
    console.log('Generate prompt from image request received');
    const { base64Image, mimeType } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: 'Base64 image is required' });
    }

    if (req.useLocalMock) {
      // Mock response for local development
      return res.json({
        prompt: "A beautifully composed image with vibrant colors and excellent lighting. The scene features detailed textures, professional photography style, and artistic composition with strong visual impact."
      });
    }
    
    console.log('Calling OpenAI API to generate prompt from image');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing images and creating detailed prompts for DALL·E 3. Analyze the image and create a detailed prompt that would generate a similar image. Focus on visual elements, style, composition, colors, lighting, and mood.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and create a detailed prompt for DALL·E 3 that would generate a similar image. Focus on the visual elements, artistic style, composition, colors, lighting, and overall mood. Return only the prompt, no explanations.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const prompt = response.choices[0].message.content;
    console.log('Prompt generated from image successfully');
    
    res.json({ prompt });
  } catch (error) {
    console.error('Error generating prompt from image:', error);
    res.status(500).json({ 
      error: 'Failed to generate prompt from image',
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
          
          // Skip page number on title page
          if (i === 0) continue;
          
          doc.fontSize(10)
             .text(`${i}`, 
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
Tone: ${tone}
Target Audience: ${targetAudience}
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

/**
 * Generate a complete book with content, automatically determining chapters based on page count
 * POST /api/openai/generate-complete-book
 */
router.post('/generate-complete-book', async (req, res) => {
  try {
    const { 
      title, 
      subtitle, 
      bookSummary, 
      tone, 
      targetAudience, 
      pageCount, 
      bookSize, 
      fontFamily, 
      fontSize,
      optimizeForLargeBook = false // New flag for large books
    } = req.body;
    
    if (!bookSummary || !tone || !targetAudience || !pageCount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: bookSummary, tone, targetAudience, and pageCount are required' 
      });
    }
    
    console.log('Generating complete book with:', { 
      title: title || 'Untitled', 
      pageCount, 
      bookSummary: bookSummary.substring(0, 100) + '...',
      optimizeForLargeBook
    });
    
    // Use mock response if API key is not available
    if (req.useLocalMock) {
      console.log('Using mock book generator');
      return res.json(generateMockCompleteBook({ 
        title, 
        subtitle, 
        bookSummary, 
        tone, 
        targetAudience, 
        pageCount 
      }));
    }
    
    // Calculate estimated number of chapters based on page count
    // For large books, use fewer, larger chapters to optimize generation
    const pagesPerChapter = optimizeForLargeBook ? 25 : 15;
    const estimatedChapters = Math.max(5, Math.ceil(pageCount / pagesPerChapter));
    
    // Step 1: Generate appropriate chapter breakdown for the book
    // For large books, use a more concise system prompt
    const systemPrompt = optimizeForLargeBook 
      ? `You are an expert book editor who creates concise chapter breakdowns for books.`
      : `You are an expert book editor and author who creates detailed chapter breakdowns for books.
          
You MUST respond with a valid JSON object containing an array of chapter objects under the "chapters" key. 
Each chapter must have a "title" and "summary" field.`;

    const chapterBreakdownPrompt = `
      Create a chapter breakdown for a ${pageCount}-page book with the following details:
      
      Title: ${title || 'Untitled'}
      Subtitle: ${subtitle || ''}
      Summary: ${bookSummary}
      Tone: ${tone}
      Target Audience: ${targetAudience}
      
      The book should be approximately ${pageCount} pages long when formatted with:
      - Book size: ${bookSize || '6x9'} inches
      - Font: ${fontFamily || 'Times New Roman'}
      - Font size: ${fontSize || 12}pt
      
      Create a chapter breakdown with approximately ${estimatedChapters} chapters (including introduction and conclusion).
      The chapters should flow logically and cover the topic thoroughly.
      
      Return ONLY a JSON array of chapter objects with the format:
      [
        { "title": "Introduction", "summary": "Brief description of chapter content" },
        { "title": "Chapter 1: Example Title", "summary": "Brief description of chapter content" },
        ...and so on
      ]
    `;
    
    console.log('Generating chapter breakdown...');
    
    // Call OpenAI to generate the chapter breakdown
    // Use a faster model for large books
    const breakdownModel = optimizeForLargeBook || pageCount > 300 ? "gpt-3.5-turbo" : "gpt-4o";
    
    const breakdownCompletion = await openai.chat.completions.create({
      model: breakdownModel,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: chapterBreakdownPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: optimizeForLargeBook ? 0.5 : 0.7,
      max_tokens: Math.min(4000, 500 + (pageCount / 10)) // Scale tokens based on book size
    });
    
    // Parse the chapter breakdown
    let chapterBreakdown;
    try {
      const breakdownResponse = JSON.parse(breakdownCompletion.choices[0].message.content);
      
      // Handle different possible response formats
      if (Array.isArray(breakdownResponse)) {
        // Direct array of chapters
        chapterBreakdown = breakdownResponse;
      } else if (breakdownResponse.chapters && Array.isArray(breakdownResponse.chapters)) {
        // Object with chapters array
        chapterBreakdown = breakdownResponse.chapters;
      } else {
        // Try to extract any array property from the response
        const arrayProps = Object.entries(breakdownResponse)
          .find(([_, value]) => Array.isArray(value) && value.length > 0);
        
        if (arrayProps) {
          chapterBreakdown = arrayProps[1];
        } else {
          // No array found, throw error
          throw new Error('Could not find chapters array in API response');
        }
      }
      
      // Validate that chapters have the required properties
      if (!Array.isArray(chapterBreakdown) || chapterBreakdown.length === 0) {
        throw new Error('Invalid or empty chapter breakdown');
      }
      
      // Ensure each chapter has at least a title property
      chapterBreakdown = chapterBreakdown.map((chapter, index) => {
        if (typeof chapter === 'string') {
          // Handle case where API returns just strings
          return { 
            title: chapter,
            summary: `Chapter ${index + 1}` 
          };
        } else if (!chapter.title && chapter.name) {
          // Handle case where title is called "name"
          return {
            ...chapter,
            title: chapter.name,
            summary: chapter.summary || chapter.description || `Chapter ${index + 1}`
          };
        } else if (!chapter.title) {
          // Handle case with no title
          return {
            ...chapter,
            title: `Chapter ${index + 1}`,
            summary: chapter.summary || chapter.description || `Chapter ${index + 1}`
          };
        } else if (!chapter.summary) {
          // Handle case with no summary
          return {
            ...chapter,
            summary: chapter.description || `Content for ${chapter.title}`
          };
        }
        return chapter;
      });
      
      console.log('Successfully parsed chapter breakdown with structure:', 
        chapterBreakdown.map(c => c.title).join(', '));
    } catch (error) {
      console.error('Error parsing chapter breakdown:', error);
      console.error('Raw response:', breakdownCompletion.choices[0].message.content);
      
      // Fallback to a simple chapter structure
      chapterBreakdown = [
        { title: "Introduction", summary: "Introduction to the book's topic" },
        { title: "Chapter 1: Getting Started", summary: "Basic concepts and fundamentals" },
        { title: "Chapter 2: Core Principles", summary: "Essential principles and ideas" },
        { title: "Chapter 3: Advanced Concepts", summary: "More complex aspects of the topic" },
        { title: "Chapter 4: Practical Applications", summary: "Real-world applications" },
        { title: "Conclusion", summary: "Summary and final thoughts" }
      ];
      
      console.log('Using fallback chapter structure:', 
        chapterBreakdown.map(c => c.title).join(', '));
    }
    
    console.log(`Generated ${chapterBreakdown.length} chapters`);
    
    // Step 2: Generate content for each chapter
    const chaptersWithContent = [];
    
    // Calculate target words per chapter to hit the page count
    // Assuming approximately 250 words per page
    const totalWords = pageCount * 250;
    const wordsPerChapter = Math.floor(totalWords / chapterBreakdown.length);
    
    // For large books, use a faster model with more concise instructions
    const contentModel = optimizeForLargeBook ? "gpt-3.5-turbo-16k" : "gpt-4o";
    const temperature = optimizeForLargeBook ? 0.6 : 0.7;
    
    for (let i = 0; i < chapterBreakdown.length; i++) {
      const chapter = chapterBreakdown[i];
      console.log(`Generating content for chapter ${i+1}: ${chapter.title}`);
      
      const chapterPrompt = optimizeForLargeBook
        ? `
          Write chapter "${chapter.title}" (${i+1}/${chapterBreakdown.length}) for a book about ${bookSummary}.
          Chapter summary: ${chapter.summary}
          Style: ${tone} tone for ${targetAudience} audience
          Length: ~${wordsPerChapter} words
          Start with the chapter title as a heading.
        `
        : `
          You are writing the "${chapter.title}" chapter of a book titled "${title || 'Untitled'}".
          
          Book summary: ${bookSummary}
          Chapter summary: ${chapter.summary}
          Tone: ${tone}
          Target audience: ${targetAudience}
          
          This is chapter ${i+1} of ${chapterBreakdown.length}.
          
          Write the complete content for this chapter. It should be approximately ${wordsPerChapter} words.
          Use appropriate headings, subheadings, and paragraphs to organize the content.
          The content should be engaging, informative, and match the specified tone.
          
          Return ONLY the chapter content, starting with the chapter title as a heading.
        `;
      
      try {
        const contentCompletion = await openai.chat.completions.create({
          model: contentModel,
          messages: [
            {
              role: "system",
              content: "You are an expert book author who writes engaging, well-structured chapter content."
            },
            {
              role: "user",
              content: chapterPrompt
            }
          ],
          max_tokens: 4000,
          temperature: temperature
        });
        
        const chapterContent = contentCompletion.choices[0].message.content;
        const wordCount = chapterContent.split(/\s+/).filter(word => word.length > 0).length;
        
        chaptersWithContent.push({
          title: chapter.title,
          content: chapterContent,
          wordCount: wordCount
        });
        
        console.log(`Generated ${wordCount} words for chapter ${i+1}`);
      } catch (error) {
        console.error(`Error generating content for chapter ${i+1}:`, error);
        // Add a placeholder for failed chapters
        chaptersWithContent.push({
          title: chapter.title,
          content: `# ${chapter.title}\n\nContent generation failed. Please try again or edit manually.\n\nChapter summary: ${chapter.summary}`,
          wordCount: 20
        });
      }
    }
    
    // Return the complete book
    res.json({
      success: true,
      chapters: chaptersWithContent,
      estimatedPageCount: Math.ceil(chaptersWithContent.reduce((total, ch) => total + ch.wordCount, 0) / 250)
    });
    
  } catch (error) {
    console.error('Error generating complete book:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate complete book',
      details: error.message
    });
  }
});

// Function to generate a mock complete book for local development
function generateMockCompleteBook(params) {
  const { bookSummary, pageCount } = params;
  
  // Create a realistic number of chapters based on page count
  const numChapters = Math.max(5, Math.ceil(pageCount / 15));
  const chapters = [];
  
  // Extract some keywords from the summary to make the mock content more relevant
  const keywords = bookSummary.split(' ')
    .filter(word => word.length > 4)
    .map(word => word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
  
  const uniqueKeywords = [...new Set(keywords)];
  const relevantKeywords = uniqueKeywords.slice(0, Math.min(5, uniqueKeywords.length));
  
  // Add introduction
  chapters.push({
    title: 'Introduction',
    content: `# Introduction\n\nWelcome to this book about ${bookSummary.substring(0, 50)}. In the following chapters, we will explore various aspects of this fascinating topic.\n\n## Why This Book Matters\n\nThis book provides valuable insights into ${relevantKeywords[0] || 'the subject'} and offers practical advice for ${relevantKeywords[1] || 'readers'}.\n\n## What You'll Learn\n\nBy the end of this book, you'll have a comprehensive understanding of ${relevantKeywords[2] || 'the topic'} and how to apply it in real-world situations.`,
    wordCount: 100
  });
  
  // Add main chapters
  for (let i = 1; i <= numChapters - 2; i++) {
    const keyword = relevantKeywords[i % relevantKeywords.length] || `Topic ${i}`;
    chapters.push({
      title: `Chapter ${i}: Understanding ${keyword}`,
      content: `# Chapter ${i}: Understanding ${keyword}\n\nThis chapter explores the concept of ${keyword} in depth.\n\n## Key Concepts\n\nHere we discuss the fundamental aspects of ${keyword} and why they matter.\n\n## Practical Applications\n\nIn this section, we examine how ${keyword} can be applied in various contexts.\n\n## Case Studies\n\nLet's look at some real-world examples of ${keyword} in action.\n\n## Summary\n\nIn this chapter, we've explored ${keyword} and its significance in the broader context of ${bookSummary.substring(0, 30)}.`,
      wordCount: 200
    });
  }
  
  // Add conclusion
  chapters.push({
    title: 'Conclusion',
    content: `# Conclusion\n\nAs we conclude this exploration of ${bookSummary.substring(0, 50)}, let's recap the key insights we've gained.\n\n## Key Takeaways\n\nThroughout this book, we've learned about ${relevantKeywords.join(', ')} and how they interconnect.\n\n## Future Directions\n\nThe field of ${relevantKeywords[0] || 'this topic'} continues to evolve, and there are many exciting developments on the horizon.\n\n## Final Thoughts\n\nThank you for joining me on this journey through ${relevantKeywords[0] || 'this subject'}. I hope you've found this book informative and inspiring.`,
    wordCount: 150
  });
  
  return {
    success: true,
    chapters: chapters,
    estimatedPageCount: pageCount
  };
}

// Add a new endpoint for quick book outline generation (just chapter titles)
router.post('/generate-book-outline', async (req, res) => {
  try {
    const { prompt, outlineOnly = false } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: prompt' 
      });
    }
    
    console.log('Generating book outline from prompt');
    
    // Use mock response if API key is not available
    if (req.useLocalMock) {
      console.log('Using mock outline generator');
      return res.json({
        success: true,
        chapters: [
          "Introduction",
          "Chapter 1: Getting Started",
          "Chapter 2: Core Concepts",
          "Chapter 3: Advanced Techniques",
          "Chapter 4: Practical Applications",
          "Conclusion"
        ]
      });
    }
    
    // Call OpenAI to generate just the chapter titles
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use the faster model for outlines
      messages: [
        {
          role: "system",
          content: `You are an expert book editor who creates chapter outlines for books. 
          Respond with a JSON array of chapter titles only.
          Keep your response compact and focused on just the chapter titles.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 500, // Keep token usage low for speed
    });
    
    let chapters = [];
    
    try {
      const responseContent = completion.choices[0].message.content;
      const parsedContent = JSON.parse(responseContent);
      
      // Handle different possible response formats
      if (Array.isArray(parsedContent)) {
        chapters = parsedContent;
      } else if (parsedContent.chapters && Array.isArray(parsedContent.chapters)) {
        chapters = parsedContent.chapters;
      } else if (parsedContent.titles && Array.isArray(parsedContent.titles)) {
        chapters = parsedContent.titles;
      } else {
        // Try to find any array property in the response
        const arrayProps = Object.entries(parsedContent)
          .find(([_, value]) => Array.isArray(value) && value.length > 0);
        
        if (arrayProps) {
          chapters = arrayProps[1];
        } else {
          throw new Error('Could not find chapter array in API response');
        }
      }
      
      // Clean up chapter titles if they're objects
      chapters = chapters.map(chapter => {
        if (typeof chapter === 'string') {
          return chapter;
        } else if (chapter.title) {
          return chapter.title;
        } else if (chapter.name) {
          return chapter.name;
        } else {
          return JSON.stringify(chapter);
        }
      });
      
    } catch (error) {
      console.error('Error parsing outline response:', error);
      // Fallback to a simple outline
      chapters = [
        "Introduction",
        "Chapter 1: Getting Started",
        "Chapter 2: Core Concepts", 
        "Chapter 3: Advanced Techniques",
        "Chapter 4: Practical Applications",
        "Conclusion"
      ];
    }
    
    return res.json({
      success: true,
      chapters
    });
    
  } catch (error) {
    console.error('Error generating book outline:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate book outline',
      details: error.message
    });
  }
});

// Add a new endpoint for extracting text from images
/**
 * Extract text from an image using OpenAI Vision API
 * POST /api/openai/extract-text
 */
router.post('/extract-text', upload.none(), async (req, res) => {
  try {
    console.log('Starting text extraction from image');
    
    // Get the image URL from the request body
    const { imageUrl, instructions = '' } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    // Prepare the OpenAI API request
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    // Process the image URL (handle data URLs and regular URLs)
    let base64Image = '';
    if (imageUrl.startsWith('data:image')) {
      // Extract the base64 part from data URL
      base64Image = imageUrl.split(',')[1];
    } else {
      // If it's a URL, download and convert to base64
      try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        base64Image = Buffer.from(response.data).toString('base64');
      } catch (error) {
        console.error('Error downloading image:', error);
        return res.status(400).json({ error: 'Failed to download image' });
      }
    }
    
    // Create a customized instruction for text extraction
    const extractionInstructions = instructions || `
      Extract all text from this book cover image.
      Focus only on text content, including:
      - Book title
      - Subtitle (if any)
      - Author name
      - Any taglines, quotes, or promotional text
      
      Return the extracted text only, formatted neatly.
    `;
    
    // Call the OpenAI API
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: extractionInstructions },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract the response
    const extractedText = openaiResponse.data.choices[0].message.content.trim();
    console.log('Text extraction successful');
    
    // Return the extracted text
    res.json({
      success: true,
      extractedText
    });
    
  } catch (error) {
    console.error('Error extracting text from image:', error);
    
    // Provide more detailed error information
    const errorDetail = error.response?.data?.error?.message || error.message;
    
    res.status(500).json({
      error: 'Failed to extract text from image',
      detail: errorDetail
    });
  }
});

/**
 * Generate coloring book scenes using ChatGPT
 * POST /api/openai/generate-coloring-scenes
 */
router.post('/generate-coloring-scenes', express.json(), async (req, res) => {
  try {
    console.log('Generate coloring scenes request received');
    const { 
      storyInput, 
      pageCount, 
      bookTitle, 
      targetAudience, 
      artStyle,
      complexity,
      complexityModifier,
      batchInfo
    } = req.body;
    
    if (!storyInput) {
      return res.status(400).json({ error: 'Story input is required' });
    }
    
    // Updated to support up to 300 pages with batch processing
    if (!pageCount || pageCount < 1 || pageCount > 300) {
      return res.status(400).json({ error: 'Page count must be between 1 and 300' });
    }

    // Enhanced system prompt with complexity support
    const complexityInstructions = {
      'low': 'Focus on simple shapes, basic objects, minimal detail. Large areas for coloring with clean, bold outlines.',
      'medium': 'Include moderate detail with balanced complexity. Mix of simple and detailed elements suitable for various ages.',
      'high': 'Create detailed environments with multiple elements, intricate patterns, and complex scenes with fine details.'
    };

    const complexityInstruction = complexityInstructions[complexity] || complexityInstructions['medium'];
    const batchContext = batchInfo ? 
      `This is batch ${batchInfo.current} of ${batchInfo.total}, covering pages ${batchInfo.startPage}-${batchInfo.endPage}.` : 
      '';

    const systemPrompt = `You are an expert children's book writer and coloring book designer. Your task is to create engaging, age-appropriate scenes for a coloring book based on a story concept.

${batchContext}

Guidelines:
1. Create exactly ${pageCount} UNIQUE and DIFFERENT scenes that tell a cohesive story from beginning to end
2. Each scene should show a DIFFERENT moment, activity, or situation in the story
3. Progress the story logically - beginning, middle, end with varied activities
4. Each scene must be descriptive enough for ${artStyle || 'line art'} illustration
5. Avoid repetitive scenes - make each one distinct and interesting
6. Include variety in settings, actions, emotions, and compositions
7. Make each scene colorable with clear outlines and defined areas
8. Each scene should advance the narrative and show character development

COMPLEXITY LEVEL (${complexity}): ${complexityInstruction}
${complexityModifier ? `Specific complexity modifier: ${complexityModifier}` : ''}

IMPORTANT: Do NOT repeat similar scenes. Each one should be a completely different moment in the story.

Story Structure Guidelines:
- Early scenes: Introduction, character meeting new situations
- Middle scenes: Adventures, challenges, character growth, different activities
- Later scenes: Resolution, character achieving goals, peaceful moments

Output Format:
Return a JSON array of exactly ${pageCount} scenes, each with:
- title: Short, engaging title that clearly differentiates this scene (5-8 words)
- description: Brief story description showing what's happening in THIS specific moment (1-2 sentences)
- prompt: Detailed coloring book illustration prompt optimized for AI generation, incorporating the complexity level

Example format:
[
  {
    "title": "Character Wakes Up in New World",
    "description": "Our character opens their eyes for the first time in their new surroundings.",
    "prompt": "Simple line art coloring page showing [character] waking up and stretching in [setting], with surprised expression, ${complexityModifier || 'moderate detail'}, clean black outlines on white background"
  }
]`;

    const userPrompt = `Story Concept: "${storyInput}"

Create ${pageCount} COMPLETELY DIFFERENT coloring book scenes that tell this story from beginning to end. 

${batchContext ? `BATCH CONTEXT: ${batchContext}` : ''}

CRITICAL REQUIREMENTS:
- Each scene must show a DIFFERENT activity, moment, or situation
- Progress the story chronologically from start to finish
- Vary the settings, actions, and emotions in each scene
- Make each scene title and description clearly distinct from the others
- Ensure each scene advances the narrative
- Apply ${complexity} complexity level: ${complexityInstruction}
${complexityModifier ? `- Use this detail level: ${complexityModifier}` : ''}

NO repetitive scenes! Each one should be a unique moment in the character's journey.

Target audience: ${targetAudience}
Book title: ${bookTitle}
Art style: ${artStyle}
Complexity level: ${complexity}

IMPORTANT: Return EXACTLY ${pageCount} scenes in a JSON array format like this:
[
  {
    "title": "Scene 1 Title",
    "description": "Scene 1 description", 
    "prompt": "Scene 1 AI generation prompt with ${complexityModifier || 'appropriate detail level'}"
  },
  {
    "title": "Scene 2 Title",
    "description": "Scene 2 description",
    "prompt": "Scene 2 AI generation prompt with ${complexityModifier || 'appropriate detail level'}"
  }
]

Return exactly ${pageCount} unique scenes in JSON array format.`;
    
    console.log('Calling OpenAI API to generate coloring scenes');
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
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.8,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // Instead of returning error, use fallback scenes with user's story
      console.log('OpenAI API failed, using enhanced fallback scenes with user story');
      const fallbackScenes = [];
      const activities = [
        'beginning the adventure', 'exploring new places', 'meeting new friends', 'learning something important', 'facing a challenge', 
        'helping others', 'discovering something magical', 'overcoming obstacles', 'celebrating success', 'peaceful ending'
      ];
      
      for (let i = 0; i < pageCount; i++) {
        const activity = activities[i % activities.length];
        fallbackScenes.push({
          title: `Scene ${i + 1}: ${activity.charAt(0).toUpperCase() + activity.slice(1)}`,
          description: `In this scene from "${storyInput}", the main character is ${activity}.`,
          prompt: `Simple line art coloring page showing ${activity} in the story about ${storyInput}, ${complexityModifier || 'moderate detail'}, clean black outlines on white background, suitable for children to color`
        });
      }
      
      console.log(`Using ${fallbackScenes.length} API fallback scenes based on user story`);
      return res.json({ success: true, scenes: fallbackScenes });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    if (!content) {
      return res.status(500).json({ error: 'No content received from OpenAI' });
    }

    console.log('Raw content:', content);

    try {
      const parsedContent = JSON.parse(content);
      
      // Handle different response formats
      let scenes = [];
      
      if (Array.isArray(parsedContent)) {
        // Direct array response
        scenes = parsedContent;
        console.log('Parsed direct array response');
      } else if (parsedContent.scenes && Array.isArray(parsedContent.scenes)) {
        // Object with scenes array
        scenes = parsedContent.scenes;
        console.log('Parsed scenes from object property');
      } else if (typeof parsedContent === 'object' && parsedContent.title) {
        // Single scene object - wrap in array and generate more using enhanced fallback
        console.log('Got single scene object, converting to array with enhanced scenes');
        scenes = [parsedContent];
        
        // If we only got one scene but need more, use enhanced fallback activities
        const activities = [
          'beginning the adventure', 'exploring new places', 'meeting new friends', 'learning something important', 'facing a challenge', 
          'helping others', 'discovering something magical', 'overcoming obstacles', 'celebrating success', 'peaceful ending'
        ];
        
        while (scenes.length < pageCount) {
          const sceneNumber = scenes.length + 1;
          const activity = activities[(sceneNumber - 1) % activities.length];
          scenes.push({
            title: `Scene ${sceneNumber}: ${activity.charAt(0).toUpperCase() + activity.slice(1)}`,
            description: `In this scene from "${storyInput}", the main character is ${activity}.`,
            prompt: `Simple line art coloring page showing ${activity} in the story about ${storyInput}, ${complexityModifier || 'moderate detail'}, clean black outlines on white background, suitable for children to color`
          });
        }
        console.log(`Extended to ${pageCount} scenes with enhanced activities`);
      } else {
        // Try to find any array property in the response
        const arrayProps = Object.entries(parsedContent)
          .find(([_, value]) => Array.isArray(value) && value.length > 0);
        
        if (arrayProps) {
          scenes = arrayProps[1];
          console.log(`Found scenes in property: ${arrayProps[0]}`);
        } else {
          throw new Error('No valid scenes array found in response');
        }
      }

      // Validate scenes
      if (!scenes || scenes.length === 0) {
        throw new Error('No scenes generated');
      }

      console.log(`Parsed ${scenes.length} scenes from OpenAI response`);

      // Ensure we have the right number of scenes
      if (scenes.length !== pageCount) {
        console.warn(`Generated ${scenes.length} scenes, expected ${pageCount}`);
        
        // Adjust the array length
        if (scenes.length > pageCount) {
          scenes = scenes.slice(0, pageCount);
          console.log(`Trimmed to ${pageCount} scenes`);
        } else {
          // Generate additional scenes to reach the target count using enhanced activities
          const activities = [
            'beginning the adventure', 'exploring new places', 'meeting new friends', 'learning something important', 'facing a challenge', 
            'helping others', 'discovering something magical', 'overcoming obstacles', 'celebrating success', 'peaceful ending'
          ];
          
          while (scenes.length < pageCount) {
            const sceneNumber = scenes.length + 1;
            const activity = activities[(sceneNumber - 1) % activities.length];
            scenes.push({
              title: `Scene ${sceneNumber}: ${activity.charAt(0).toUpperCase() + activity.slice(1)}`,
              description: `In this scene from "${storyInput}", the main character is ${activity}.`,
              prompt: `Simple line art coloring page showing ${activity} in the story about ${storyInput}, ${complexityModifier || 'moderate detail'}, clean black outlines on white background, suitable for children to color`
            });
          }
          console.log(`Extended to ${pageCount} scenes with enhanced activities`);
        }
      }

      // Validate each scene has required fields
      scenes = scenes.map((scene, index) => ({
        title: scene.title || `Scene ${index + 1}`,
        description: scene.description || `A coloring page scene from the story.`,
        prompt: scene.prompt || scene.description || `Simple line art coloring page for scene ${index + 1}, clean black outlines on white background`
      }));

      console.log(`Generated ${scenes.length} coloring book scenes successfully`);
      res.json({ success: true, scenes });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw content:', content);
      
      // Enhanced fallback: create basic scenes from the story input
      console.log('Creating enhanced fallback scenes');
      const fallbackScenes = [];
      const activities = [
        'starting the journey', 'discovering something new', 'meeting important characters', 'learning a valuable lesson', 'facing the first challenge', 
        'finding unexpected help', 'exploring a special place', 'making a difficult choice', 'showing courage and determination', 'reaching a happy conclusion'
      ];
      
      for (let i = 0; i < pageCount; i++) {
        const activity = activities[i % activities.length];
        fallbackScenes.push({
          title: `Scene ${i + 1}: ${activity.charAt(0).toUpperCase() + activity.slice(1)}`,
          description: `In this scene from "${storyInput}", we see the story ${activity}.`,
          prompt: `Simple line art coloring page showing ${activity} in the story about ${storyInput}, ${complexityModifier || 'moderate detail'}, clean black outlines on white background, suitable for children to color`
        });
      }
      
      console.log(`Using ${fallbackScenes.length} enhanced fallback scenes`);
      res.json({ success: true, scenes: fallbackScenes });
    }
  } catch (error) {
    console.error('Error generating coloring scenes:', error);
    res.status(500).json({ 
      error: 'Failed to generate coloring scenes',
      details: error.message
    });
  }
});

/**
 * Regenerate a single coloring book scene
 * POST /api/openai/regenerate-scene
 */
router.post('/regenerate-scene', express.json(), async (req, res) => {
  try {
    console.log('Regenerate scene request received');
    const { 
      storyInput, 
      sceneTitle, 
      sceneDescription, 
      artStyle,
      complexity,
      complexityModifier
    } = req.body;
    
    if (!storyInput) {
      return res.status(400).json({ error: 'Story input is required' });
    }

    // Enhanced system prompt for single scene regeneration
    const complexityInstructions = {
      'low': 'Focus on simple shapes, basic objects, minimal detail. Large areas for coloring with clean, bold outlines.',
      'medium': 'Include moderate detail with balanced complexity. Mix of simple and detailed elements suitable for various ages.',
      'high': 'Create detailed environments with multiple elements, intricate patterns, and complex scenes with fine details.'
    };

    const complexityInstruction = complexityInstructions[complexity] || complexityInstructions['medium'];

    const systemPrompt = `You are an expert children's book writer and coloring book designer. Your task is to regenerate a single scene for a coloring book with fresh details while maintaining the core story concept.

Guidelines:
1. Create ONE unique scene that fits within the story concept
2. Make it different from the original but maintain the same general theme/moment
3. The scene should be descriptive enough for ${artStyle || 'line art'} illustration
4. Make it colorable with clear outlines and defined areas
5. Apply the specified complexity level consistently

COMPLEXITY LEVEL (${complexity}): ${complexityInstruction}
${complexityModifier ? `Specific complexity modifier: ${complexityModifier}` : ''}

Output Format:
Return a JSON object with:
- title: Short, engaging title (5-8 words)
- description: Brief story description (1-2 sentences)
- prompt: Detailed coloring book illustration prompt optimized for AI generation

Example format:
{
  "title": "New Scene Title",
  "description": "A fresh take on the scene concept.",
  "prompt": "Simple line art coloring page showing [detailed description], ${complexityModifier || 'appropriate detail level'}, clean black outlines on white background"
}`;

    const userPrompt = `Story Concept: "${storyInput}"

Original Scene Title: "${sceneTitle}"
Original Scene Description: "${sceneDescription}"

Create a NEW variation of this scene that:
- Maintains the same general story moment/theme
- Offers fresh visual details and perspectives
- Shows the same character(s) but in a slightly different situation or pose
- Applies ${complexity} complexity level: ${complexityInstruction}
${complexityModifier ? `- Uses this detail level: ${complexityModifier}` : ''}

Art style: ${artStyle}
Complexity level: ${complexity}

IMPORTANT: Return exactly ONE scene object in JSON format:
{
  "title": "New Scene Title",
  "description": "New scene description",
  "prompt": "New AI generation prompt with ${complexityModifier || 'appropriate detail level'}"
}`;
    
    console.log('Calling OpenAI API to regenerate scene');
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
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.9, // Higher temperature for more creative variations
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to regenerate scene with OpenAI',
        details: errorData
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    if (!content) {
      return res.status(500).json({ error: 'No content received from OpenAI' });
    }

    console.log('Raw regenerated scene content:', content);

    try {
      const scene = JSON.parse(content);
      
      // Validate the scene has required fields
      const validatedScene = {
        title: scene.title || sceneTitle || 'Regenerated Scene',
        description: scene.description || 'A regenerated scene from the story.',
        prompt: scene.prompt || `Simple line art coloring page related to: ${storyInput}, ${complexityModifier || 'moderate detail'}, clean black outlines on white background`
      };

      console.log('Successfully regenerated scene:', validatedScene.title);

      res.json({
        success: true,
        scene: validatedScene
      });
    } catch (parseError) {
      console.error('Error parsing regenerated scene:', parseError);
      
      // Fallback response
      const fallbackScene = {
        title: sceneTitle || 'Regenerated Scene',
        description: 'A fresh take on the scene concept.',
        prompt: `Simple line art coloring page showing a regenerated version of ${sceneDescription || storyInput}, ${complexityModifier || 'moderate detail'}, clean black outlines on white background`
      };
      
      res.json({
        success: true,
        scene: fallbackScene
      });
    }
  } catch (error) {
    console.error('Error regenerating scene:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate scene',
      details: error.message
    });
  }
});

module.exports = router; 