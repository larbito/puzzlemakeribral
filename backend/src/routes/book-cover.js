const express = require('express');
const router = express.Router();
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const sharp = require('sharp');
const { Readable } = require('stream');
const archiver = require('archiver');
const ColorThief = require('colorthief');
const path = require('path');
const fs = require('fs');
const { enhanceImage } = require('../controllers/imageEnhancementController');

// Define static directory for storing image files
const staticDir = path.join(__dirname, '..', '..', 'static');

// Create static directory if it doesn't exist
if (!fs.existsSync(staticDir)) {
  console.log(`Creating static directory: ${staticDir}`);
  fs.mkdirSync(staticDir, { recursive: true });
}

// Configure multer for handling form data
const upload = multer({
  limits: {
    fieldSize: 10 * 1024 * 1024 // 10MB limit
  }
});

console.log('Setting up book cover generator routes');

// Debug middleware to log request details
router.use((req, res, next) => {
  console.log('Book cover route request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    contentType: req.get('content-type')
  });
  next();
});

// Enhanced prompt processing function for Ideogram only
function enhanceIdeogramPrompt(originalPrompt) {
  // Ideogram works well with design terminology and creative style descriptions
  
  let prompt = originalPrompt;
  
  // Enhance with design-friendly keywords
  if (!prompt.includes('style') && !prompt.includes('vector') && !prompt.includes('design')) {
    // Add design style based on content
    if (prompt.includes('teen') || prompt.includes('young') || prompt.includes('puzzle')) {
      prompt = prompt.replace(/teen/gi, 'comic-style teen');
      prompt = prompt.replace(/puzzle/gi, 'pop-art puzzle');
    }
    if (prompt.includes('fantasy') || prompt.includes('magic')) {
      prompt = prompt.replace(/fantasy/gi, 'fantasy flat vector style');
    }
    if (prompt.includes('mystery') || prompt.includes('thriller')) {
      prompt = prompt.replace(/mystery/gi, 'noir-style mystery');
    }
    if (prompt.includes('romance')) {
      prompt = prompt.replace(/romance/gi, 'elegant romantic');
    }
  }
  
  // Replace literal terms with design-friendly language
  prompt = prompt.replace(/book cover/gi, 'front cover');
  prompt = prompt.replace(/flat design/gi, 'flat vector style');
  prompt = prompt.replace(/illustration/gi, 'flat vector illustration');
  prompt = prompt.replace(/cartoon/gi, 'comic-style');
  
  // Add design terminology if missing
  if (!prompt.includes('vector') && !prompt.includes('comic') && !prompt.includes('pop-art')) {
    prompt = `Comic-style ${prompt}`;
  }
  
  // Add Ideogram specific design instructions
  const ideogramInstructions = "Use design-friendly keywords. Bold typography with generous space from edges. Fun and bold flat vector style. High-contrast color palette. Leave all text inside print-safe area. Format: 6x9 inches, KDP-compliant front cover.";
  
  if (!prompt.includes('KDP-compliant') && !prompt.includes('print-safe')) {
    prompt = `${prompt} ${ideogramInstructions}`;
  }
  
  // Clean up formatting
  prompt = prompt.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  return prompt;
}

/**
 * Test endpoint to verify functionality
 * GET /api/book-cover/test
 */
router.get('/test', (req, res) => {
  res.json({ message: 'Book cover API is working!', timestamp: new Date().toISOString() });
});

/**
 * Calculate cover dimensions based on KDP specs
 * POST /api/book-cover/calculate-dimensions
 */
router.post('/calculate-dimensions', express.json(), async (req, res) => {
  try {
    console.log('Received calculate-dimensions request with body:', req.body);
    
    const { 
      trimSize, 
      pageCount, 
      paperColor, 
      bookType = 'paperback',
      includeBleed = true 
    } = req.body;

    if (!trimSize || !pageCount) {
      console.log('Missing required parameters:', { trimSize, pageCount });
      return res.status(400).json({ error: 'Trim size and page count are required' });
    }

    // Parse the trim size (format: "5x8", "6x9", etc.)
    const [widthStr, heightStr] = trimSize.split('x');
    const trimWidth = parseFloat(widthStr);
    const trimHeight = parseFloat(heightStr);

    if (isNaN(trimWidth) || isNaN(trimHeight)) {
      console.log('Invalid trim size format:', trimSize);
      return res.status(400).json({ error: 'Invalid trim size format' });
    }

    // Calculate spine width based on page count
    const pagesPerInch = paperColor === 'white' ? 434 : 370;
    const spineWidth = pageCount / pagesPerInch;

    // Add bleed (0.125" on each side)
    const bleed = includeBleed ? 0.125 : 0;
    
    // Calculate final dimensions
    const coverWidth = trimWidth + (bleed * 2);
    const coverHeight = trimHeight + (bleed * 2);
    const fullCoverWidth = (trimWidth * 2) + spineWidth + (bleed * 2);

    // Calculate pixel dimensions at 300 DPI
    const dpi = 300;
    const frontCoverPixelWidth = Math.round(coverWidth * dpi);
    const frontCoverPixelHeight = Math.round(coverHeight * dpi);
    const spinePixelWidth = Math.round(spineWidth * dpi);
    const fullCoverPixelWidth = Math.round(fullCoverWidth * dpi);
    const fullCoverPixelHeight = Math.round(coverHeight * dpi);

    const response = {
      dimensions: {
        frontCover: {
          width: coverWidth,
          height: coverHeight,
          widthPx: frontCoverPixelWidth,
          heightPx: frontCoverPixelHeight,
        },
        spine: {
          width: spineWidth,
          widthPx: spinePixelWidth,
        },
        fullCover: {
          width: fullCoverWidth,
          height: coverHeight,
          widthPx: fullCoverPixelWidth,
          heightPx: fullCoverPixelHeight,
        },
        bleed,
        dpi
      }
    };
    
    console.log('Sending dimensions response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error calculating dimensions:', error);
    res.status(500).json({ error: 'Failed to calculate cover dimensions' });
  }
});

/**
 * Generate front cover using Ideogram only
 * POST /api/book-cover/generate-front
 */
router.post('/generate-front', async (req, res) => {
  try {
    const { 
      title, 
      subtitle, 
      author, 
      genre, 
      style, 
      description,
      prompt, // Add support for direct prompt parameter
      customInstructions,
      width,
      height,
      negative_prompt,
      seed,
      model
    } = req.body;

    // Build base prompt - prioritize direct prompt parameter for back cover generation
    let basePrompt;
    if (prompt && prompt.trim()) {
      // Use direct prompt parameter (for back cover generation)
      basePrompt = prompt.trim();
    } else if (description && description.trim()) {
      // Use provided description as base
      basePrompt = description.trim();
    } else {
      // Build from components
      const titleText = title || 'Untitled Book';
      const genreText = genre || 'fiction';
      const styleText = style || 'modern';
      
      basePrompt = `${titleText} book. ${genreText} genre. ${styleText} style.`;
      if (subtitle) basePrompt += ` Subtitle: ${subtitle}.`;
      if (author) basePrompt += ` Author: ${author}.`;
    }

    // Add custom instructions if provided
    if (customInstructions && customInstructions.trim()) {
      basePrompt += ` ${customInstructions.trim()}`;
    }

    // Apply Ideogram optimization to ALL prompts
    const optimizedPrompt = enhanceIdeogramPrompt(basePrompt);

    console.log(`Generating Ideogram cover with optimized prompt:`, optimizedPrompt);

    const imageUrl = await generateIdeogramCover(optimizedPrompt);

    res.json({ 
      success: true, 
      url: imageUrl, // Also return as 'url' for compatibility
      imageUrl,
      prompt: optimizedPrompt,
      model: 'ideogram'
    });

  } catch (error) {
    console.error('Error generating front cover:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate cover'
    });
  }
});

/**
 * Generate enhanced back cover prompt using GPT-4 (for preview)
 * POST /api/book-cover/generate-back-prompt
 */
router.post('/generate-back-prompt', express.json(), async (req, res) => {
  try {
    console.log('🧠 GPT-4 Back Prompt Preview Generation Request');
    console.log('Request body:', req.body);
    
    const { 
      frontPrompt,
      includeBackText = false,
      backCustomText = '',
      includeInteriorImages = false,
      interiorImagesCount = 0,
      userContentDescription = ''
    } = req.body;
    
    if (!frontPrompt || frontPrompt.trim() === '') {
      console.error('Missing required parameter: frontPrompt');
      return res.status(400).json({ 
        status: 'error', 
        message: 'Front cover prompt is required' 
      });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not available');
      return res.status(500).json({
        status: 'error',
        message: 'OpenAI API key not configured. GPT-4 is required for prompt generation.'
      });
    }

    console.log('🧠 Generating visual prompt with GPT-4...');
    
    // Build dynamic prompt based on user selections
    let userContentDesc = '';
    
    if (includeBackText && backCustomText.trim()) {
      userContentDesc = `Design a layout in the same style as the front cover. Keep an elegant section for this text: "${backCustomText.trim()}".`;
    }
    
    if (includeInteriorImages && interiorImagesCount > 0) {
      if (userContentDesc) {
        userContentDesc += ` Also leave space for displaying ${interiorImagesCount} interior preview images.`;
      } else {
        userContentDesc = `Create a design layout matching the front cover style. Leave space for displaying ${interiorImagesCount} interior preview images.`;
      }
    }
    
    if (!userContentDesc) {
      userContentDesc = 'Create a pure visual design matching the front cover style.';
    }
    
    const gpt4Messages = [
      {
        "role": "system",
        "content": `You are an AI image generation prompt specialist. Your task is to create visual prompts for image generation that match and complement existing designs.

IMPORTANT GUIDELINES:
- Focus purely on visual style, colors, background, and artistic elements
- Create a design that visually matches the provided front cover style
- Never mention "back cover", "book cover", or publishing terms
- Generate prompts for pure visual/artistic image creation
- Ensure the design can accommodate user content when specified
- Match the artistic style, color palette, and background elements of the original`
      },
      {
        "role": "user", 
        "content": `Create a visual design that matches this front cover style:

FRONT COVER DESIGN: "${frontPrompt}"

REQUIREMENTS:
${userContentDesc}

Generate a design prompt that:
1. Uses the SAME artistic style, colors, and background as the front design
2. Creates a complementary visual that belongs to the same artistic piece
${includeBackText ? `3. Includes this exact text in an elegant, readable layout: "${backCustomText.trim()}"` : ''}
${includeInteriorImages ? `3. Leaves designated space for displaying ${interiorImages.length} interior preview images` : ''}
${includeBackText && includeInteriorImages ? `4. Balances both text content and image spaces harmoniously` : ''}

Return only the visual generation prompt, nothing else.`
      }
    ];
    
    const gpt4Response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: gpt4Messages,
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    if (!gpt4Response.ok) {
      const errorData = await gpt4Response.json();
      console.error('GPT-4 API Error:', errorData);
      throw new Error(`GPT-4 API Error: ${errorData.error?.message || gpt4Response.statusText}`);
    }
    
    const gpt4Data = await gpt4Response.json();
    const enhancedPrompt = gpt4Data.choices[0]?.message?.content?.trim();
    
    if (!enhancedPrompt) {
      throw new Error('No enhanced prompt returned from GPT-4');
    }
    
    console.log('✅ GPT-4 Enhanced Visual Prompt:', enhancedPrompt);

    res.json({
      status: 'success',
      enhancedPrompt: enhancedPrompt,
      method: 'gpt4_enhanced',
      usage: gpt4Data.usage,
      message: 'Enhanced prompt generated using GPT-4'
    });

  } catch (error) {
    console.error('❌ Error in GPT-4 prompt generation:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to generate prompt',
      details: error.message
    });
  }
});

/**
 * Generate back cover based on front cover prompt (AI-only)
 * POST /api/book-cover/generate-back
 */
router.post('/generate-back', upload.none(), async (req, res) => {
  try {
    console.log('=== Visual Design Generation Request ===');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    const { 
      frontCoverPrompt,
      includeBackText = false,
      backCustomText = '',
      includeInteriorImages = false,
      interiorImages = [],
      generatedBackPrompt = '', // Pre-generated prompt from frontend
      width = 1800,
      height = 2700
    } = req.body;
    
    if (!frontCoverPrompt) {
      console.error('Missing required parameter: frontCoverPrompt');
      return res.status(400).json({ 
        status: 'error', 
        message: 'Front cover prompt is required' 
      });
    }

    if (!includeBackText && !includeInteriorImages) {
      console.error('No content options selected');
      return res.status(400).json({ 
        status: 'error', 
        message: 'Please select at least one content option (custom text or interior images)' 
      });
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return res.status(500).json({ 
        status: 'error', 
        message: 'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.' 
      });
    }
    
    console.log('🧠 Generating visual prompt with GPT-4...');
    
    // Use pre-generated prompt if available, otherwise generate new one
    let enhancedPrompt = generatedBackPrompt;
    let gpt4Data = null; // Initialize to handle both cases
    
    if (!enhancedPrompt) {
      // Build dynamic prompt based on user selections
      let userContentDesc = '';
      
      if (includeBackText && backCustomText.trim()) {
        userContentDesc = `Design a layout in the same style as the front cover. Keep an elegant section for this text: "${backCustomText.trim()}".`;
      }
      
      if (includeInteriorImages && interiorImages.length > 0) {
        if (userContentDesc) {
          userContentDesc += ` Also leave space for displaying ${interiorImages.length} interior preview images.`;
        } else {
          userContentDesc = `Create a design layout matching the front cover style. Leave space for displaying ${interiorImages.length} interior preview images.`;
        }
      }
      
      if (!userContentDesc) {
        userContentDesc = 'Create a pure visual design matching the front cover style.';
      }
      
      const gpt4Messages = [
        {
          "role": "system",
          "content": `You are an AI image generation prompt specialist. Your task is to create visual prompts for image generation that match and complement existing designs.

IMPORTANT GUIDELINES:
- Focus purely on visual style, colors, background, and artistic elements
- Create a design that visually matches the provided front cover style
- Never mention "back cover", "book cover", or publishing terms
- Generate prompts for pure visual/artistic image creation
- Ensure the design can accommodate user content when specified
- Match the artistic style, color palette, and background elements of the original`
        },
        {
          "role": "user", 
          "content": `Create a visual design that matches this front cover style:

FRONT COVER DESIGN: "${frontCoverPrompt}"

REQUIREMENTS:
${userContentDesc}

Generate a design prompt that:
1. Uses the SAME artistic style, colors, and background as the front design
2. Creates a complementary visual that belongs to the same artistic piece
${includeBackText ? `3. Includes this exact text in an elegant, readable layout: "${backCustomText.trim()}"` : ''}
${includeInteriorImages ? `3. Leaves designated space for displaying ${interiorImages.length} interior preview images` : ''}
${includeBackText && includeInteriorImages ? `4. Balances both text content and image spaces harmoniously` : ''}

Return only the visual generation prompt, nothing else.`
        }
      ];
      
      const gpt4Response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: gpt4Messages,
          max_tokens: 300,
          temperature: 0.7
        })
      });
      
      if (!gpt4Response.ok) {
        const errorData = await gpt4Response.json();
        console.error('GPT-4 API Error:', errorData);
        throw new Error(`GPT-4 API Error: ${errorData.error?.message || gpt4Response.statusText}`);
      }
      
      gpt4Data = await gpt4Response.json();
      enhancedPrompt = gpt4Data.choices[0]?.message?.content?.trim();
      
      if (!enhancedPrompt) {
        throw new Error('No enhanced prompt returned from GPT-4');
      }
      
      console.log('✅ GPT-4 Enhanced Visual Prompt:', enhancedPrompt);
    } else {
      console.log('✅ Using pre-generated prompt:', enhancedPrompt);
    }
    
    console.log('🎨 Generating image with Ideogram...');
    
    // Generate image with Ideogram
    const imageResponse = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Api-Key': process.env.IDEOGRAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_request: {
          prompt: enhancedPrompt,
          aspect_ratio: "ASPECT_2_3",
          model: "V_2",
          magic_prompt_option: "ON",
          seed: Math.floor(Math.random() * 2147483647)
        }
      })
    });
    
    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error('Ideogram API Error:', errorData);
      throw new Error(`Ideogram API Error: ${errorData.error?.message || imageResponse.statusText}`);
    }
    
    const imageData = await imageResponse.json();
    const imageUrl = imageData.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from Ideogram API');
    }
    
    console.log('✅ Visual design generated successfully');
    
    res.json({
      status: 'success',
      url: imageUrl,
      enhancedPrompt: enhancedPrompt,
      finalPrompt: enhancedPrompt,
      gpt4Usage: gpt4Data?.usage || null
    });
    
  } catch (error) {
    console.error('Error in visual design generation:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate visual design'
    });
  }
});

/**
 * Assemble full cover (front, spine, back)
 * POST /api/book-cover/assemble-full
 */
router.post('/assemble-full', upload.none(), async (req, res) => {
  try {
    const {
      frontCoverUrl,
      dimensions,
      spineText,
      spineColor,
      interiorImagesUrls = [],
      bookTitle,
      authorName
    } = req.body;

    if (!frontCoverUrl || !dimensions) {
      return res.status(400).json({ error: 'Front cover URL and dimensions are required' });
    }

    // Parse dimensions if they're passed as a string
    const dims = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
    
    // Download the front cover image
    const frontCoverResponse = await fetch(frontCoverUrl);
    if (!frontCoverResponse.ok) {
      throw new Error(`Failed to download front cover image: ${frontCoverResponse.statusText}`);
    }
    const frontCoverBuffer = await frontCoverResponse.buffer();
    
    // Resize the front cover if needed to match the target dimensions
    const resizedFrontCover = await sharp(frontCoverBuffer)
      .resize({
        width: dims.frontCover.widthPx,
        height: dims.frontCover.heightPx,
        fit: 'fill'
      })
      .toBuffer();
    
    // Create a blank canvas for the full cover
    const fullCover = sharp({
      create: {
        width: dims.fullCover.widthPx,
        height: dims.fullCover.heightPx,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
    
    // Create the spine
    const spineBuffer = await createSpine(
      dims.spine.widthPx, 
      dims.fullCover.heightPx, 
      spineText, 
      spineColor || '#000000',
      bookTitle,
      authorName
    );
    
    // Create the back cover (either a mirrored front cover or with interior images)
    const backCoverBuffer = await createBackCover(
      dims.frontCover.widthPx,
      dims.frontCover.heightPx,
      interiorImagesUrls,
      frontCoverBuffer
    );
    
    // Composite the three parts
    const compositeImage = await fullCover.composite([
      { 
        input: backCoverBuffer, 
        left: 0, 
        top: 0 
      },
      { 
        input: spineBuffer, 
        left: dims.frontCover.widthPx, 
        top: 0 
      },
      { 
        input: resizedFrontCover, 
        left: dims.frontCover.widthPx + dims.spine.widthPx, 
        top: 0 
      }
    ]).png().toBuffer();
    
    // Return the assembled cover as a base64 encoded string
    res.json({
      fullCover: `data:image/png;base64,${compositeImage.toString('base64')}`,
      dimensions: dims
    });
  } catch (error) {
    console.error('Error assembling full cover:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to assemble full cover',
      type: error.name
    });
  }
});

/**
 * Download the cover image at specified dimensions and format
 * GET /api/book-cover/download
 */
router.get('/download', async (req, res) => {
  try {
    const { url, format = 'png', filename, width, height } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Decode if the URL is a base64 data URL
    let imageBuffer;
    if (url.startsWith('data:image')) {
      const base64Data = url.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Download the image from the URL
      const imageResponse = await fetch(url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      imageBuffer = await imageResponse.buffer();
    }
    
    // Process the image with sharp
    let processedImage = sharp(imageBuffer);
    
    // Resize if dimensions are provided
    if (width && height) {
      processedImage = processedImage.resize({
        width: parseInt(width),
        height: parseInt(height),
        fit: 'fill'
      });
    }
    
    // Convert to requested format
    if (format === 'pdf') {
      // For PDF, we keep the PNG and let the browser handle PDF conversion
      // since sharp doesn't support PDF output directly
      processedImage = processedImage.png();
      res.setHeader('Content-Type', 'application/pdf');
    } else if (format === 'jpg' || format === 'jpeg') {
      processedImage = processedImage.jpeg({ quality: 95 });
      res.setHeader('Content-Type', 'image/jpeg');
    } else {
      // Default to PNG
      processedImage = processedImage.png();
      res.setHeader('Content-Type', 'image/png');
    }
    
    // Get the final buffer
    const outputBuffer = await processedImage.toBuffer();
    
    // Set appropriate headers for download
    const defaultFilename = `book-cover.${format === 'pdf' ? 'pdf' : (format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png')}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename || defaultFilename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the processed image
    res.send(outputBuffer);
  } catch (error) {
    console.error('Error downloading cover:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to download cover',
      type: error.name
    });
  }
});

/**
 * Extract dominant colors from images (enhanced for spine color selection)
 * POST /api/book-cover/extract-colors
 */
router.post('/extract-colors', express.json(), async (req, res) => {
  try {
    console.log('Received enhanced extract-colors request');
    
    const { frontCoverUrl, backCoverUrl } = req.body;
    
    if (!frontCoverUrl) {
      console.error('Missing required parameter: frontCoverUrl');
      return res.status(400).json({ error: 'Front cover URL is required' });
    }
    
    const imageUrls = [frontCoverUrl];
    if (backCoverUrl) {
      imageUrls.push(backCoverUrl);
    }
    
    console.log(`Extracting colors from ${imageUrls.length} image(s)`);
    
    const allColors = [];
    
    // Process each image
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const imageType = i === 0 ? 'front' : 'back';
      
      try {
        console.log(`Fetching ${imageType} cover from:`, imageUrl.substring(0, 50) + '...');
        
        // Fetch the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to fetch ${imageType} cover: ${imageResponse.statusText}`);
          continue;
        }
        
        const imageBuffer = await imageResponse.buffer();
        
        // Save the image temporarily
        const tempImagePath = `/tmp/temp-${imageType}-image-${Date.now()}.jpg`;
        await sharp(imageBuffer).jpeg().toFile(tempImagePath);
        
        // Get the dominant colors (extract more colors per image)
        console.log(`Extracting color palette from ${imageType} cover`);
        const palette = await ColorThief.getPalette(tempImagePath, 8); // 8 colors per image
        
        // Convert RGB arrays to hex colors and add metadata
        const colors = palette.map(color => {
          const [r, g, b] = color;
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          
          // Calculate luminance for color analysis
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          
          return {
            hex,
            rgb: { r, g, b },
            luminance,
            source: imageType,
            // Calculate color temperature (warm vs cool)
            temperature: r > b ? 'warm' : 'cool'
          };
        });
        
        allColors.push(...colors);
        
        // Clean up temp file
        try {
          require('fs').unlinkSync(tempImagePath);
        } catch (err) {
          console.warn('Could not delete temp file:', err.message);
        }
        
      } catch (error) {
        console.error(`Error processing ${imageType} cover:`, error);
        // Continue with other images
      }
    }
    
    if (allColors.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to extract colors from any images'
      });
    }
    
    // Curate the best 10 colors for spine selection
    const curatedColors = curateSpineColors(allColors);
    
    console.log(`Extracted and curated ${curatedColors.length} colors for spine selection`);
    
    res.json({
      status: 'success',
      colors: curatedColors.map(c => c.hex), // Return just hex values for UI
      colorDetails: curatedColors, // Full color data for advanced use
      totalExtracted: allColors.length,
      sources: imageUrls.length === 2 ? ['front', 'back'] : ['front']
    });
    
  } catch (error) {
    console.error('Error extracting colors:', error);
    res.status(500).json({ 
      error: 'Failed to extract colors from images',
      details: error.message
    });
  }
});

/**
 * Helper function to curate the best colors for spine selection
 */
function curateSpineColors(allColors) {
  // Remove very similar colors and select diverse, readable options
  const uniqueColors = [];
  const seenColors = new Set();
  
  // Sort colors by luminance and diversity
  const sortedColors = allColors.sort((a, b) => {
    // Prefer colors with moderate luminance (better for text)
    const aScore = Math.abs(a.luminance - 0.5) * -1 + Math.random() * 0.1;
    const bScore = Math.abs(b.luminance - 0.5) * -1 + Math.random() * 0.1;
    return bScore - aScore;
  });
  
  for (const color of sortedColors) {
    // Check if color is too similar to existing colors
    let tooSimilar = false;
    for (const existing of uniqueColors) {
      const colorDistance = Math.sqrt(
        Math.pow(color.rgb.r - existing.rgb.r, 2) +
        Math.pow(color.rgb.g - existing.rgb.g, 2) +
        Math.pow(color.rgb.b - existing.rgb.b, 2)
      );
      
      if (colorDistance < 50) { // Threshold for similarity
        tooSimilar = true;
        break;
      }
    }
    
    if (!tooSimilar && !seenColors.has(color.hex)) {
      uniqueColors.push(color);
      seenColors.add(color.hex);
      
      if (uniqueColors.length >= 10) break;
    }
  }
  
  // If we don't have enough unique colors, add some standard spine-friendly colors
  const fallbackColors = [
    { hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, luminance: 0, source: 'default', temperature: 'neutral' },
    { hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, luminance: 1, source: 'default', temperature: 'neutral' },
    { hex: '#2C3E50', rgb: { r: 44, g: 62, b: 80 }, luminance: 0.2, source: 'default', temperature: 'cool' },
    { hex: '#8B4513', rgb: { r: 139, g: 69, b: 19 }, luminance: 0.3, source: 'default', temperature: 'warm' }
  ];
  
  for (const fallback of fallbackColors) {
    if (uniqueColors.length >= 10) break;
    
    let exists = uniqueColors.some(c => c.hex === fallback.hex);
    if (!exists) {
      uniqueColors.push(fallback);
    }
  }
  
  return uniqueColors.slice(0, 10);
}

/**
 * Generate full wrap cover
 * POST /api/book-cover/generate-full-wrap
 */
router.post('/generate-full-wrap', express.json(), async (req, res) => {
  try {
    console.log('Received request to generate full wrap cover');
    
    const { 
      frontCoverUrl, 
      trimSize,
      paperType, 
      pageCount,
      spineColor,
      spineText,
      addSpineText,
      interiorImages = []
    } = req.body;
    
    if (!frontCoverUrl) {
      console.error('Missing required parameter: frontCoverUrl');
      return res.status(400).json({ error: 'Front cover URL is required' });
    }
    
    if (!trimSize || !paperType || !pageCount) {
      console.error('Missing required parameters:', { trimSize, paperType, pageCount });
      return res.status(400).json({ error: 'Trim size, paper type, and page count are required' });
    }
    
    // Parse trim size
    const [widthInches, heightInches] = trimSize.split('x').map(Number);
    
    // Calculate spine width based on page count and paper type
    let spineWidthMultiplier;
    if (paperType === 'white') {
      spineWidthMultiplier = 0.002252; // For white paper: pages * 0.002252" (KDP's formula)
    } else if (paperType === 'cream') {
      spineWidthMultiplier = 0.0025; // For cream paper: pages * 0.0025" (KDP's formula)
    } else {
      spineWidthMultiplier = 0.002347; // For color paper: pages * 0.002347" (approximate)
    }
    
    const spineWidthInches = pageCount * spineWidthMultiplier;
    
    // Add bleed (0.125" on all sides)
    const bleedInches = 0.125;
    
    // Calculate total width: front + spine + back + bleed
    const totalWidthInches = (widthInches * 2) + spineWidthInches + (bleedInches * 2);
    const totalHeightInches = heightInches + (bleedInches * 2);
    
    // Convert to pixels at 300 DPI
    const dpi = 300;
    const frontWidthPx = Math.round(widthInches * dpi);
    const frontHeightPx = Math.round(heightInches * dpi);
    const spineWidthPx = Math.round(spineWidthInches * dpi);
    const totalWidthPx = Math.round(totalWidthInches * dpi);
    const totalHeightPx = Math.round(totalHeightInches * dpi);
    
    console.log('Calculated dimensions:', {
      frontWidthPx,
      frontHeightPx,
      spineWidthPx,
      totalWidthPx,
      totalHeightPx
    });
    
    // Download the front cover image
    console.log('Downloading front cover from:', frontCoverUrl.substring(0, 50) + '...');
    
    let frontCoverBuffer;
    
    if (frontCoverUrl.startsWith('data:')) {
      // Handle data URL (base64 image)
      console.log('Processing data URL...');
      const base64Data = frontCoverUrl.split(',')[1];
      frontCoverBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Handle regular URL
      console.log('Fetching from URL...');
      const frontCoverResponse = await fetch(frontCoverUrl);
      if (!frontCoverResponse.ok) {
        throw new Error(`Failed to download front cover: ${frontCoverResponse.statusText}`);
      }
      frontCoverBuffer = await frontCoverResponse.buffer();
    }
    
    // Resize front cover if needed
    const resizedFrontCover = await sharp(frontCoverBuffer)
      .resize({
        width: frontWidthPx,
        height: frontHeightPx,
        fit: 'fill'
      })
      .toBuffer();
    
    // Create the spine
    console.log('Creating spine with:', {
      width: spineWidthPx,
      height: totalHeightPx,
      spineText: spineText || '',
      spineColor: spineColor || '#000000',
      addSpineText: !!addSpineText
    });
    
    const spineBuffer = await createSpine(
      spineWidthPx,
      totalHeightPx,
      addSpineText && spineText ? spineText : '',
      spineColor || '#000000',
      '', // Book title (using spineText instead)
      ''  // Author name (using spineText instead)
    );
    
    // Create the back cover
    console.log('Creating back cover with interior images:', interiorImages.length);
    const backCoverBuffer = await createBackCover(
      frontWidthPx,
      frontHeightPx,
      interiorImages,
      frontCoverBuffer
    );
    
    // Create a blank canvas for the full cover
    const fullCover = sharp({
      create: {
        width: totalWidthPx,
        height: totalHeightPx,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
    
    // Composite the three parts: back cover, spine, front cover
    console.log('Compositing full wrap cover');
    const fullCoverBuffer = await fullCover.composite([
      {
        input: backCoverBuffer,
        left: 0,
        top: 0
      },
      {
        input: spineBuffer,
        left: frontWidthPx,
        top: 0
      },
      {
        input: resizedFrontCover,
        left: frontWidthPx + spineWidthPx,
        top: 0
      }
    ]).jpeg({ quality: 100 }).toBuffer();
    
    // Save to a temporary file and return its URL
    const filename = `kdp-full-wrap-${Date.now()}.jpg`;
    const tempFilePath = `/tmp/${filename}`;
    
    await sharp(fullCoverBuffer).toFile(tempFilePath);
    
    // For a real production app, we would upload this to S3 or similar storage
    // For now, we'll return as base64 for demo purposes
    const base64Image = `data:image/jpeg;base64,${fullCoverBuffer.toString('base64')}`;
    
    res.json({
      status: 'success',
      url: base64Image,
      dimensions: {
        width: totalWidthPx,
        height: totalHeightPx,
        trimSize,
        paperType,
        pageCount,
        spineWidthInches: spineWidthInches.toFixed(3),
        totalWidthInches: totalWidthInches.toFixed(2),
        totalHeightInches: totalHeightInches.toFixed(2),
        dpi
      }
    });
  } catch (error) {
    console.error('Error generating full wrap cover:', error);
    res.status(500).json({
      error: 'Failed to generate full wrap cover',
      details: error.message
    });
  }
});

/**
 * Enhance cover image quality using Real-ESRGAN
 * POST /api/book-cover/enhance
 */
router.post('/enhance', upload.none(), async (req, res) => {
  try {
    console.log('=== Book Cover Enhancement Request ===');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    const { imageUrl, target } = req.body;
    
    if (!imageUrl) {
      console.error('Missing required parameter: imageUrl');
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Create a mock file object for the enhanceImage controller
    const mockFile = {
      buffer: await (await fetch(imageUrl)).buffer()
    };

    // Call the existing image enhancement controller
    const mockReq = {
      file: mockFile,
      body: {
        scale: 2 // Use a moderate scale factor for book covers
      }
    };

    // Create a mock response to capture the enhancement result
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };

    // Call the enhancement controller
    await enhanceImage(mockReq, mockRes);

    // Check if enhancement was successful
    if (mockRes.data?.success && mockRes.data?.predictionId) {
      res.json({
        success: true,
        message: 'Enhancement initiated',
        predictionId: mockRes.data.predictionId,
        status: mockRes.data.status,
        statusEndpoint: mockRes.data.statusEndpoint
      });
    } else {
      throw new Error('Enhancement failed');
    }
  } catch (error) {
    console.error('Error enhancing book cover:', error);
    res.status(500).json({ 
      error: 'Failed to enhance book cover',
      details: error.message
    });
  }
});

/**
 * Prompt enhancement endpoint
 * POST /api/book-cover/enhance-prompt
 */
router.post('/enhance-prompt', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!model || !['dalle', 'ideogram'].includes(model)) {
      return res.status(400).json({ error: 'Valid model (dalle or ideogram) is required' });
    }
    
    let enhancedPrompt;
    
    if (model === 'dalle') {
      enhancedPrompt = enhanceDallePrompt(prompt);
    } else {
      enhancedPrompt = enhanceIdeogramPrompt(prompt);
    }
    
    res.json({ 
      originalPrompt: prompt,
      enhancedPrompt: enhancedPrompt,
      model: model,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    res.status(500).json({ error: 'Failed to enhance prompt' });
  }
});

/**
 * Health check endpoint
 * GET /api/book-cover/health
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Helper function to create a spine image
 */
async function createSpine(width, height, spineText, spineColor, bookTitle, authorName) {
  // Create a solid color spine
  const spineImage = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: parseColor(spineColor)
    }
  });
  
  // If spine text is provided, add it to the spine
  if (spineText) {
    // We would add text overlay here, but sharp doesn't support text
    // For a real implementation, consider using canvas or another library
    // This is a placeholder
    console.log('Adding spine text:', spineText);
  }
  
  return spineImage.png().toBuffer();
}

/**
 * Helper function to create a back cover
 */
async function createBackCover(width, height, interiorImagesUrls, frontCoverBuffer) {
  // If there are interior images, create a grid layout
  if (interiorImagesUrls && interiorImagesUrls.length > 0) {
    try {
      // Create a white background with target dimensions
      const backCover = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      });
      
      // Download all interior images
      const imageBuffers = [];
      for (const imageUrl of interiorImagesUrls) {
        try {
          // Handle both URLs and data URLs
          let imageBuffer;
          if (imageUrl.startsWith('data:image')) {
            const base64Data = imageUrl.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
              console.error(`Failed to download interior image: ${imageResponse.statusText}`);
              continue;
            }
            imageBuffer = await imageResponse.buffer();
          }
          
          imageBuffers.push(imageBuffer);
        } catch (error) {
          console.error('Error processing interior image:', error);
          // Continue with other images
        }
      }
      
      // If no images were successfully downloaded, return a styled mirrored front cover
      if (imageBuffers.length === 0) {
        return sharp(frontCoverBuffer)
          .resize(width, height, { fit: 'fill' }) // Ensure exact target dimensions
          .flop() // Mirror horizontally
          .modulate({ saturation: 0.8, brightness: 0.9 }) // Slightly desaturate and darken
          .composite([{
            input: {
              create: {
                width,
                height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0.3 }
              }
            },
            blend: 'overlay'
          }])
          .jpeg({ quality: 95 })
          .toBuffer();
      }
      
      // Calculate grid dimensions based on the number of images
      const rows = imageBuffers.length <= 2 ? 1 : 2;
      const cols = imageBuffers.length === 1 ? 1 : 2;
      
      // Calculate image size in the grid
      const margin = Math.max(30, Math.floor(Math.min(width, height) * 0.05)); // Responsive margin
      const gridWidth = width - (margin * 2);
      const gridHeight = height - (margin * 2);
      const imageWidth = Math.floor((gridWidth - (margin * (cols - 1))) / cols);
      const imageHeight = Math.floor((gridHeight - (margin * (rows - 1))) / rows);
      
      // Resize and position each image for compositing
      const composites = [];
      for (let i = 0; i < Math.min(imageBuffers.length, rows * cols); i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Resize the image
        const resizedImage = await sharp(imageBuffers[i])
          .resize({
            width: imageWidth,
            height: imageHeight,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .toBuffer();
        
        // Calculate position
        const left = margin + (col * (imageWidth + margin));
        const top = margin + (row * (imageHeight + margin));
        
        composites.push({
          input: resizedImage,
          left,
          top
        });
      }
      
      // Add text "Interior Preview" at the top
      const textOverlay = await createTextOverlay("Interior Preview", width, Math.floor(height * 0.08));
      composites.unshift({
        input: textOverlay,
        left: 0,
        top: Math.floor(height * 0.02)
      });
      
      // Composite all images onto the back cover and ensure exact dimensions
      return backCover.composite(composites)
        .resize(width, height, { fit: 'fill' })
        .jpeg({ quality: 95 })
        .toBuffer();
    } catch (error) {
      console.error('Error creating back cover with interior images:', error);
      // Fallback to styled mirrored front cover with exact dimensions
      return sharp(frontCoverBuffer)
        .resize(width, height, { fit: 'fill' })
        .flop() // Mirror horizontally
        .modulate({ saturation: 0.8, brightness: 0.9 }) // Slightly desaturate and darken
        .composite([{
          input: {
            create: {
              width,
              height,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0.3 }
            }
          },
          blend: 'overlay'
        }])
        .jpeg({ quality: 95 })
        .toBuffer();
    }
  } else {
    // If no interior images, use a styled mirrored version of the front cover
    return sharp(frontCoverBuffer)
      .resize(width, height, { fit: 'fill' }) // Ensure exact target dimensions
      .flop() // Mirror horizontally
      .modulate({ saturation: 0.8, brightness: 0.9 }) // Slightly desaturate and darken
      .composite([{
        input: {
          create: {
            width,
            height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0.3 }
          }
        },
        blend: 'overlay'
      }])
      .jpeg({ quality: 95 })
      .toBuffer();
  }
}

/**
 * Helper function to create a text overlay
 * Note: Since sharp doesn't support text rendering, this is a workaround
 * using a solid color rectangle with alpha channel
 */
async function createTextOverlay(text, width, height) {
  // Create a semi-transparent background
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.1 }
    }
  }).png().toBuffer();
  
  // In a real implementation, you would use a library like canvas
  // to render text properly onto an image
}

/**
 * Helper function to parse color from string to rgba object
 */
function parseColor(color) {
  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return { r, g, b, alpha: 1 };
  }
  
  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        alpha: match[4] ? parseFloat(match[4]) : 1
      };
    }
  }
  
  // Default to black
  return { r: 0, g: 0, b: 0, alpha: 1 };
}

// Helper function to generate cover using Ideogram
async function generateIdeogramCover(prompt) {
  console.log('Generating Ideogram cover with prompt:', prompt);
  
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('aspect_ratio', '2x3'); // Standard book cover ratio
  form.append('rendering_speed', 'DEFAULT');
  form.append('style_type', 'REALISTIC');
  form.append('num_images', '1');
  form.append('seed', Math.floor(Math.random() * 1000000).toString());
  
  const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.IDEOGRAM_API_KEY,
      ...form.getHeaders()
    },
    body: form
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ideogram API error:', errorText);
    throw new Error('Failed to generate image with Ideogram');
  }
  
  const data = await response.json();
  
  // Handle different response formats
  let imageUrl = data?.data?.[0]?.url || data?.images?.[0]?.url || data?.url;
  
  if (!imageUrl) {
    console.error('No image URL found in Ideogram response:', data);
    throw new Error('No image URL in API response');
  }
  
  return imageUrl;
}

module.exports = router; 