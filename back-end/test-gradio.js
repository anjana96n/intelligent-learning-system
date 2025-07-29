import GradioSummarizationService from './src/services/GradioSummarizationService.js';

async function testGradioService() {
  console.log('🧪 Testing Gradio Summarization Service...');
  
  const service = new GradioSummarizationService();
  
  try {
    // Test initialization
    console.log('1. Testing initialization...');
    await service.initialize();
    console.log('✅ Initialization successful');
    
    // Test summarization
    console.log('2. Testing summarization...');
    const testText = "Machine learning is a subset of artificial intelligence that focuses on the development of computer programs that can access data and use it to learn for themselves. The process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide.";
    
    const result = await service.summarize(testText);
    console.log('✅ Summarization successful');
    console.log('Original text length:', testText.length);
    console.log('Summary:', result.summary);
    console.log('Summary length:', result.summary.length);
    console.log('Confidence:', result.confidence);
    console.log('Type:', result.type);
    console.log('Model used:', result.modelUsed);
    
    // Test with short text
    console.log('3. Testing with short text...');
    const shortResult = await service.summarize("Hello world!");
    console.log('Short text result:', shortResult);
    
    // Test with empty text
    console.log('4. Testing with empty text...');
    const emptyResult = await service.summarize("");
    console.log('Empty text result:', emptyResult);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGradioService();