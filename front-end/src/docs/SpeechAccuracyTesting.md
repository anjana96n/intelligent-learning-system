# Speech Recognition Accuracy Testing Guide

## Overview

This testing framework allows you to measure the accuracy of your browser's speech recognition system by calculating **Word Error Rate (WER)** and **Character Error Rate (CER)** metrics.

## How to Use

### 1. Start Testing
- Navigate to the Teacher Dashboard
- Scroll down to the "Speech Recognition Accuracy Tester" section
- Click **"Start Testing"** to begin

### 2. Test Process
- The system will display 4 educational phrases one by one
- For each phrase:
  1. Read the displayed text clearly into your microphone
  2. Click **"Start Recognition"** when ready
  3. Wait for the system to process your speech
  4. The results will be calculated automatically

### 3. View Results
- Real-time results show WER/CER for each phrase
- After all phrases, a comprehensive report is generated
- Download options: CSV and JSON formats

## Understanding the Metrics

### Word Error Rate (WER)
- **Definition**: Percentage of words incorrectly recognized
- **Formula**: `(Substitutions + Deletions + Insertions) / Total Words × 100`
- **Good Performance**: 
  - **Excellent**: 0-5% WER
  - **Good**: 5-10% WER  
  - **Acceptable**: 10-15% WER
  - **Poor**: >20% WER

### Character Error Rate (CER)
- **Definition**: Percentage of characters incorrectly recognized
- **Formula**: `(Character Errors) / Total Characters × 100`
- **Typically lower than WER** (usually 60-80% of WER value)

## Test Environment Details

The system automatically captures:
- Browser type and version
- User language settings
- Timestamp of tests
- Speech recognition confidence levels

## Report Contents

### CSV Report Includes:
- Test number and phrase
- Recognized text
- WER and CER percentages
- Word-level accuracy statistics
- Error breakdowns (substitutions, deletions, insertions)
- Timestamps and browser information

### JSON Report Includes:
- All CSV data plus detailed metrics
- Test environment metadata
- Summary statistics
- Individual test results with full accuracy metrics

## Sample Report Data

```
Test Results Summary:
- Total Tests: 4
- Average WER: 12.5%
- Average CER: 8.2%
- Best WER: 3.1%
- Worst WER: 28.7%
- Browser: Chrome
- Generated: 2024-01-15T10:30:00Z
```

## Tips for Accurate Testing

### Environment Setup:
- Use a **good quality microphone**
- Test in a **quiet room**
- Ensure **stable internet connection**
- Use **Chrome or Edge** for best results (uses Google's speech API)

### Speaking Guidelines:
- Speak **clearly and naturally**
- **Normal pace** (not too fast or slow)
- **Consistent volume**
- **Minimize background noise**

## Interpretation for Reports

### For Academic Submissions:
- Include both **WER and CER metrics**
- Mention **test environment** (browser, conditions)
- Note **sample size** (4 educational phrases)
- Compare results to **industry benchmarks**:
  - Commercial ASR systems: 4-8% WER
  - Your browser-based system: Expected 10-20% WER

### Report Language Example:
*"Speech recognition accuracy was evaluated using 4 representative educational phrases. The Web Speech API achieved an average Word Error Rate (WER) of 12.5% and Character Error Rate (CER) of 8.2% in Chrome browser under controlled conditions. This performance is consistent with browser-based speech recognition systems and suitable for educational content summarization where minor transcription errors are compensated by AI-powered text processing."*

## Technical Notes

### Browser Differences:
- **Chrome/Edge**: Uses Google Cloud Speech (generally better accuracy)
- **Firefox**: Uses Mozilla's engine (may vary)
- **Safari**: Uses Apple's speech services (privacy-focused)

### Limitations:
- Results depend on **internet connection**
- **No custom model training** (uses browser's built-in engines)
- **English language only** in current implementation
- Accuracy varies with **speaker accent** and **audio quality**

## Troubleshooting

### Common Issues:
1. **"Speech recognition not supported"**
   - Try Chrome or Edge browser
   - Check microphone permissions

2. **Poor accuracy results**
   - Check microphone quality
   - Reduce background noise
   - Speak more clearly

3. **Recognition not starting**
   - Allow microphone permissions
   - Check internet connection
   - Try refreshing the page

## File Exports

### CSV Export (for spreadsheet analysis):
```csv
Test_Number,Test_Phrase,Recognized_Text,WER,CER,Total_Words,Correct_Words...
1,"Today we will learn about AI",Today we will learn about artificial intelligence,7.14,4.55,7,6...
```

### JSON Export (for detailed analysis):
```json
{
  "totalTests": 25,
  "averageWER": 12.5,
  "averageCER": 8.2,
  "results": [...],
  "testEnvironment": {...}
}
```

Both formats are suitable for academic report evidence and further analysis.
