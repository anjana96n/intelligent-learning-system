import GradioSummarizationService from './src/services/GradioSummarizationService.js';

async function testShorterSummarization() {
  console.log('🧪 Testing Shorter Summarization...');
  
  const service = new GradioSummarizationService();
  
  try {
    // Test with your example text
    console.log('1. Testing with your example text...');
    const testText = "Filter platform cannot just respond to customer needs, but anticipate that. So for employees that means they always know the next best action, Automation, workflow, snack break, all orchestrated on one unified platform. That's so nice.";
    
    const result = await service.summarize(testText);
    console.log('✅ Shorter summarization successful');
    console.log('Original text:', testText);
    console.log('Summary:', result.summary);
    console.log('Summary length:', result.summary.length);
    console.log('Model used:', result.modelUsed);
    
    // Test with longer text
    console.log('\n2. Testing with longer text for shorter summary...');
    const longText = "In today's hyperconnected world, where every click, search, and interaction leaves a digital footprint, the importance of digital privacy has become more critical than ever before. With the rapid advancement of technology and the widespread adoption of the internet, individuals and organizations alike generate and share vast amounts of personal data daily—often without fully understanding how it is being used, stored, or monetized. Social media platforms, search engines, mobile applications, and even smart home devices collect detailed information about users' habits, preferences, locations, and behaviors. This data is frequently sold to advertisers or, worse, becomes vulnerable to cyberattacks and data breaches. Digital privacy is not merely about keeping personal secrets; it is fundamentally tied to the concept of personal freedom, autonomy, and security. When privacy is compromised, individuals risk being manipulated, discriminated against, or exploited based on their digital profiles. Moreover, for journalists, activists, and vulnerable populations, a lack of privacy can endanger lives. As such, governments, tech companies, and individuals must work collaboratively to establish and enforce robust privacy protections—through regulations like GDPR and the implementation of end-to-end encryption, secure authentication methods, and transparent data policies. Ultimately, respecting digital privacy is about upholding human dignity in the digital age and ensuring that technology serves the people, not the other way around.";
    
    const longResult = await service.summarize(longText);
    console.log('✅ Long text summarization successful');
    console.log('Original length:', longText.length);
    console.log('Summary:', longResult.summary);
    console.log('Summary length:', longResult.summary.length);
    console.log('Model used:', longResult.modelUsed);
    
    // Test with medium length text
    console.log('\n3. Testing with medium length text...');
    const mediumText = "Machine learning is a subset of artificial intelligence that focuses on the development of computer programs that can access data and use it to learn for themselves. The process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide. The primary aim is to allow the computers learn automatically without human intervention or assistance and adjust actions accordingly.";
    
    const mediumResult = await service.summarize(mediumText);
    console.log('✅ Medium text summarization successful');
    console.log('Original text:', mediumText);
    console.log('Summary:', mediumResult.summary);
    console.log('Summary length:', mediumResult.summary.length);
    console.log('Model used:', mediumResult.modelUsed);
    
    console.log('🎉 All shorter summarization tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testShorterSummarization();