/**
 * Helper functions for working with the Replicate API for background removal and image enhancement
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

// Environment variables for API keys should be set in your Railway environment
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || '';

/**
 * Remove background from an image using Replicate API
 * @param imagePath Path to the source image file
 * @param outputPath Path where the background-removed image should be saved
 */
export async function removeBackground(imagePath: string, outputPath: string): Promise<boolean> {
  try {
    console.log('Starting background removal with Replicate API');
    
    // Check if API key is configured
    if (!REPLICATE_API_KEY) {
      console.error('REPLICATE_API_KEY is not set in environment');
      return false;
    }
    
    // Model ID for background removal (using U-2-Net as an example)
    const MODEL_ID = 'lucataco/remove-bg';
    
    // Read the image file
    const imageBuffer = await fs.promises.readFile(imagePath);
    
    // Convert the image to base64
    const base64Image = imageBuffer.toString('base64');
    
    // API call to Replicate for prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: '3b2e70fc971228bf16f71c3d63c2f0a11766fe00d0a02bb4dde2aac3fbbbf04a',
        input: {
          image: `data:image/png;base64,${base64Image}`
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }
    
    // Get the prediction ID and poll for completion
    const prediction = await response.json() as any;
    const predictionId = prediction.id;
    
    console.log(`Background removal prediction started with ID: ${predictionId}`);
    
    // Poll for completion
    let isComplete = false;
    let resultUrl = '';
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!isComplete && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json() as any;
      
      if (statusData.status === 'succeeded') {
        isComplete = true;
        resultUrl = statusData.output;
        console.log('Background removal completed successfully');
        break;
      } else if (statusData.status === 'failed') {
        throw new Error(`Background removal failed: ${statusData.error || 'Unknown error'}`);
      }
      
      console.log(`Waiting for background removal to complete (attempt ${attempts}/${maxAttempts})...`);
    }
    
    if (!isComplete || !resultUrl) {
      throw new Error('Background removal timed out');
    }
    
    // Download the result
    const resultResponse = await fetch(resultUrl);
    
    if (!resultResponse.ok) {
      throw new Error(`Failed to download background removal result: ${resultResponse.status}`);
    }
    
    const resultBuffer = await resultResponse.arrayBuffer();
    
    // Save the result to the output path
    await fs.promises.writeFile(outputPath, Buffer.from(resultBuffer));
    
    return true;
  } catch (error) {
    console.error('Error in removeBackground:', error);
    return false;
  }
}

/**
 * Enhance image quality using Real-ESRGAN upscaler on Replicate
 * @param imagePath Path to the source image file
 * @param outputPath Path where the enhanced image should be saved
 */
export async function enhanceImage(imagePath: string, outputPath: string): Promise<boolean> {
  try {
    console.log('Starting image enhancement with Replicate API');
    
    // Check if API key is configured
    if (!REPLICATE_API_KEY) {
      console.error('REPLICATE_API_KEY is not set in environment');
      return false;
    }
    
    // Model ID for image enhancement (using Real-ESRGAN as an example)
    const MODEL_ID = 'nightmareai/real-esrgan';
    
    // Read the image file
    const imageBuffer = await fs.promises.readFile(imagePath);
    
    // Convert the image to base64
    const base64Image = imageBuffer.toString('base64');
    
    // API call to Replicate for prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        input: {
          image: `data:image/png;base64,${base64Image}`,
          scale: 2, // Scale factor (2x, 3x, 4x)
          face_enhance: true // Enhanced face details
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }
    
    // Get the prediction ID and poll for completion
    const prediction = await response.json() as any;
    const predictionId = prediction.id;
    
    console.log(`Image enhancement prediction started with ID: ${predictionId}`);
    
    // Poll for completion
    let isComplete = false;
    let resultUrl = '';
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!isComplete && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json() as any;
      
      if (statusData.status === 'succeeded') {
        isComplete = true;
        resultUrl = statusData.output;
        console.log('Image enhancement completed successfully');
        break;
      } else if (statusData.status === 'failed') {
        throw new Error(`Image enhancement failed: ${statusData.error || 'Unknown error'}`);
      }
      
      console.log(`Waiting for image enhancement to complete (attempt ${attempts}/${maxAttempts})...`);
    }
    
    if (!isComplete || !resultUrl) {
      throw new Error('Image enhancement timed out');
    }
    
    // Download the result
    const resultResponse = await fetch(resultUrl);
    
    if (!resultResponse.ok) {
      throw new Error(`Failed to download enhanced image: ${resultResponse.status}`);
    }
    
    const resultBuffer = await resultResponse.arrayBuffer();
    
    // Save the result to the output path
    await fs.promises.writeFile(outputPath, Buffer.from(resultBuffer));
    
    return true;
  } catch (error) {
    console.error('Error in enhanceImage:', error);
    return false;
  }
} 