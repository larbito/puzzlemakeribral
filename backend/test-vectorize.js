const Jimp = require('jimp');
const potrace = require('potrace');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Vectorization Libraries ===');
console.log('Potrace version:', potrace.VERSION || 'unknown');

// Define test functions
async function testVectorization() {
  try {
    console.log('\nTesting image loading with Jimp...');
    // Create a simple test image - a black circle on white background
    const width = 300;
    const height = 300;
    
    console.log('Creating image with Jimp...');
    // For Jimp 0.16.3, we should use the Jimp.read() with a specific config
    const image = await Jimp.create(width, height, 0xFFFFFFFF); // White background
    console.log('Image created successfully');
    
    // Draw a black circle
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 100;
    
    console.log('Drawing black circle...');
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const distSq = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
        if (distSq < radius * radius) {
          image.setPixelColor(0x000000FF, x, y); // Black pixel
        }
      }
    }
    
    console.log('Created test image, saving to disk...');
    
    // Save the test image to file
    const testImagePath = path.join(__dirname, 'test-circle.png');
    await image.writeAsync(testImagePath);
    console.log('Saved test image to:', testImagePath);
    
    // Now trace the image with Potrace
    console.log('\nTracing image with Potrace...');
    
    const imageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    
    // Define trace options
    const potraceOptions = {
      threshold: 180,
      turdSize: 5,
      optTolerance: 0.2,
      optCurve: true,
      fillColor: null,
      background: null
    };
    
    // Trace the image
    const svgData = await new Promise((resolve, reject) => {
      potrace.trace(imageBuffer, potraceOptions, (err, svg) => {
        if (err) reject(err);
        else resolve(svg);
      });
    });
    
    // Save the SVG output
    const svgPath = path.join(__dirname, 'test-circle.svg');
    fs.writeFileSync(svgPath, svgData);
    console.log('Saved vectorized SVG to:', svgPath);
    console.log('SVG content preview:');
    console.log(svgData.substring(0, 200) + '...');
    
    console.log('\nVectorization test completed successfully!');
    return true;
  } catch (error) {
    console.error('Vectorization test failed:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  try {
    const vectorizationSuccess = await testVectorization();
    console.log('\n=== TEST RESULTS ===');
    console.log('Vectorization test:', vectorizationSuccess ? 'PASSED' : 'FAILED');
    
    if (!vectorizationSuccess) {
      console.log('\nPossible solutions:');
      console.log('1. Ensure all dependencies are installed: npm install potrace jimp');
      console.log('2. Check if the system has required libraries for image processing');
      console.log('3. Try updating the libraries: npm update potrace jimp');
    }
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Execute tests
runTests(); 