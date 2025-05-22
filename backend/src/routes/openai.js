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

module.exports = router; 