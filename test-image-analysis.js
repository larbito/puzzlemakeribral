const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

// URL of the deployment
const API_URL = 'https://puzzlemakeribral-production.up.railway.app/api/ideogram/analyze';

// Path to a test image (adjust this to a real image path in your project)
const TEST_IMAGE_PATH = 'test-image.png'; // Create a small test image or use an existing one

async function testImageAnalysis() {
  try {
    // Check if the test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`Test image not found at ${TEST_IMAGE_PATH}`);
      return;
    }

    // Create a form data object
    const form = new FormData();
    form.append('image', fs.createReadStream(TEST_IMAGE_PATH));
    form.append('type', 'coloring');
    form.append('generateVariations', 'true');
    form.append('pageCount', '3');

    console.log('Sending request to analyze image...');

    // Make the request
    const response = await fetch(API_URL, {
      method: 'POST',
      body: form
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response body:', text);
      return;
    }

    // Parse the JSON response
    const data = await response.json();
    
    console.log('Base prompt:', data.prompt);
    console.log('\nPrompt variations:');
    
    if (data.promptVariations && Array.isArray(data.promptVariations)) {
      data.promptVariations.forEach((variation, index) => {
        console.log(`\n${index + 1}. ${variation}`);
      });
      
      // Check if they're all the same
      const allSame = data.promptVariations.every(variation => 
        variation === data.promptVariations[0]
      );
      
      if (allSame) {
        console.log('\n⚠️ All prompt variations are identical!');
      } else {
        console.log('\n✅ Variations are different - integration is working correctly!');
      }
    } else {
      console.log('No prompt variations returned');
    }
  } catch (error) {
    console.error('Error testing image analysis:', error);
  }
}

testImageAnalysis(); 