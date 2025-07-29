class GradioSummarizationService {
  constructor() {
    this.isInitialized = false;
    this.spaceUrl = "https://genailearniverse-textsummarizer.hf.space";
    this.apiUrl = "https://genailearniverse-textsummarizer.hf.space/api/predict";
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing Gradio API client for text summarization...');
      
      // Test the connection
      const response = await fetch(this.spaceUrl);
      if (!response.ok) {
        throw new Error(`Failed to connect to Gradio Space: ${response.status}`);
      }
      
      this.isInitialized = true;
      console.log('✅ Gradio API client initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Gradio API client:', error);
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
        modelUsed: 'gradio'
      };
    }

    try {
      console.log('📝 Summarizing text using Gradio API...');
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [text.trim()],
          fn_index: 0
        })
      });

      if (!response.ok) {
        throw new Error(`Gradio API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const summary = result.data && result.data[0] ? result.data[0] : text;

      console.log('✅ Summarization completed via Gradio API');
      
      return {
        summary: summary,
        confidence: 0.95, // High confidence for Gradio API
        type: this.determineContentType(summary),
        modelUsed: 'gradio'
      };
    } catch (error) {
      console.error('❌ Gradio summarization error:', error);
      
      // Fallback to simple summarization
      return {
        summary: this.fallbackSummarize(text),
        confidence: 0.6,
        type: 'general',
        modelUsed: 'fallback'
      };
    }
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
      'first', 'second', 'third', 'finally', 'in conclusion', 'summary',
      'means', 'refers to', 'defined as', 'is a', 'are', 'consists of',
      'comprises', 'includes', 'contains', 'involves', 'requires', 'needs',
      'enables', 'allows', 'provides', 'offers', 'supports', 'facilitates',
      'ensures', 'guarantees', 'maintains', 'improves', 'enhances', 'optimizes'
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
      
      // Factor 4: Question score (questions are often important)
      const questionScore = sentence.includes('?') ? 2 : 0;
      score += questionScore;
      
      // Factor 5: Definition pattern score
      const definitionPattern = /\b(is|are|means|refers to|defined as|consists of|comprises)\b/i;
      const definitionScore = definitionPattern.test(sentence) ? 2 : 0;
      score += definitionScore;
      
      // Factor 6: Number/list score
      const numberScore = /\d+/.test(sentence) ? 1 : 0;
      score += numberScore;
      
      // Factor 7: Technical terms score
      const technicalTerms = ['platform', 'system', 'technology', 'digital', 'automation', 
                            'workflow', 'integration', 'solution', 'service', 'application',
                            'data', 'information', 'process', 'function', 'feature', 'capability',
                            'user', 'customer', 'employee', 'organization', 'business'];
      for (const term of technicalTerms) {
        if (lowerSentence.includes(term)) {
          score += 1;
        }
      }
      
      // Factor 8: Action words score (sentences with action words are often important)
      const actionWords = ['can', 'will', 'should', 'must', 'need', 'require', 'enable',
                          'provide', 'offer', 'support', 'help', 'allow', 'ensure', 'guarantee'];
      for (const word of actionWords) {
        if (lowerSentence.includes(word)) {
          score += 0.5;
        }
      }
      
      // Factor 9: Contrast/comparison score
      const contrastPattern = /\b(but|however|although|while|whereas|unlike|different|same|similar)\b/i;
      const contrastScore = contrastPattern.test(sentence) ? 1.5 : 0;
      score += contrastScore;
      
      return { 
        sentence: sentence.trim(), 
        score: score,
        length: sentenceLength,
        index: index
      };
    });
    
    // Sort sentences by score (highest first)
    sentenceScores.sort((a, b) => b.score - a.score);
    
    // Select fewer sentences for shorter summaries
    // For short texts (1-3 sentences): take 1-2 sentences
    // For medium texts (4-6 sentences): take 2-3 sentences
    // For long texts (7+ sentences): take 2-3 sentences
    let targetSentences;
    if (sentences.length <= 3) {
      targetSentences = Math.min(2, sentences.length);
    } else if (sentences.length <= 6) {
      targetSentences = Math.min(3, Math.ceil(sentences.length * 0.4));
    } else {
      targetSentences = Math.min(3, Math.ceil(sentences.length * 0.3));
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
      spaceUrl: this.spaceUrl,
      modelUsed: 'gradio'
    };
  }
}

export default GradioSummarizationService;