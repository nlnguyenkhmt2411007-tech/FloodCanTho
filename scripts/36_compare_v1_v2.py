
from pathlib import Path

import joblib
import pandas as pd

from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score
)

ROOT = Path(__file__).resolve().parents[1]

MODEL_DIR = ROOT / "models"
DATA_DIR = ROOT / "data" / "processed"

TEST_FILE = DATA_DIR / "test_dataset_v2.csv"

MODELS = [
    (
        "V1",
        MODEL_DIR / "random_forest_classifier_final.joblib",
        0.60
    ),
    (
        "V2",
        MODEL_DIR / "random_forest_classifier_v2.joblib",
        0.50
    )
]

FEATURES = [
    "x_3857",
    "y_3857",
    "return_period_years"
]

test = pd.read_csv(TEST_FILE)

X_test = test[FEATURES]
y_test = (test["depth_m"] >= 0.30).astype(int)

results = []

print("\nSO SANH V1 VA V2 TREN CUNG TEST V2")

for name, model_file, threshold in MODELS:

    model = joblib.load(model_file)

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    predictions = (
        probabilities >= threshold
    ).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_test,
        predictions,
        labels=[0, 1]
    ).ravel()

    results.append({
        "model": name,
        "threshold": threshold,
        "TP": int(tp),
        "FN": int(fn),
        "FP": int(fp),
        "TN": int(tn),
        "precision": precision_score(
            y_test, predictions, zero_division=0
        ),
        "recall": recall_score(
            y_test, predictions, zero_division=0
        ),
        "f1_score": f1_score(
            y_test, predictions, zero_division=0
        )
    })

result = pd.DataFrame(results)

print(
    result.round(4).to_string(index=False)
)

print("\nHOAN THANH BUOC 36")
