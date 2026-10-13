
from pathlib import Path
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Chi su dung train_final de huan luyen
train = pd.read_csv(DATA_DIR / "train_final.csv")
validation = pd.read_csv(
    DATA_DIR / "validation_dataset.csv"
)

features = [
    "x_3857",
    "y_3857",
    "return_period_years",
]

depth_threshold = 0.30

X_train = train[features]
y_train = (
    train["depth_m"] >= depth_threshold
).astype(int)

X_val = validation[features]
y_val = (
    validation["depth_m"] >= depth_threshold
).astype(int)

print("TRAIN:", len(train))
print("VALIDATION:", len(validation))
print("Mau ngap sau TRAIN:", y_train.sum())
print("Mau ngap sau VALIDATION:", y_val.sum())

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)

print("\nDang huan luyen mo hinh moi...")
model.fit(X_train, y_train)

# Xac suat ngap sau tren validation
probabilities = model.predict_proba(X_val)[:, 1]

thresholds = [
    0.10, 0.15, 0.20, 0.25, 0.30,
    0.35, 0.40, 0.45, 0.50, 0.55,
    0.60, 0.65, 0.70, 0.75, 0.80,
    0.85, 0.90
]

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

    results.append({
        "threshold": threshold,
        "precision": round(
            precision_score(
                y_val, predictions, zero_division=0
            ), 4
        ),
        "recall": round(
            recall_score(
                y_val, predictions, zero_division=0
            ), 4
        ),
        "f1_score": round(
            f1_score(
                y_val, predictions, zero_division=0
            ), 4
        ),
        "true_positive": int(tp),
        "false_negative": int(fn),
        "false_positive": int(fp),
    })

result_df = pd.DataFrame(results)

print("\nKET QUA TREN VALIDATION:")
print(result_df.to_string(index=False))

# Luu mo hinh moi, khong ghi de mo hinh cu
model_file = (
    MODEL_DIR / "random_forest_classifier_final.joblib"
)
joblib.dump(model, model_file)

# Luu ket qua de phan tich
output_file = (
    DATA_DIR / "validation_threshold_analysis.csv"
)
result_df.to_csv(
    output_file,
    index=False,
    encoding="utf-8-sig"
)

print("\nDa luu mo hinh:", model_file)
print("Da luu bang phan tich:", output_file)
print("HOAN THANH BUOC 13")
