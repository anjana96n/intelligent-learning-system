import argparse
import json
import statistics
from typing import List, Dict, Tuple, Optional
import sys

from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
from rouge_score import rouge_scorer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Calculate ROUGE-1 F1 accuracy for T5 summarization model")
    parser.add_argument("--model_path", type=str, default="summery/outputs/t5-small-xsum", 
                        help="Path to the fine-tuned T5 model")
    parser.add_argument("--input_text", type=str, default=None, 
                        help="Single input text to summarize and evaluate")
    parser.add_argument("--reference_summary", type=str, default=None, 
                        help="Reference summary for single input evaluation")
    parser.add_argument("--dataset_file", type=str, default=None, 
                        help="JSON file containing dataset with 'input_text' and 'reference_summary' fields")
    parser.add_argument("--max_length", type=int, default=128, 
                        help="Maximum length for generated summaries")
    parser.add_argument("--min_length", type=int, default=8, 
                        help="Minimum length for generated summaries")
    parser.add_argument("--num_beams", type=int, default=4, 
                        help="Number of beams for beam search")
    parser.add_argument("--output_file", type=str, default=None, 
                        help="File to save detailed results")
    parser.add_argument("--batch_size", type=int, default=1, 
                        help="Batch size for processing multiple examples")
    return parser.parse_args()


def load_model_and_tokenizer(model_path: str) -> Tuple[pipeline, AutoTokenizer]:
    """Load the T5 model and tokenizer."""
    print(f"Loading model from: {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_path)
    
    summarizer = pipeline(
        task="summarization",
        model=model,
        tokenizer=tokenizer,
    )
    
    return summarizer, tokenizer


def generate_summary(summarizer: pipeline, text: str, args: argparse.Namespace) -> str:
    """Generate a summary using the T5 model."""
    prefixed_text = "summarize: " + text
    
    outputs = summarizer(
        prefixed_text,
        max_length=args.max_length,
        min_length=args.min_length,
        num_beams=args.num_beams,
        do_sample=False,
    )
    
    return outputs[0]["summary_text"]


def calculate_rouge_scores(generated_summary: str, reference_summary: str) -> Dict[str, float]:
    """Calculate ROUGE scores for a generated summary against reference."""
    scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
    scores = scorer.score(reference_summary, generated_summary)
    
    return {
        'rouge1_precision': scores['rouge1'].precision,
        'rouge1_recall': scores['rouge1'].recall,
        'rouge1_f1': scores['rouge1'].fmeasure,
        'rouge2_precision': scores['rouge2'].precision,
        'rouge2_recall': scores['rouge2'].recall,
        'rouge2_f1': scores['rouge2'].fmeasure,
        'rougeL_precision': scores['rougeL'].precision,
        'rougeL_recall': scores['rougeL'].recall,
        'rougeL_f1': scores['rougeL'].fmeasure,
    }


def evaluate_single_example(summarizer: pipeline, input_text: str, reference_summary: str, 
                          args: argparse.Namespace) -> Dict:
    """Evaluate a single input-reference pair."""
    generated_summary = generate_summary(summarizer, input_text, args)
    rouge_scores = calculate_rouge_scores(generated_summary, reference_summary)
    
    return {
        'input_text': input_text,
        'reference_summary': reference_summary,
        'generated_summary': generated_summary,
        'rouge_scores': rouge_scores
    }


def load_dataset_from_json(file_path: str) -> List[Dict[str, str]]:
    """Load dataset from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Support different JSON formats
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and 'data' in data:
        return data['data']
    else:
        raise ValueError("JSON file should contain a list of examples or have a 'data' key with the list")


def evaluate_dataset(summarizer: pipeline, dataset: List[Dict[str, str]], 
                    args: argparse.Namespace) -> Dict:
    """Evaluate the model on a dataset."""
    results = []
    all_rouge1_f1_scores = []
    
    print(f"Evaluating {len(dataset)} examples...")
    
    for i, example in enumerate(dataset):
        if 'input_text' not in example or 'reference_summary' not in example:
            print(f"Skipping example {i}: missing required fields")
            continue
            
        print(f"Processing example {i+1}/{len(dataset)}")
        
        result = evaluate_single_example(
            summarizer, 
            example['input_text'], 
            example['reference_summary'], 
            args
        )
        
        results.append(result)
        all_rouge1_f1_scores.append(result['rouge_scores']['rouge1_f1'])
    
    # Calculate aggregate statistics
    aggregate_stats = {
        'total_examples': len(results),
        'average_rouge1_f1': statistics.mean(all_rouge1_f1_scores),
        'median_rouge1_f1': statistics.median(all_rouge1_f1_scores),
        'std_rouge1_f1': statistics.stdev(all_rouge1_f1_scores) if len(all_rouge1_f1_scores) > 1 else 0,
        'min_rouge1_f1': min(all_rouge1_f1_scores),
        'max_rouge1_f1': max(all_rouge1_f1_scores),
    }
    
    # Calculate aggregate scores for all ROUGE metrics
    rouge_metrics = ['rouge1_f1', 'rouge1_precision', 'rouge1_recall', 
                    'rouge2_f1', 'rouge2_precision', 'rouge2_recall',
                    'rougeL_f1', 'rougeL_precision', 'rougeL_recall']
    
    for metric in rouge_metrics:
        scores = [result['rouge_scores'][metric] for result in results]
        aggregate_stats[f'average_{metric}'] = statistics.mean(scores)
    
    return {
        'individual_results': results,
        'aggregate_statistics': aggregate_stats
    }


def save_results_to_file(results: Dict, output_file: str):
    """Save detailed results to a JSON file."""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"Detailed results saved to: {output_file}")


def print_summary_stats(stats: Dict):
    """Print summary statistics."""
    print("\n" + "="*50)
    print("ROUGE-1 F1 ACCURACY RESULTS")
    print("="*50)
    print(f"Total Examples: {stats['total_examples']}")
    print(f"Average ROUGE-1 F1: {stats['average_rouge1_f1']:.4f}")
    print(f"Median ROUGE-1 F1:  {stats['median_rouge1_f1']:.4f}")
    print(f"Std Dev ROUGE-1 F1: {stats['std_rouge1_f1']:.4f}")
    print(f"Min ROUGE-1 F1:     {stats['min_rouge1_f1']:.4f}")
    print(f"Max ROUGE-1 F1:     {stats['max_rouge1_f1']:.4f}")
    
    print("\nOther ROUGE Metrics (Average):")
    print(f"ROUGE-1 Precision:  {stats['average_rouge1_precision']:.4f}")
    print(f"ROUGE-1 Recall:     {stats['average_rouge1_recall']:.4f}")
    print(f"ROUGE-2 F1:         {stats['average_rouge2_f1']:.4f}")
    print(f"ROUGE-L F1:         {stats['average_rougeL_f1']:.4f}")
    print("="*50)


def main():
    args = parse_args()
    
    # Validate arguments
    if args.input_text and not args.reference_summary:
        print("Error: When providing --input_text, you must also provide --reference_summary")
        sys.exit(1)
    
    if not args.input_text and not args.dataset_file:
        print("Error: You must provide either --input_text with --reference_summary, or --dataset_file")
        sys.exit(1)
    
    # Load model
    summarizer, tokenizer = load_model_and_tokenizer(args.model_path)
    
    if args.input_text and args.reference_summary:
        # Single example evaluation
        print("Evaluating single example...")
        result = evaluate_single_example(summarizer, args.input_text, args.reference_summary, args)
        
        print(f"\nInput Text: {result['input_text'][:200]}...")
        print(f"\nReference Summary: {result['reference_summary']}")
        print(f"\nGenerated Summary: {result['generated_summary']}")
        print(f"\nROUGE-1 F1 Score: {result['rouge_scores']['rouge1_f1']:.4f}")
        print(f"ROUGE-1 Precision: {result['rouge_scores']['rouge1_precision']:.4f}")
        print(f"ROUGE-1 Recall: {result['rouge_scores']['rouge1_recall']:.4f}")
        
    elif args.dataset_file:
        # Dataset evaluation
        dataset = load_dataset_from_json(args.dataset_file)
        results = evaluate_dataset(summarizer, dataset, args)
        
        print_summary_stats(results['aggregate_statistics'])
        
        if args.output_file:
            save_results_to_file(results, args.output_file)


if __name__ == "__main__":
    main()
