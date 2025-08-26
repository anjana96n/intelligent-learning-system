export interface T5SummaryResult {
  summary: string;
  confidence: number;
  type: 'educational' | 'question' | 'definition' | 'general';
  modelUsed: string;
}

class T5SummarizationService {
  private static instance: T5SummarizationService;
  private baseUrl: string;
  private isInitialized = false;

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }

  static getInstance(): T5SummarizationService {
    if (!T5SummarizationService.instance) {
      T5SummarizationService.instance = new T5SummarizationService();
    }
    return T5SummarizationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing T5 summarization service...');
      
      // Test connection to the backend API
      await fetch(`${this.baseUrl}/api/speech/summarize/t5`, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.isInitialized = true;
      console.log('✅ T5 summarization service initialized successfully!');
    } catch (error) {
      console.warn('⚠️ T5 service connection test failed, but will still try to use it:', error);
      // Don't throw error here - the service might still work
      this.isInitialized = true;
    }
  }

  async summarize(text: string): Promise<T5SummaryResult> {
    if (!text || text.trim().length === 0) {
      return {
        summary: '',
        confidence: 0,
        type: 'general',
        modelUsed: 't5-small-dialogsum'
      };
    }

    // Ensure service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('📝 Summarizing text using T5 model via backend API...');
      
      // Get the auth token from localStorage or context
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${this.baseUrl}/api/speech/summarize/t5`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          text: text.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`T5 API error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`T5 API returned error: ${result.error || 'Unknown error'}`);
      }

      console.log('✅ T5 summarization completed');
      
      return {
        summary: result.summary || text,
        confidence: result.confidence || 0.98,
        type: result.type || this.determineContentType(result.summary || text),
        modelUsed: result.modelUsed || 't5-small-dialogsum'
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

  private fallbackSummarize(text: string): string {
    // Enhanced fallback summarization that extracts key sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 1) return text;
    
    // Educational keywords that indicate important content
    const educationalKeywords = [
      'important', 'key', 'main', 'essential', 'crucial', 'significant',
      'definition', 'concept', 'theory', 'principle', 'method', 'process',
      'because', 'therefore', 'thus', 'consequently', 'as a result',
      'learn', 'understand', 'remember', 'note', 'focus', 'highlight',
      'example', 'instance', 'case', 'demonstrate', 'show', 'explain'
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
    
    // Select more sentences for comprehensive fallback summaries
    let targetSentences;
    if (sentences.length <= 3) {
      targetSentences = Math.min(2, sentences.length);
    } else if (sentences.length <= 6) {
      targetSentences = Math.min(4, Math.ceil(sentences.length * 0.6));
    } else if (sentences.length <= 10) {
      targetSentences = Math.min(5, Math.ceil(sentences.length * 0.5));
    } else {
      targetSentences = Math.min(6, Math.ceil(sentences.length * 0.4));
    }
    
    const selectedSentences = sentenceScores.slice(0, targetSentences);
    
    // Sort back by original position to maintain flow
    selectedSentences.sort((a, b) => a.index - b.index);
    
    // Combine selected sentences
    const summary = selectedSentences.map(s => s.sentence).join('. ') + '.';
    
    return summary;
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

  getStatus(): { isInitialized: boolean; baseUrl: string; modelUsed: string } {
    return {
      isInitialized: this.isInitialized,
      baseUrl: this.baseUrl,
      modelUsed: 't5-small-dialogsum'
    };
  }

  async preloadService(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

export default T5SummarizationService;
