// Speech Recognition Accuracy Metrics Calculator
// Implements CER (Character Error Rate) and WER (Word Error Rate) calculations

export interface AccuracyMetrics {
  wer: number;
  cer: number;
  totalWords: number;
  totalCharacters: number;
  correctWords: number;
  correctCharacters: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  characterSubstitutions: number;
  characterDeletions: number;
  characterInsertions: number;
}

export interface TestResult {
  testPhrase: string;
  recognizedText: string;
  metrics: AccuracyMetrics;
  timestamp: Date;
  browser: string;
  confidence?: number;
}

export interface TestReport {
  totalTests: number;
  averageWER: number;
  averageCER: number;
  bestWER: number;
  worstWER: number;
  bestCER: number;
  worstCER: number;
  results: TestResult[];
  generatedAt: Date;
  testEnvironment: {
    browser: string;
    userAgent: string;
    language: string;
  };
}

/**
 * Proper edit distance calculation with word alignment
 */
function calculateEditDistance(ref: string[], hyp: string[]): {
  distance: number;
  substitutions: number;
  deletions: number;
  insertions: number;
} {
  const refLen = ref.length;
  const hypLen = hyp.length;
  
  // Create dynamic programming matrix
  const dp: number[][] = Array(refLen + 1)
    .fill(0)
    .map(() => Array(hypLen + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= refLen; i++) {
    dp[i][0] = i; // deletions
  }
  for (let j = 0; j <= hypLen; j++) {
    dp[0][j] = j; // insertions
  }
  
  // Fill the matrix
  for (let i = 1; i <= refLen; i++) {
    for (let j = 1; j <= hypLen; j++) {
      if (ref[i - 1] === hyp[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // match
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  
  // Backtrack to count operation types
  let i = refLen;
  let j = hypLen;
  let substitutions = 0;
  let deletions = 0;
  let insertions = 0;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && ref[i - 1] === hyp[j - 1]) {
      // Match
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // Substitution
      substitutions++;
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      // Deletion
      deletions++;
      i--;
    } else {
      // Insertion
      insertions++;
      j--;
    }
  }
  
  return {
    distance: dp[refLen][hypLen],
    substitutions,
    deletions,
    insertions
  };
}

/**
 * Calculate Word Error Rate (WER)
 */
export function calculateWER(reference: string, hypothesis: string): AccuracyMetrics {
  // Enhanced debug logging
  console.log('=== WER CALCULATION DEBUG ===');
  console.log('Original Reference:', `"${reference}"`);
  console.log('Original Hypothesis:', `"${hypothesis}"`);

  // Normalize text (lowercase, remove extra spaces, basic punctuation)
  const normalizeText = (text: string): string => {
    const result = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize spaces
      .trim();
    console.log(`Normalized "${text}" -> "${result}"`);
    return result;
  };

  const normalizedRef = normalizeText(reference);
  const normalizedHyp = normalizeText(hypothesis);

  console.log('Final normalized ref:', `"${normalizedRef}"`);
  console.log('Final normalized hyp:', `"${normalizedHyp}"`);
  console.log('Are they equal?', normalizedRef === normalizedHyp);

  // IMMEDIATE CHECK: If identical, return 0% immediately
  if (normalizedRef === normalizedHyp) {
    console.log('✅ IDENTICAL TEXT - Returning 0% error rates');
    const wordCount = normalizedRef.split(' ').filter(w => w.length > 0).length;
    return {
      wer: 0,
      cer: 0,
      totalWords: wordCount,
      totalCharacters: normalizedRef.length,
      correctWords: wordCount,
      correctCharacters: normalizedRef.length,
      substitutions: 0,
      deletions: 0,
      insertions: 0,
      characterSubstitutions: 0,
      characterDeletions: 0,
      characterInsertions: 0
    };
  }

  console.log('❌ Texts are NOT identical, calculating proper alignment...');

  const refWords = normalizedRef.split(' ').filter(w => w.length > 0);
  const hypWords = normalizedHyp.split(' ').filter(w => w.length > 0);

  console.log('Reference words:', refWords, `(${refWords.length} words)`);
  console.log('Hypothesis words:', hypWords, `(${hypWords.length} words)`);

  // Calculate proper edit distance with alignment
  const wordResult = calculateEditDistance(refWords, hypWords);
  console.log('Word edit result:', wordResult);

  // WER Formula Breakdown
  const S = wordResult.substitutions;  // Substitutions
  const D = wordResult.deletions;     // Deletions  
  const I = wordResult.insertions;    // Insertions
  const N = refWords.length;          // Total reference words

  console.log('');
  console.log('🔢 WER FORMULA BREAKDOWN:');
  console.log(`Reference: "${reference}"`);
  console.log(`Hypothesis: "${hypothesis}"`);
  console.log(`Reference words (N): ${N}`);
  console.log(`Substitutions (S): ${S}`);
  console.log(`Deletions (D): ${D}`);
  console.log(`Insertions (I): ${I}`);
  console.log('');
  console.log(`WER Formula: WER = (S + D + I) / N`);
  console.log(`WER Calculation: WER = (${S} + ${D} + ${I}) / ${N}`);
  console.log(`WER Calculation: WER = ${S + D + I} / ${N}`);
  
  const werDecimal = N > 0 ? (S + D + I) / N : 0;
  const werPercentage = werDecimal * 100;
  
  console.log(`WER Result: ${werDecimal.toFixed(4)} (${werPercentage.toFixed(2)}%)`);
  console.log('');

  // Character-level edit distance
  const refChars = normalizedRef.split('');
  const hypChars = normalizedHyp.split('');
  const charResult = calculateEditDistance(refChars, hypChars);
  
  const cerDecimal = refChars.length > 0 ? (charResult.distance / refChars.length) : 0;
  const cerPercentage = cerDecimal * 100;
  
  console.log(`CER: ${cerPercentage.toFixed(2)}% (${charResult.distance} character errors out of ${refChars.length} characters)`);

  return {
    wer: Math.round(werPercentage * 100) / 100,
    cer: Math.round(cerPercentage * 100) / 100,
    totalWords: refWords.length,
    totalCharacters: refChars.length,
    correctWords: refWords.length - wordResult.distance,
    correctCharacters: refChars.length - charResult.distance,
    substitutions: wordResult.substitutions,
    deletions: wordResult.deletions,
    insertions: wordResult.insertions,
    characterSubstitutions: charResult.substitutions,
    characterDeletions: charResult.deletions,
    characterInsertions: charResult.insertions
  };
}

/**
 * Educational test phrases for speech recognition testing
 * Reduced to 4 representative phrases covering different educational scenarios
 */
export const TEST_PHRASES: string[] = [
  // Basic technical education
  "Today we will learn about artificial intelligence and machine learning algorithms.",
  
  // Classroom instruction with technical vocabulary
  "Neural networks are inspired by biological neurons and form the foundation of deep learning.",
  
  // Interactive classroom scenario
  "Can everyone see the presentation clearly from their seats in the back row?",
  
  // Complex educational content with technical terms
  "Machine learning has revolutionized many industries including healthcare finance and transportation by enabling computers to learn patterns from data."
];

/**
 * Generate accuracy test report
 */
export function generateTestReport(results: TestResult[]): TestReport {
  if (results.length === 0) {
    throw new Error('No test results provided');
  }

  const wers = results.map(r => r.metrics.wer);
  const cers = results.map(r => r.metrics.cer);

  const averageWER = wers.reduce((sum, wer) => sum + wer, 0) / wers.length;
  const averageCER = cers.reduce((sum, cer) => sum + cer, 0) / cers.length;

  return {
    totalTests: results.length,
    averageWER: Math.round(averageWER * 100) / 100,
    averageCER: Math.round(averageCER * 100) / 100,
    bestWER: Math.min(...wers),
    worstWER: Math.max(...wers),
    bestCER: Math.min(...cers),
    worstCER: Math.max(...cers),
    results: results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    generatedAt: new Date(),
    testEnvironment: {
      browser: getBrowserInfo(),
      userAgent: navigator.userAgent,
      language: navigator.language
    }
  };
}

/**
 * Export report as CSV for analysis
 */
export function exportReportAsCSV(report: TestReport): string {
  const headers = [
    'Test_Number',
    'Test_Phrase',
    'Recognized_Text', 
    'WER',
    'CER',
    'Total_Words',
    'Correct_Words',
    'Substitutions',
    'Deletions',
    'Insertions',
    'Timestamp',
    'Browser',
    'Confidence'
  ];

  const rows = report.results.map((result, index) => [
    index + 1,
    `"${result.testPhrase.replace(/"/g, '""')}"`,
    `"${result.recognizedText.replace(/"/g, '""')}"`,
    result.metrics.wer,
    result.metrics.cer,
    result.metrics.totalWords,
    result.metrics.correctWords,
    result.metrics.substitutions,
    result.metrics.deletions,
    result.metrics.insertions,
    result.timestamp.toISOString(),
    result.browser,
    result.confidence || 'N/A'
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  // Add summary at the end
  const summary = [
    '',
    '# SUMMARY STATISTICS',
    `# Total Tests: ${report.totalTests}`,
    `# Average WER: ${report.averageWER}%`,
    `# Average CER: ${report.averageCER}%`,
    `# Best WER: ${report.bestWER}%`,
    `# Worst WER: ${report.worstWER}%`,
    `# Best CER: ${report.bestCER}%`,
    `# Worst CER: ${report.worstCER}%`,
    `# Test Environment: ${report.testEnvironment.browser}`,
    `# Generated At: ${report.generatedAt.toISOString()}`
  ].join('\n');

  return csvContent + summary;
}

/**
 * Get browser information
 */
function getBrowserInfo(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox';  
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari';
  } else if (userAgent.includes('Edg')) {
    return 'Edge';
  } else {
    return 'Unknown';
  }
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, contentType: string = 'text/plain') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Test function to debug WER calculation
 */
export function testWER() {
  console.log('=== WER DEBUGGING ===');
  
  // Test the user's specific example first
  console.log('\n🎯 USER EXAMPLE TEST:');
  console.log('Expected: S=3, D=0, I=0, N=4, WER=75%');
  const userExample = calculateWER(
    "she enjoys reading books",
    "she enjoy read book"
  );
  console.log('✅ User example completed!\n');
  
  // Test with simple cases
  console.log('📝 SIMPLE TESTS:');
  const simple1 = calculateWER("hello world", "hello world");
  console.log('Perfect match completed!\n');
  
  const simple2 = calculateWER("hello world", "hello there");
  console.log('One substitution completed!\n');
  
  const simple3 = calculateWER("hello world", "hello");
  console.log('One deletion completed!\n');
  
  const simple4 = calculateWER("hello", "hello world");
  console.log('One insertion completed!\n');
  
  return { userExample, simple1, simple2, simple3, simple4 };
}
