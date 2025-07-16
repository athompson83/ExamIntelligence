const fetch = require('node-fetch');

async function testAIGeneration() {
  try {
    console.log('Testing AI question generation with fixed answer option validation...');
    
    // Test data simulating what the AI service might return
    const testData = {
      topic: 'Basic Mathematics',
      questionCount: 1,
      questionTypes: ['multiple_choice'],
      difficultyRange: [3, 5],
      bloomsLevels: ['remember', 'understand'],
      includeReferences: false,
      referenceLinks: [],
      learningObjectives: ['Understand basic arithmetic operations'],
      questionStyles: ['formal'],
      includeImages: false,
      includeMultimedia: false,
      customInstructions: 'Create a simple arithmetic question'
    };
    
    const response = await fetch('http://localhost:5000/api/testbanks/585987ca-c663-45b3-8c05-7c73089e0ea1/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      console.log('✅ AI Generation endpoint is accessible');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('📊 Progress:', data.type, data.status || '');
              
              if (data.type === 'complete') {
                console.log('✅ Generation completed successfully!');
                console.log('📝 Generated questions:', data.count);
                return;
              }
              
              if (data.type === 'error') {
                console.log('❌ Generation failed:', data.error);
                return;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } else {
      console.log('❌ Failed to access AI generation endpoint:', response.status);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testAIGeneration();
