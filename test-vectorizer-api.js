// Test script for the vectorizer API in the Railway deployed backend
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Configuration
const BACKEND_URL = 'https://puzzle-craft-forge-production.up.railway.app';
const API_ENDPOINT = '/api/vectorize';
const TEST_IMAGE = path.join(__dirname, 'backend', 'test-circle.png');

async function testVectorizerAPI() {
  try {
    console.log('Testing Vectorizer API on Railway...');
    console.log(`API Endpoint: ${BACKEND_URL}${API_ENDPOINT}`);
    
    // Check if the test image exists
    if (!fs.existsSync(TEST_IMAGE)) {
      console.error(`Test image not found at ${TEST_IMAGE}`);
      return;
    }
    
    console.log(`Using test image: ${TEST_IMAGE}`);
    const imageBuffer = fs.readFileSync(TEST_IMAGE);
    console.log(`Image size: ${imageBuffer.length} bytes`);
    
    // Create a form data object
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test-circle.png',
      contentType: 'image/png'
    });
    
    // Add options
    const options = {
      threshold: 128,
      steps: 1,
      background: '#ffffff',
      fillStrategy: 'dominant'
    };
    formData.append('options', JSON.stringify(options));
    
    console.log('Sending request to the API...');
    
    // Make the API request
    const response = await fetch(`${BACKEND_URL}${API_ENDPOINT}`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorText;
      try {
        const errorJson = await response.json();
        errorText = JSON.stringify(errorJson, null, 2);
      } catch (e) {
        errorText = await response.text();
      }
      console.error('Error from server:', errorText);
      return;
    }
    
    // Get the response data
    const data = await response.json();
    
    if (data.status === 'success' && data.svg) {
      console.log('Success! Received SVG:');
      // Only show the first 100 characters of the SVG
      console.log(`${data.svg.substring(0, 100)}...`);
      
      // Save the SVG to a file
      const outputFile = path.join(__dirname, 'test-output.svg');
      fs.writeFileSync(outputFile, data.svg);
      console.log(`SVG saved to ${outputFile}`);
    } else {
      console.error('Error in response:', data);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testVectorizerAPI();