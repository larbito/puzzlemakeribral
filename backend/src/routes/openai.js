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
router.post('/book-generator/generate-pdf', async (req, res) => {
  try {
    // Extract book data from request
    const bookData = req.body;
    
    if (!bookData || !bookData.title || !bookData.chapters) {
      return res.status(400).json({
        success: false,
        error: 'Missing required book data'
      });
    }
    
    // For simplicity, we'll return a mock PDF URL
    // In a real implementation, this would generate a PDF and store it
    // You could use libraries like PDFKit on the server or use a PDF generation service
    
    const pdfUrl = `https://puzzlemakeribral-production.up.railway.app/api/static/sample-book.pdf`;
    
    return res.json({
      success: true,
      pdfUrl
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate PDF'
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