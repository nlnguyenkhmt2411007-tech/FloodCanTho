
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

train = pd.read_csv(DATA_DIR / "train_dataset.csv")
test = pd.read_csv(DATA_DIR / "test_dataset.csv")

features = [
    "x_3857",
    "y_3857",
    "return_period_years"
]

target = "depth_m"

X_train = train[features]
y_train = train[target]

X_test = test[features]
y_test = test[target]

print("BAT DAU HUAN LUYEN RANDOM FOREST")
print(f"Train: {len(X_train):,} dong")
print(f"Test: {len(X_test):,} dong")

model = RandomForestRegressor(
    n_estimators=100,
    max_depth=20,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)
rmse = np.sqrt(
    mean_squared_error(y_test, predictions)
)
r2 = r2_score(y_test, predictions)

print("\nKET QUA DANH GIA:")
print(f"MAE: {mae:.6f} m")
print(f"RMSE: {rmse:.6f} m")
print(f"R2: {r2:.6f}")

print("\nSAI SO THEO NHOM DO SAU THUC TE:")

depth_groups = [
    ("Duoi 0.05 m", y_test < 0.05),
    ("0.05 - 0.10 m",
     (y_test >= 0.05) & (y_test < 0.10)),
    ("0.10 - 0.30 m",
     (y_test >= 0.10) & (y_test < 0.30)),
    ("Tu 0.30 m", y_test >= 0.30)
]

for name, mask in depth_groups:
    if mask.sum() > 0:
        group_mae = mean_absolute_error(
            y_test[mask],
            predictions[mask.to_numpy()]
        )
        print(
            f"{name}: {mask.sum():,} dong, "
            f"MAE = {group_mae:.6f} m"
        )

model_file = MODEL_DIR / "random_forest_depth.joblib"
joblib.dump(model, model_file)

results = test.copy()
results["predicted_depth_m"] = predictions
results["absolute_error_m"] = np.abs(
    y_test.to_numpy() - predictions
)

results_file = DATA_DIR / "rf_predictions.csv"
results.to_csv(
    results_file,
    index=False,
    encoding="utf-8-sig"
)

print(f"\nDa luu mo hinh: {model_file}")
print(f"Da luu du doan: {results_file}")
print("HOAN THANH")
