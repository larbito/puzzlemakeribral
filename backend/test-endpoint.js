const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Use the test image we created earlier
const imagePath = path.join(__dirname, 'test-circle.png');

async function testVectorizeEndpoint() {
  try {
    console.log('Testing vectorize-local endpoint with test image:', imagePath);
    
    if (!fs.existsSync(imagePath)) {
      console.error('Test image not found. Run test-vectorize.js first to create it.');
      return false;
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`Image loaded, size: ${imageBuffer.length / 1024} KB`);
    
    // Create form data
    const formData = new FormData();
    formData.append('image', imageBuffer, { 
      filename: 'test-circle.png', 
      contentType: 'image/png' 
    });
    
    console.log('Form data created, sending request to endpoint...');
    
    // Make the API call
    const response = await fetch('http://localhost:5000/api/vectorize-local', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    // Check the response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      return false;
    }
    
    // Get the response data
    const data = await response.json();
    console.log('Response received successfully');
    
    // Check if we have an SVG URL
    if (!data.svgUrl) {
      console.error('No SVG URL in response:', data);
      return false;
    }
    
    // Save the SVG to a file
    const svgPath = path.join(__dirname, 'response-test.svg');
    fs.writeFileSync(svgPath, data.svgData);
    console.log('Saved SVG response to:', svgPath);
    
    return true;
  } catch (error) {
    console.error('Error testing endpoint:', error);
    return false;
  }
}

// Run the test
testVectorizeEndpoint()
  .then(success => {
    console.log('Test completed:', success ? 'SUCCESS' : 'FAILED');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 