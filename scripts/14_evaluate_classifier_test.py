
from pathlib import Path
import pandas as pd
import joblib

from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"

# Doc mo hinh da huan luyen o buoc 13
model = joblib.load(
    MODEL_DIR / "random_forest_classifier_final.joblib"
)

# Chi doc test de danh gia cuoi cung
test = pd.read_csv(
    DATA_DIR / "test_dataset.csv"
)

features = [
    "x_3857",
    "y_3857",
    "return_period_years",
]

depth_threshold = 0.30
probability_threshold = 0.60

X_test = test[features]

y_true = (
    test["depth_m"] >= depth_threshold
).astype(int)

probabilities = model.predict_proba(X_test)[:, 1]

y_pred = (
    probabilities >= probability_threshold
).astype(int)

tn, fp, fn, tp = confusion_matrix(
    y_true,
    y_pred,
    labels=[0, 1]
).ravel()

precision = precision_score(
    y_true, y_pred, zero_division=0
)

recall = recall_score(
    y_true, y_pred, zero_division=0
)

f1 = f1_score(
    y_true, y_pred, zero_division=0
)

print("\nDANH GIA CUOI CUNG TREN TEST")
print("So mau test:", len(test))
print("Nguong do sau:", depth_threshold)
print("Nguong xac suat:", probability_threshold)

print("\nMA TRAN NHAM LAN:")
print("True Negative:", tn)
print("False Positive:", fp)
print("False Negative:", fn)
print("True Positive:", tp)

print("\nCHI SO NHOM NGAP SAU:")
print("Precision:", round(precision, 4))
print("Recall:", round(recall, 4))
print("F1-score:", round(f1, 4))

print("\nBAO CAO CHI TIET:")
print(
    classification_report(
        y_true,
        y_pred,
        labels=[0, 1],
        target_names=[
            "Duoi 0.30m",
            "Tu 0.30m",
        ],
        zero_division=0,
    )
)

# Luu ket qua de phuc vu bao cao
results = test.copy()

results["actual_flood_class"] = y_true
results["predicted_flood_class"] = y_pred
results["flood_probability"] = probabilities

output_file = (
    DATA_DIR / "final_classifier_test_results.csv"
)

results.to_csv(
    output_file,
    index=False,
    encoding="utf-8-sig"
)

print("\nDa luu ket qua:", output_file)
print("HOAN THANH BUOC 14")
