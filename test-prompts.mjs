// ES Module to use native fetch
async function testPromptExpansion() {
  try {
    console.log('Testing prompt expansion endpoint...');
    
    const response = await fetch('http://localhost:3000/api/coloring-book/expand-prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        basePrompt: 'A cute elephant playing in a meadow with flowers',
        pageCount: 5
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error:', errorData);
      return;
    }
    
    const data = await response.json();
    console.log('Success! Generated prompt variations:');
    
    if (data.promptVariations && Array.isArray(data.promptVariations)) {
      data.promptVariations.forEach((prompt, index) => {
        console.log(`${index + 1}. ${prompt}`);
      });
    } else {
      console.log('Unexpected response format:', data);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPromptExpansion(); 