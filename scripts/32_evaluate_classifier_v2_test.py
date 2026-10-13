
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    balanced_accuracy_score
)

ROOT = Path(__file__).resolve().parents[1]

DATA_DIR = ROOT / "data" / "processed"
MODEL_FILE = (
    ROOT / "models" /
    "random_forest_classifier_v2.joblib"
)

TEST_FILE = DATA_DIR / "test_dataset_v2.csv"
OUTPUT_FILE = (
    DATA_DIR / "classifier_v2_test_results.csv"
)

FEATURES = [
    "x_3857",
    "y_3857",
    "return_period_years"
]

DEPTH_THRESHOLD = 0.30
PROBABILITY_THRESHOLD = 0.50

print("DANG DOC MO HINH VA TEST V2...")

model = joblib.load(MODEL_FILE)
test = pd.read_csv(TEST_FILE)

X_test = test[FEATURES]

y_test = (
    test["depth_m"] >= DEPTH_THRESHOLD
).astype(int)

probabilities = model.predict_proba(
    X_test
)[:, 1]

predictions = (
    probabilities >= PROBABILITY_THRESHOLD
).astype(int)

tn, fp, fn, tp = confusion_matrix(
    y_test,
    predictions,
    labels=[0, 1]
).ravel()

precision = precision_score(
    y_test,
    predictions,
    zero_division=0
)

recall = recall_score(
    y_test,
    predictions,
    zero_division=0
)

f1 = f1_score(
    y_test,
    predictions,
    zero_division=0
)

balanced_acc = balanced_accuracy_score(
    y_test,
    predictions
)

# Luu ket qua tung dong de phan tich sau
result = test.copy()

result["actual_risk"] = y_test
result["predicted_probability"] = probabilities
result["predicted_risk"] = predictions

result.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print("\nKET QUA TEST CLASSIFIER V2")
print("Tong so dong:", len(test))
print("So dong ngap thuc te:", int(y_test.sum()))
print("Nguong do sau:", DEPTH_THRESHOLD)
print("Nguong xac suat:", PROBABILITY_THRESHOLD)

print("\nCONFUSION MATRIX:")
print("TN:", tn)
print("FP:", fp)
print("FN:", fn)
print("TP:", tp)

print("\nCHI SO DANH GIA:")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1-score: {f1:.4f}")
print(f"Balanced accuracy: {balanced_acc:.4f}")

print("\nDA LUU:", OUTPUT_FILE)
print("HOAN THANH BUOC 32")
