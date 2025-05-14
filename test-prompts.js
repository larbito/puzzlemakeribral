// Use built-in fetch API
async function testPromptExpansion() {
  try {
    console.log('Testing prompt expansion endpoint...');
    
    // Test with a prompt that includes preface text to verify our fix
    const testPrompt = "This image is suitable for a coloring book: A cheerful ladybug pulling a tiny wheelbarrow filled with vegetables through a charming garden. A small duckling wearing a gardener's hat is helping by watering nearby flowers with a decorated watering can. They are near a cozy cottage with a rounded doorway and heart emblem.";
    
    console.log('Using test prompt with preface text:', testPrompt);
    
    const response = await fetch('http://localhost:3000/api/coloring-book/expand-prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        basePrompt: testPrompt,
        pageCount: 3
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error:', errorData);
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