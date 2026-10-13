
from pathlib import Path
import time

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import HistGradientBoostingClassifier
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

TRAIN_FILE = DATA_DIR / "train_dataset_v2.csv"
VAL_FILE = DATA_DIR / "validation_dataset_v2.csv"

MODEL_FILE = MODEL_DIR / "hist_gradient_boosting_v3.joblib"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

print("\nDANG DOC DU LIEU V3...")

train = pd.read_csv(TRAIN_FILE)
val = pd.read_csv(VAL_FILE)

# Su dung toa do pixel va kich ban.
# row, col co y nghia tuong duong toa do vi tri
# tren luoi raster hien tai.
FEATURES = [
    "row",
    "col",
    "return_period_years"
]

X_train = train[FEATURES]
X_val = val[FEATURES]

y_train = (
    train["depth_m"] >= 0.30
).astype(int)

y_val = (
    val["depth_m"] >= 0.30
).astype(int)

print("So dong Train:", len(train))
print("So dong Validation:", len(val))
print("So mau ngap Train:", int(y_train.sum()))
print("So mau ngap Validation:", int(y_val.sum()))

print("\nDANG HUAN LUYEN V3...")

start = time.time()

model = HistGradientBoostingClassifier(
    max_iter=200,
    max_leaf_nodes=31,
    learning_rate=0.05,
    min_samples_leaf=20,
    l2_regularization=1.0,
    random_state=42
)

# Bu dap su mat can bang lop trong Train.
positive_count = int(y_train.sum())
negative_count = len(y_train) - positive_count

positive_weight = (
    negative_count / positive_count
    if positive_count > 0 else 1.0
)

sample_weight = np.where(
    y_train.to_numpy() == 1,
    positive_weight,
    1.0
)

model.fit(
    X_train,
    y_train,
    sample_weight=sample_weight
)

elapsed = time.time() - start

joblib.dump(
    {
        "model": model,
        "features": FEATURES,
        "depth_threshold_m": 0.30
    },
    MODEL_FILE
)

print(f"Thoi gian huan luyen: {elapsed:.2f} giay")
print("Da luu mo hinh:", MODEL_FILE)

print("\nDANH GIA VALIDATION V3")

probabilities = model.predict_proba(X_val)[:, 1]

# Chi dung nguong 0.50 de danh gia ban dau.
# Chua su dung Test V2.
threshold = 0.50

predictions = (
    probabilities >= threshold
).astype(int)

tn, fp, fn, tp = confusion_matrix(
    y_val,
    predictions,
    labels=[0, 1]
).ravel()

print("Nguong xac suat:", threshold)

print("\nCONFUSION MATRIX:")
print("TN:", tn)
print("FP:", fp)
print("FN:", fn)
print("TP:", tp)

print("\nCHI SO DANH GIA:")
print(
    "Precision:",
    round(
        precision_score(
            y_val, predictions, zero_division=0
        ), 4
    )
)
print(
    "Recall:",
    round(
        recall_score(
            y_val, predictions, zero_division=0
        ), 4
    )
)
print(
    "F1-score:",
    round(
        f1_score(
            y_val, predictions, zero_division=0
        ), 4
    )
)
print(
    "Balanced accuracy:",
    round(
        balanced_accuracy_score(
            y_val, predictions
        ), 4
    )
)

print("\nHOAN THANH BUOC 39")
