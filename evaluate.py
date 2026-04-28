"""
TrueLens Forensic Suite - Batch Evaluation Script
================================================

Run this to evaluate the local forensic engine on your test dataset.

Usage:
    python evaluate.py --fake-dir "data/v1_fake" --real-dir "data/v1_real"
"""

import os
import sys
import argparse
import time
from pathlib import Path
from PIL import Image
from src.engine.core_engine import ForensicScanner


def load_images_from_dir(directory: str):
    """Load all image files from a directory."""
    exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
    files = []
    for f in sorted(os.listdir(directory)):
        if Path(f).suffix.lower() in exts:
            files.append(os.path.join(directory, f))
    return files


def evaluate(scanner: ForensicScanner, fake_dir: str, real_dir: str):
    fake_images = load_images_from_dir(fake_dir)
    real_images = load_images_from_dir(real_dir)

    print(f"\n{'='*70}")
    print("TRUELENS FORENSIC SUITE — BATCH EVALUATION")
    print(f"{'='*70}")
    print(f"Mode: Local Forensic Engine")
    print(f"Fake samples: {len(fake_images)}")
    print(f"Real samples: {len(real_images)}")
    print(f"{'='*70}\n")

    results = {
        "tp": 0, "fp": 0, "tn": 0, "fn": 0,
        "uncertain_fake": 0, "uncertain_real": 0,
        "errors": 0,
        "details": []
    }

    def process_batch(images, ground_truth):
        gt = ground_truth.lower()
        for path in images:
            fname = os.path.basename(path)
            try:
                start = time.time()
                label, confidence, status, margin, detail = scanner.predict_image(path)
                elapsed = time.time() - start

                pred = label.lower()

                record = {
                    "file": fname,
                    "ground_truth": gt,
                    "prediction": pred,
                    "confidence": confidence,
                    "status": status,
                    "latency": f"{elapsed:.2f}s"
                }

                if pred == "fake":
                    if gt == "fake":
                        results["tp"] += 1
                        record["result"] = "CORRECT"
                    else:
                        results["fp"] += 1
                        record["result"] = "FALSE POSITIVE"
                elif pred == "real":
                    if gt == "real":
                        results["tn"] += 1
                        record["result"] = "CORRECT"
                    else:
                        results["fn"] += 1
                        record["result"] = "FALSE NEGATIVE"
                else:  # uncertain
                    record["result"] = "UNCERTAIN"
                    if gt == "fake":
                        results["uncertain_fake"] += 1
                    else:
                        results["uncertain_real"] += 1

                results["details"].append(record)

                # Print live result
                symbol = "OK" if record["result"] == "CORRECT" else "XX"
                print(f"  [{symbol}] {fname:50s} => {pred.upper():10s} (conf={confidence:.3f}) [{record['result']}]")

            except Exception as e:
                results["errors"] += 1
                print(f"  [ERR] {fname:50s} => ERROR: {e}")
                results["details"].append({
                    "file": fname,
                    "ground_truth": gt,
                    "prediction": "ERROR",
                    "error": str(e)
                })

    print("[1/2] Processing FAKE images...")
    process_batch(fake_images, "fake")

    print("\n[2/2] Processing REAL images...")
    process_batch(real_images, "real")

    # Calculate metrics
    total_fake = len(fake_images)
    total_real = len(real_images)
    total = total_fake + total_real

    tp, fp, tn, fn = results["tp"], results["fp"], results["tn"], results["fn"]
    uncertain = results["uncertain_fake"] + results["uncertain_real"]

    accuracy = (tp + tn) / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    print(f"\n{'='*70}")
    print("EVALUATION RESULTS")
    print(f"{'='*70}")
    print(f"  Total Samples:      {total}")
    print(f"  Correct:            {tp + tn} ({(tp+tn)/total*100:.1f}%)")
    print(f"  Errors:             {results['errors']}")
    print(f"  Uncertain:          {uncertain}")
    print()
    print(f"  True Positives:     {tp}")
    print(f"  True Negatives:     {tn}")
    print(f"  False Positives:    {fp}")
    print(f"  False Negatives:    {fn}")
    print()
    print(f"  Accuracy:           {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"  Precision:          {precision:.4f}")
    print(f"  Recall/Sensitivity: {recall:.4f}")
    print(f"  Specificity:        {specificity:.4f}")
    print(f"  F1 Score:           {f1:.4f}")
    print(f"{'='*70}\n")

    # Per-class breakdown
    print("PER-CLASS BREAKDOWN:")
    fake_correct = results["tp"]
    fake_wrong = results["fn"] + results["uncertain_fake"]
    real_correct = results["tn"]
    real_wrong = results["fp"] + results["uncertain_real"]

    print(f"  Fake Detection Rate:  {fake_correct}/{total_fake} = {fake_correct/total_fake*100:.1f}%")
    print(f"  Real Detection Rate:  {real_correct}/{total_real} = {real_correct/total_real*100:.1f}%")
    print()

    return results


def main():
    parser = argparse.ArgumentParser(description="Evaluate TrueLens Forensic Suite")
    parser.add_argument("--fake-dir", default="data/v1_fake", help="Directory with fake images")
    parser.add_argument("--real-dir", default="data/v1_real", help="Directory with real images")
    args = parser.parse_args()

    print("Initializing Forensic Scanner...")
    scanner = ForensicScanner(mode="CPU")

    if not os.path.exists(args.fake_dir):
        print(f"ERROR: Fake directory not found: {args.fake_dir}")
        sys.exit(1)
    if not os.path.exists(args.real_dir):
        print(f"ERROR: Real directory not found: {args.real_dir}")
        sys.exit(1)

    evaluate(scanner, args.fake_dir, args.real_dir)


if __name__ == "__main__":
    main()
