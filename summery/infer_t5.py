import argparse
from typing import List, Optional

from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run summarization inference with a fine-tuned t5 model")
    parser.add_argument("--model_path", type=str, default="summery/outputs/t5-small-xsum")
    parser.add_argument("--text", type=str, default=None, help="Raw text to summarize")
    parser.add_argument("--file", type=str, default=None, help="Path to a text file to summarize")
    parser.add_argument("--max_length", type=int, default=128)
    parser.add_argument("--min_length", type=int, default=8)
    parser.add_argument("--num_beams", type=int, default=4)
    return parser.parse_args()


def load_input_text(args: argparse.Namespace) -> str:
    if args.text:
        return args.text
    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            return f.read()
    # Fallback interactive prompt
    print("Enter/paste text, then press Ctrl+Z (Windows) + Enter to finish:")
    try:
        import sys

        return sys.stdin.read()
    except KeyboardInterrupt:
        return ""


def main() -> None:
    args = parse_args()
    text = load_input_text(args)
    if not text.strip():
        print("No input text provided.")
        return

    tokenizer = AutoTokenizer.from_pretrained(args.model_path)
    model = AutoModelForSeq2SeqLM.from_pretrained(args.model_path)

    summarizer = pipeline(
        task="summarization",
        model=model,
        tokenizer=tokenizer,
    )

    prefixed = "summarize: " + text
    outputs = summarizer(
        prefixed,
        max_length=args.max_length,
        min_length=args.min_length,
        num_beams=args.num_beams,
        do_sample=False,
    )
    summary_text = outputs[0]["summary_text"]
    print("\n=== Summary ===\n")
    print(summary_text)


if __name__ == "__main__":
    main()


