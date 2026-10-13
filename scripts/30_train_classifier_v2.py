
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    balanced_accuracy_score
)

ROOT = Path(__file__).resolve().parents[1]

DATA_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

TRAIN_FILE = DATA_DIR / "train_dataset_v2.csv"
VAL_FILE = DATA_DIR / "validation_dataset_v2.csv"

FEATURES = [
    "x_3857",
    "y_3857",
    "return_period_years"
]

DEPTH_THRESHOLD = 0.30
PROBABILITY_THRESHOLD = 0.50

print("DANG DOC DU LIEU...")

train = pd.read_csv(TRAIN_FILE)
validation = pd.read_csv(VAL_FILE)

X_train = train[FEATURES]
y_train = (
    train["depth_m"] >= DEPTH_THRESHOLD
).astype(int)

X_val = validation[FEATURES]
y_val = (
    validation["depth_m"] >= DEPTH_THRESHOLD
).astype(int)

print("\nTHONG TIN DU LIEU:")
print("Train:", len(train), "dong")
print("Validation:", len(validation), "dong")
print("Train positive:", int(y_train.sum()))
print("Validation positive:", int(y_val.sum()))

print("\nDANG HUAN LUYEN RANDOM FOREST V2...")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

model_file = (
    MODEL_DIR / "random_forest_classifier_v2.joblib"
)

joblib.dump(model, model_file)

print("Da luu mo hinh:", model_file)

# Danh gia tren validation
probabilities = model.predict_proba(X_val)[:, 1]

predictions = (
    probabilities >= PROBABILITY_THRESHOLD
).astype(int)

tn, fp, fn, tp = confusion_matrix(
    y_val,
    predictions,
    labels=[0, 1]
).ravel()

precision = precision_score(
    y_val, predictions, zero_division=0
)

recall = recall_score(
    y_val, predictions, zero_division=0
)

f1 = f1_score(
    y_val, predictions, zero_division=0
)

balanced_acc = balanced_accuracy_score(
    y_val, predictions
)

print("\nKET QUA VALIDATION CLASSIFIER V2")
print("Nguong do sau:", DEPTH_THRESHOLD, "m")
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

print("\nHOAN THANH BUOC 30")
