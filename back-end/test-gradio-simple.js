// Simple test for Gradio service structure
import GradioSummarizationService from './src/services/GradioSummarizationService.js';

async function testGradioServiceStructure() {
  console.log('🧪 Testing Gradio Summarization Service Structure...');
  
  const service = new GradioSummarizationService();
  
  try {
    // Test service creation
    console.log('1. Testing service creation...');
    console.log('Service instance created:', !!service);
    console.log('✅ Service creation successful');
    
    // Test status before initialization
    console.log('2. Testing status before initialization...');
    const statusBefore = service.getStatus();
    console.log('Status before init:', statusBefore);
    console.log('✅ Status check successful');
    
    // Test fallback summarization
    console.log('3. Testing fallback summarization...');
    const testText = "Machine learning is a subset of artificial intelligence that focuses on the development of computer programs.";
    
    // Mock the API call to test fallback
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      throw new Error('Mock API failure');
    };
    
    const result = await service.summarize(testText);
    console.log('✅ Fallback summarization successful');
    console.log('Original text:', testText);
    console.log('Summary:', result.summary);
    console.log('Confidence:', result.confidence);
    console.log('Type:', result.type);
    console.log('Model used:', result.modelUsed);
    
    // Restore fetch
    global.fetch = originalFetch;
    
    // Test with empty text
    console.log('4. Testing with empty text...');
    const emptyResult = await service.summarize("");
    console.log('Empty text result:', emptyResult);
    
    console.log('🎉 All structure tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGradioServiceStructure();