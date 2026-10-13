
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score
)

ROOT = Path(__file__).resolve().parents[1]

DATA_DIR = ROOT / "data" / "processed"
MODEL_FILE = (
    ROOT / "models" /
    "random_forest_classifier_v2.joblib"
)

VAL_FILE = DATA_DIR / "validation_dataset_v2.csv"
OUTPUT_FILE = DATA_DIR / "threshold_analysis_v2.csv"

FEATURES = [
    "x_3857",
    "y_3857",
    "return_period_years"
]

model = joblib.load(MODEL_FILE)
validation = pd.read_csv(VAL_FILE)

X_val = validation[FEATURES]
y_val = (
    validation["depth_m"] >= 0.30
).astype(int)

probabilities = model.predict_proba(X_val)[:, 1]

thresholds = np.arange(0.10, 0.91, 0.10)

results = []

for threshold in thresholds:

    predictions = (
        probabilities >= threshold
    ).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_val,
        predictions,
        labels=[0, 1]
    ).ravel()

    precision = precision_score(
        y_val,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_val,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_val,
        predictions,
        zero_division=0
    )

    results.append({
        "threshold": round(float(threshold), 2),
        "TP": int(tp),
        "FN": int(fn),
        "FP": int(fp),
        "TN": int(tn),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4)
    })

result = pd.DataFrame(results)

result.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print("\nPHAN TICH NGUONG XAC SUAT V2")
print(result.to_string(index=False))

best_index = result["f1_score"].idxmax()
best_row = result.loc[best_index]

print("\nNGUONG CO F1 CAO NHAT TREN VALIDATION:")
print("Threshold:", best_row["threshold"])
print("Precision:", best_row["precision"])
print("Recall:", best_row["recall"])
print("F1-score:", best_row["f1_score"])

print("\nDA LUU:", OUTPUT_FILE)
print("HOAN THANH BUOC 31")
