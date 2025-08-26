import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class T5SummarizationService {
  constructor() {
    this.isInitialized = false;
    this.modelPath = path.resolve(__dirname, '../../../summery/outputs/t5-small-dialogsum');
    this.pythonScript = path.resolve(__dirname, '../../../summery/infer_t5.py');
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing T5 summarization service...');
      
      // Check if model and script exist
      const fs = await import('fs');
      if (!fs.existsSync(this.modelPath)) {
        throw new Error(`T5 model not found at: ${this.modelPath}`);
      }
      if (!fs.existsSync(this.pythonScript)) {
        throw new Error(`Python script not found at: ${this.pythonScript}`);
      }
      
      this.isInitialized = true;
      console.log('✅ T5 summarization service initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize T5 service:', error);
      throw error;
    }
  }

  async summarize(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!text || text.trim().length === 0) {
      return {
        summary: '',
        confidence: 0,
        type: 'general',
        modelUsed: 't5-small-dialogsum'
      };
    }

    try {
      console.log('📝 Summarizing text using T5 model...');
      
      const summary = await this.runPythonSummarization(text.trim());
      
      console.log('✅ T5 summarization completed');
      
      return {
        summary: summary.trim(),
        confidence: 0.98, // High confidence for fine-tuned T5 model
        type: this.determineContentType(summary),
        modelUsed: 't5-small-dialogsum'
      };
    } catch (error) {
      console.error('❌ T5 summarization error:', error);
      
      // Fallback to simple summarization
      return {
        summary: this.fallbackSummarize(text),
        confidence: 0.6,
        type: 'general',
        modelUsed: 'fallback'
      };
    }
  }

  async runPythonSummarization(text) {
    return new Promise((resolve, reject) => {
      // Adjust parameters based on text length for multi-sentence summaries
      const textLength = text.split(' ').length;
      let maxLength = 200;  // Increased base length
      let minLength = 20;   // Increased minimum for more sentences
      
      if (textLength > 150) {
        // For very long texts, allow comprehensive summaries (3-4 sentences)
        maxLength = Math.min(300, Math.floor(textLength * 0.4));
        minLength = Math.min(40, Math.floor(textLength * 0.2));
      } else if (textLength > 100) {
        // For longer texts, allow detailed summaries (2-3 sentences)
        maxLength = Math.min(250, Math.floor(textLength * 0.45));
        minLength = Math.min(30, Math.floor(textLength * 0.25));
      } else if (textLength > 50) {
        // For medium texts, ensure at least 2 sentences
        maxLength = Math.min(200, Math.floor(textLength * 0.5));
        minLength = Math.min(25, Math.floor(textLength * 0.3));
      } else {
        // For short texts, still try for multiple sentences if possible
        maxLength = Math.min(150, Math.floor(textLength * 0.6));
        minLength = Math.min(20, Math.floor(textLength * 0.35));
      }
      
      const python = spawn('python', [
        this.pythonScript,
        '--model_path', this.modelPath,
        '--text', text,
        '--max_length', maxLength.toString(),
        '--min_length', minLength.toString(),
        '--num_beams', '8'  // Increased for better quality and diversity
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script exited with code ${code}: ${stderr}`));
          return;
        }

        // Extract summary from output
        // The script prints "=== Summary ===" followed by the actual summary
        const summaryMatch = stdout.match(/=== Summary ===\s*\n\s*(.*?)(?:\n|$)/s);
        if (summaryMatch && summaryMatch[1]) {
          resolve(summaryMatch[1].trim());
        } else {
          // If no match found, return the last non-empty line
          const lines = stdout.split('\n').filter(line => line.trim().length > 0);
          const lastLine = lines[lines.length - 1];
          resolve(lastLine ? lastLine.trim() : text);
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  fallbackSummarize(text) {
    // Enhanced fallback summarization that extracts multiple key sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 1) return text;
    
    // Educational keywords that indicate important content
    const educationalKeywords = [
      'important', 'key', 'main', 'essential', 'crucial', 'significant',
      'definition', 'concept', 'theory', 'principle', 'method', 'process',
      'because', 'therefore', 'thus', 'consequently', 'as a result',
      'learn', 'understand', 'remember', 'note', 'focus', 'highlight',
      'example', 'instance', 'case', 'demonstrate', 'show', 'explain',
      'first', 'second', 'third', 'finally', 'in conclusion', 'summary'
    ];
    
    // Calculate scores for each sentence
    const sentenceScores = sentences.map((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();
      let score = 0;
      
      // Factor 1: Educational keyword score
      for (const keyword of educationalKeywords) {
        if (lowerSentence.includes(keyword)) {
          score += 3;
        }
      }
      
      // Factor 2: Position score (first and last sentences get bonus)
      const positionScore = index === 0 ? 2 : (index === sentences.length - 1 ? 1.5 : 0);
      score += positionScore;
      
      // Factor 3: Length score (prefer medium-length sentences)
      const sentenceLength = sentence.split(' ').length;
      const lengthScore = sentenceLength >= 8 && sentenceLength <= 25 ? 2 : 
                         sentenceLength < 8 ? 1 : 0.5;
      score += lengthScore;
      
      return { 
        sentence: sentence.trim(), 
        score: score,
        index: index
      };
    });
    
    // Sort sentences by score (highest first)
    sentenceScores.sort((a, b) => b.score - a.score);
    
    // Select multiple sentences for comprehensive fallback
    let targetSentences;
    if (sentences.length <= 3) {
      targetSentences = Math.min(2, sentences.length);
    } else if (sentences.length <= 6) {
      targetSentences = Math.min(3, Math.ceil(sentences.length * 0.5));
    } else {
      targetSentences = Math.min(4, Math.ceil(sentences.length * 0.4));
    }
    
    const selectedSentences = sentenceScores.slice(0, targetSentences);
    
    // Sort back by original position to maintain flow
    selectedSentences.sort((a, b) => a.index - b.index);
    
    // Combine selected sentences
    const summary = selectedSentences.map(s => s.sentence).join('. ') + '.';
    
    return summary;
  }

  determineContentType(text) {
    const lowerText = text.toLowerCase();
    
    // Check for questions
    if (lowerText.includes('?') || lowerText.includes('what') || lowerText.includes('how') || 
        lowerText.includes('why') || lowerText.includes('when') || lowerText.includes('where')) {
      return 'question';
    }
    
    // Check for definitions
    if (lowerText.includes('is') && lowerText.includes('defined') || 
        lowerText.includes('means') || lowerText.includes('refers to') ||
        lowerText.includes('is a') || lowerText.includes('are')) {
      return 'definition';
    }
    
    // Check for educational content
    const educationalKeywords = [
      'important', 'key', 'main', 'essential', 'crucial', 'significant',
      'learn', 'understand', 'remember', 'note', 'focus', 'highlight',
      'definition', 'concept', 'theory', 'principle', 'method', 'process',
      'example', 'instance', 'case', 'demonstrate', 'show', 'explain'
    ];
    
    for (const keyword of educationalKeywords) {
      if (lowerText.includes(keyword)) {
        return 'educational';
      }
    }
    
    return 'general';
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      modelPath: this.modelPath,
      pythonScript: this.pythonScript,
      modelUsed: 't5-small-dialogsum'
    };
  }
}

export default T5SummarizationService;
