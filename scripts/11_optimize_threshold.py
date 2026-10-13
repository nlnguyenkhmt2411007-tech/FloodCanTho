
from pathlib import Path

import pandas as pd
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "processed"

df = pd.read_csv(
    DATA_DIR / "classifier_predictions.csv"
)

y_true = df["actual_flood_class"]
probabilities = df["flood_probability"]

thresholds = [
    0.10, 0.15, 0.20, 0.25, 0.30,
    0.35, 0.40, 0.45, 0.50, 0.55,
    0.60, 0.65, 0.70, 0.75, 0.80,
    0.85, 0.90
]

results = []

for threshold in thresholds:
    y_pred = (probabilities >= threshold).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_true, y_pred, labels=[0, 1]
    ).ravel()

    results.append({
        "threshold": threshold,
        "precision": round(
            precision_score(
                y_true, y_pred, zero_division=0
            ), 4
        ),
        "recall": round(
            recall_score(
                y_true, y_pred, zero_division=0
            ), 4
        ),
        "f1_score": round(
            f1_score(
                y_true, y_pred, zero_division=0
            ), 4
        ),
        "true_positive": int(tp),
        "false_negative": int(fn),
        "false_positive": int(fp),
        "true_negative": int(tn),
    })

result_df = pd.DataFrame(results)

print("\nKET QUA THEO TUNG NGUONG:")
print(result_df.to_string(index=False))

output_file = DATA_DIR / "threshold_analysis.csv"
result_df.to_csv(
    output_file,
    index=False,
    encoding="utf-8-sig"
)

print("\nDa luu:", output_file)
print("HOAN THANH")
