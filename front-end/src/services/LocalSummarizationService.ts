// LocalSummarizationService.ts
// Uses local transformer model for summarization (similar to face-api.js approach)

import { pipeline, AutoTokenizer, AutoModelForSeq2SeqLM } from '@xenova/transformers';

export interface LocalSummaryResult {
  summary: string;
  confidence: number;
  type: 'educational' | 'question' | 'definition' | 'general';
  modelUsed: string;
}

class LocalSummarizationService {
  private static instance: LocalSummarizationService;
  private isInitialized = false;
  private isModelLoading = false;
  private summarizer: any = null;
  private tokenizer: any = null;
  private modelName = 'sshleifer/distilbart-cnn-12-6'; // Lightweight summarization model
  private fallbackSummarizer: any = null;

  private constructor() {}

  static getInstance(): LocalSummarizationService {
    if (!LocalSummarizationService.instance) {
      LocalSummarizationService.instance = new LocalSummarizationService();
    }
    return LocalSummarizationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || this.isModelLoading) return;
    
    this.isModelLoading = true;
    console.log('🔄 Loading local summarization model...');

    try {
      // Load the lightweight summarization model
      this.summarizer = await pipeline('summarization', this.modelName, {
        quantized: true, // Use quantized model for smaller size
        progress_callback: (progress: number) => {
          console.log(`📥 Model loading progress: ${Math.round(progress * 100)}%`);
        }
      });

      this.isInitialized = true;
      this.isModelLoading = false;
      console.log('✅ Local summarization model loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load local model, using fallback:', error);
      this.isModelLoading = false;
      // Fallback to simple summarization
      this.fallbackSummarizer = this.createFallbackSummarizer();
    }
  }

  private createFallbackSummarizer() {
    return {
      async summarize(text: string): Promise<string> {
        // Simple fallback summarization
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length <= 1) return text;
        
        // Pick the most important sentence based on keywords
        const educationalKeywords = [
          'important', 'key', 'main', 'essential', 'crucial', 'significant',
          'definition', 'concept', 'theory', 'principle', 'method', 'process',
          'because', 'therefore', 'thus', 'consequently', 'as a result'
        ];
        
        let bestSentence = sentences[0];
        let bestScore = 0;
        
        for (const sentence of sentences) {
          const lowerSentence = sentence.toLowerCase();
          let score = 0;
          
          for (const keyword of educationalKeywords) {
            if (lowerSentence.includes(keyword)) {
              score += 2;
            }
          }
          
          // Bonus for longer sentences (more informative)
          if (sentence.length > 50) score += 1;
          
          if (score > bestScore) {
            bestScore = score;
            bestSentence = sentence;
          }
        }
        
        return bestSentence.trim();
      }
    };
  }

  async summarize(text: string): Promise<LocalSummaryResult> {
    if (!text || text.trim().length === 0) {
      return {
        summary: '',
        confidence: 0,
        type: 'general',
        modelUsed: 'none'
      };
    }

    // Ensure model is loaded
    if (!this.isInitialized && !this.isModelLoading) {
      await this.initialize();
    }

    try {
      let summary = '';
      let modelUsed = 'fallback';

      if (this.summarizer && this.isInitialized) {
        // Use local transformer model
        const result = await this.summarizer(text, {
          max_length: 150,
          min_length: 30,
          do_sample: false,
          num_beams: 4
        });
        
        summary = result[0]?.summary_text || text;
        modelUsed = this.modelName;
      } else if (this.fallbackSummarizer) {
        // Use fallback summarizer
        summary = await this.fallbackSummarizer.summarize(text);
        modelUsed = 'fallback';
      } else {
        // No summarization available
        summary = text;
        modelUsed = 'none';
      }

      // Determine content type
      const type = this.determineContentType(summary);
      const confidence = this.calculateConfidence(text, summary, modelUsed);

      return {
        summary: summary.trim(),
        confidence,
        type,
        modelUsed
      };
    } catch (error) {
      console.error('❌ Summarization error:', error);
      return {
        summary: text,
        confidence: 0.5,
        type: 'general',
        modelUsed: 'error'
      };
    }
  }

  private determineContentType(text: string): 'educational' | 'question' | 'definition' | 'general' {
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

  private calculateConfidence(originalText: string, summaryText: string, modelUsed: string): number {
    if (modelUsed === 'none' || modelUsed === 'error') return 0.3;
    if (modelUsed === 'fallback') return 0.6;
    if (modelUsed === this.modelName) return 0.9;
    
    // Calculate based on text reduction and quality
    const reductionRatio = summaryText.length / originalText.length;
    if (reductionRatio < 0.3) return 0.8; // Good summarization
    if (reductionRatio < 0.7) return 0.6; // Moderate summarization
    return 0.4; // Poor summarization
  }

  getModelStatus(): { isLoaded: boolean; isLoading: boolean; modelName: string } {
    return {
      isLoaded: this.isInitialized,
      isLoading: this.isModelLoading,
      modelName: this.modelName
    };
  }

  async preloadModel(): Promise<void> {
    if (!this.isInitialized && !this.isModelLoading) {
      await this.initialize();
    }
  }
}

export default LocalSummarizationService; 