const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testKDPFormatter() {
  console.log('🧪 Testing KDP Formatter End-to-End...\n');
  
  try {
    // Test 1: Check if routes are accessible
    console.log('1️⃣ Testing routes accessibility...');
    const testResponse = await fetch('http://localhost:3000/api/kdp-formatter/test');
    const testData = await testResponse.json();
    console.log('✅ Routes accessible:', testData.message);
    
    // Test 2: Create a sample text file for testing
    console.log('\n2️⃣ Creating test content...');
    const testContent = `The Book of Funny History Facts
By B N William

Chapter 1: Ancient Civilizations

Did you know that ancient Egyptians used to worship cats? This is just one of many amusing facts from history.

The pyramids were built as tombs for pharaohs, but they also served as giant advertisements saying "Look how rich and powerful I was!"

Chapter 2: Medieval Times

Knights in shining armor weren't actually that shiny. Most of the time, their armor was dirty and dented from battle.

Medieval people thought the earth was flat, but actually, educated people knew it was round. The flat earth myth is itself a myth!

Chapter 3: Modern Era

The first airplane flight lasted only 12 seconds. Imagine if the Wright brothers could see planes today flying for 12+ hours!

Henry Ford didn't invent the car, but he made it affordable for everyone. Before Ford, cars were luxury items only the rich could afford.`;
    
    fs.writeFileSync('test-book.txt', testContent);
    console.log('✅ Test content created');
    
    // Test 3: Upload and analyze the document
    console.log('\n3️⃣ Testing document analysis...');
    const form = new FormData();
    form.append('file', fs.createReadStream('test-book.txt'), {
      filename: 'test-book.txt',
      contentType: 'text/plain'
    });
    
    const extractResponse = await fetch('http://localhost:3000/api/kdp-formatter/extract', {
      method: 'POST',
      body: form
    });
    
    const extractData = await extractResponse.json();
    
    if (extractData.success) {
      console.log('✅ Document analyzed successfully!');
      console.log(`📊 Found ${extractData.content.chapters.length} chapters`);
      console.log(`📖 Title: "${extractData.content.title}"`);
      console.log(`✍️ Author: "${extractData.content.author}"`);
      console.log(`🔍 Analysis method: ${extractData.content.metadata?.analysisMethod}`);
      
      // Test 4: Generate PDF with settings
      console.log('\n4️⃣ Testing PDF generation...');
      const pdfSettings = {
        trimSize: '6x9',
        font: 'Times New Roman',
        fontSize: '12pt',
        lineSpacing: 1.5,
        marginTop: '1in',
        marginBottom: '1in',
        marginInside: '1in',
        marginOutside: '0.75in',
        pageNumbering: true,
        justification: 'justify',
        includeTitlePage: true,
        includeCopyright: true,
        includeTOC: true
      };
      
      const pdfResponse = await fetch('http://localhost:3000/api/kdp-formatter/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: extractData.content,
          settings: pdfSettings
        })
      });
      
      const pdfData = await pdfResponse.json();
      
      if (pdfData.success) {
        console.log('✅ PDF generated successfully!');
        console.log(`📁 Filename: ${pdfData.filename}`);
        console.log(`🔗 Download URL: ${pdfData.downloadUrl}`);
        console.log(`📍 Full URL: http://localhost:3000${pdfData.downloadUrl}`);
      } else {
        console.log('❌ PDF generation failed:', pdfData.error);
      }
      
    } else {
      console.log('❌ Document analysis failed:', extractData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync('test-book.txt')) {
      fs.unlinkSync('test-book.txt');
    }
  }
  
  console.log('\n🎉 KDP Formatter testing complete!');
}

// Run the test
testKDPFormatter(); 