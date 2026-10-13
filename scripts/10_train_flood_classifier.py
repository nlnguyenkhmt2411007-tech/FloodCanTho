
from pathlib import Path

import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    precision_score,
    recall_score,
    f1_score,
)

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

train = pd.read_csv(DATA_DIR / "train_dataset.csv")
test = pd.read_csv(DATA_DIR / "test_dataset.csv")

features = [
    "x_3857",
    "y_3857",
    "return_period_years",
]

threshold = 0.30

X_train = train[features]
X_test = test[features]

y_train = (train["depth_m"] >= threshold).astype(int)
y_test = (test["depth_m"] >= threshold).astype(int)

print("TRAIN:", len(train))
print("TEST:", len(test))
print("Mau ngap sau TRAIN:", y_train.sum())
print("Mau ngap sau TEST:", y_test.sum())

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)

print("\nDang huan luyen Random Forest Classifier...")

model.fit(X_train, y_train)

predictions = model.predict(X_test)

print("\nMA TRAN NHAM LAN:")
print(confusion_matrix(y_test, predictions, labels=[0, 1]))

print("\nBAO CAO PHAN LOAI:")
print(
    classification_report(
        y_test,
        predictions,
        labels=[0, 1],
        target_names=["Duoi 0.30m", "Tu 0.30m"],
        zero_division=0,
    )
)

print("PRECISION:", round(
    precision_score(y_test, predictions, zero_division=0), 4
))

print("RECALL:", round(
    recall_score(y_test, predictions, zero_division=0), 4
))

print("F1:", round(
    f1_score(y_test, predictions, zero_division=0), 4
))

model_file = MODEL_DIR / "random_forest_classifier.joblib"
joblib.dump(model, model_file)

results = test.copy()
results["actual_flood_class"] = y_test
results["predicted_flood_class"] = predictions
results["flood_probability"] = model.predict_proba(X_test)[:, 1]

output_file = DATA_DIR / "classifier_predictions.csv"
results.to_csv(output_file, index=False, encoding="utf-8-sig")

print("\nDa luu mo hinh:", model_file)
print("Da luu ket qua:", output_file)
print("HOAN THANH")
