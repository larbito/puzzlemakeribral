// Test script for Railway deployed instance
async function testPromptExpansion() {
  try {
    console.log('Testing prompt expansion endpoint on Railway...');
    
    // Test with a prompt that includes preface text to verify our fix
    const testPrompt = "This image is suitable for a coloring book: A cheerful ladybug pulling a tiny wheelbarrow filled with vegetables through a charming garden. A small duckling wearing a gardener's hat is helping by watering nearby flowers with a decorated watering can. They are near a cozy cottage with a rounded doorway and heart emblem.";
    
    console.log('\nUsing test prompt with preface text:');
    console.log(testPrompt);
    
    // Use the Railway URL
    const response = await fetch('https://puzzlemakeribral-production.up.railway.app/api/coloring-book/expand-prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        basePrompt: testPrompt,
        pageCount: 3
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        console.error('Error:', errorData);
      } catch {
        console.error('Error text:', errorText);
      }
      return;
    }
    
    const data = await response.json();
    console.log('\nBase prompt after cleaning:');
    console.log(data.basePrompt);
    
    console.log('\nGenerated prompt variations:');
    
    if (data.promptVariations && Array.isArray(data.promptVariations)) {
      data.promptVariations.forEach((prompt, index) => {
        console.log(`\n${index + 1}. ${prompt}`);
      });
    } else {
      console.log('Unexpected response format:', data);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPromptExpansion(); 