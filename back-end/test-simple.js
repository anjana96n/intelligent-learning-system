console.log('Starting simple test...');

import GradioSummarizationService from './src/services/GradioSummarizationService.js';

console.log('Import successful');

const service = new GradioSummarizationService();
console.log('Service created');

const status = service.getStatus();
console.log('Status:', status);

console.log('Test completed');