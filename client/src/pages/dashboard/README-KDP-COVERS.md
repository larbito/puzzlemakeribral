# KDP Covers Feature Documentation

This document provides an overview of the KDP Covers feature implementation.

## Overview

The KDP Covers feature allows users to generate professional-quality book covers for Amazon Kindle Direct Publishing (KDP) using AI. The feature supports:

- Generating front covers from text prompts
- Creating back covers
- Assembling full wrap covers with spine
- Calculating correct dimensions based on KDP specifications
- Downloading print-ready covers

## Implementation Details

### Frontend (React)

The main component is `KDPFullWrapGenerator.tsx`, which handles:

1. User input for book details (trim size, page count, paper type)
2. Prompt enhancement using OpenAI
3. Step-by-step workflow from prompt to final cover
4. Preview and download functionality

### Backend (Express)

The backend API routes are in:
- `backend/src/routes/book-cover.js` - Main KDP cover generation routes
- `backend/src/routes/openai.js` - OpenAI integration for prompt enhancement
- `backend/src/routes/ideogram.js` - Ideogram integration for image generation

### API Services

The feature integrates with multiple external services:
- OpenAI - For enhancing prompts and extracting text from images
- Ideogram - For generating high-quality book cover images
- Replicate - For enhancing and upscaling images

## Fault Tolerance

The implementation includes comprehensive error handling and fallback mechanisms:

1. **API Failures**: If external APIs fail, the system falls back to placeholder images
2. **Error Handling**: Detailed error logging and user-friendly error messages
3. **Input Validation**: Validation of all user inputs before API calls
4. **Graceful Degradation**: Even without API keys, the UI remains functional

## Maintenance Notes

When modifying this feature:

1. **Error Handling**: Always maintain robust error handling
2. **API Calls**: Log all API calls and responses for debugging
3. **Fallbacks**: Ensure fallback mechanisms work for every API call
4. **Testing**: Test with both valid and invalid API keys

## Environment Variables

For the feature to work fully, these environment variables are required:

- `OPENAI_API_KEY`: OpenAI API key for prompt enhancement
- `IDEOGRAM_API_KEY`: Ideogram API key for image generation
- `REPLICATE_API_KEY`: Replicate API key for image enhancement

Without these keys, the feature will still work but will use placeholder images.

## API Endpoints

The main API endpoints for this feature are:

- `POST /api/book-cover/calculate-dimensions` - Calculate dimensions based on book specs
- `POST /api/book-cover/generate-front` - Generate front cover
- `POST /api/book-cover/generate-back` - Generate back cover
- `POST /api/book-cover/assemble-full` - Create full wrap cover
- `GET /api/book-cover/download` - Download cover as image/PDF
- `POST /api/openai/enhance-prompt` - Enhance cover description
- `POST /api/book-cover/extract-colors` - Extract colors from front cover

## Future Improvements

Potential enhancements for this feature:

1. Add more customization options for covers
2. Support additional trim sizes and cover types
3. Implement book cover templates
4. Add text overlay editor for title/author placement
5. Support for hardcover books with dust jacket 