
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]

INPUT_FILE = (
    ROOT / "data" / "processed" /
    "classifier_v2_test_results.csv"
)

data = pd.read_csv(INPUT_FILE)

# Chi phan tich cac truong hop ngap tu 0.30m
flooded = data[data["depth_m"] >= 0.30].copy()

groups = [
    ("0.30-0.50m", 0.30, 0.50),
    ("0.50-1.00m", 0.50, 1.00),
    ("Tu 1.00m", 1.00, float("inf")),
]

print("\nDANH GIA V2 THEO DO SAU NGAP")

total_tp = 0
total_fn = 0

for name, lower, upper in groups:

    subset = flooded[
        (flooded["depth_m"] >= lower) &
        (flooded["depth_m"] < upper)
    ]

    tp = int((subset["predicted_risk"] == 1).sum())
    fn = int((subset["predicted_risk"] == 0).sum())

    total = len(subset)

    recall = tp / total if total > 0 else 0

    total_tp += tp
    total_fn += fn

    print(f"\nNhom: {name}")
    print("Tong truong hop:", total)
    print("TP:", tp)
    print("FN:", fn)
    print(f"Recall: {recall:.4f}")

print("\nKIEM TRA TONG:")
print("Tong TP:", total_tp)
print("Tong FN:", total_fn)
print("Tong ngap:", total_tp + total_fn)

assert total_tp == 461
assert total_fn == 503

print("\nHOAN THANH BUOC 33")
