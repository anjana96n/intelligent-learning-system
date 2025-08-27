# T5 Model ROUGE Accuracy Evaluation

This directory contains scripts for evaluating the accuracy of T5 summarization models using ROUGE metrics.

## Files

- `infer_t5.py` - Original inference script for T5 summarization
- `calculate_rouge_accuracy.py` - Script to calculate ROUGE-1 F1 accuracy
- `requirements.txt` - Python dependencies needed
- `sample_dataset.json` - Sample dataset format for evaluation
- `outputs/` - Directory containing the fine-tuned T5 model

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Single Example Evaluation

Evaluate a single input-reference pair:

```bash
python calculate_rouge_accuracy.py \
    --model_path "summery/outputs/t5-small-xsum" \
    --input_text "Your input text here..." \
    --reference_summary "Expected reference summary..."
```

### Dataset Evaluation

Evaluate on a dataset from JSON file:

```bash
python calculate_rouge_accuracy.py \
    --model_path "summery/outputs/t5-small-xsum" \
    --dataset_file "sample_dataset.json" \
    --output_file "evaluation_results.json"
```

### Dataset Format

The JSON dataset should be an array of objects with `input_text` and `reference_summary` fields:

```json
[
  {
    "input_text": "Text to be summarized...",
    "reference_summary": "Expected reference summary..."
  },
  ...
]
```

## Parameters

- `--model_path`: Path to the fine-tuned T5 model (default: "summery/outputs/t5-small-xsum")
- `--input_text`: Single input text for evaluation
- `--reference_summary`: Reference summary for single input
- `--dataset_file`: JSON file containing evaluation dataset
- `--max_length`: Maximum length for generated summaries (default: 128)
- `--min_length`: Minimum length for generated summaries (default: 8)
- `--num_beams`: Number of beams for beam search (default: 4)
- `--output_file`: File to save detailed results
- `--batch_size`: Batch size for processing (default: 1)

## Output Metrics

The script calculates several ROUGE metrics:

- **ROUGE-1 F1**: Primary accuracy metric (overlap of unigrams)
- **ROUGE-2 F1**: Overlap of bigrams
- **ROUGE-L F1**: Longest common subsequence
- Precision and Recall for each metric

### Example Output

```
==================================================
ROUGE-1 F1 ACCURACY RESULTS
==================================================
Total Examples: 3
Average ROUGE-1 F1: 0.4523
Median ROUGE-1 F1:  0.4102
Std Dev ROUGE-1 F1: 0.0892
Min ROUGE-1 F1:     0.3845
Max ROUGE-1 F1:     0.5678

Other ROUGE Metrics (Average):
ROUGE-1 Precision:  0.4234
ROUGE-1 Recall:     0.4891
ROUGE-2 F1:         0.2145
ROUGE-L F1:         0.4012
==================================================
```

## Notes

- ROUGE-1 F1 is the primary metric for summarization quality
- Higher scores indicate better summarization performance
- Typical good scores range from 0.3-0.6 depending on the dataset
- The script supports both individual example evaluation and batch processing
