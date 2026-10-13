
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]

INPUT_FILE = (
    ROOT / "data" / "processed" /
    "classifier_v2_test_results.csv"
)

data = pd.read_csv(INPUT_FILE)

deep = data[data["depth_m"] >= 1.00].copy()

detected = deep[deep["predicted_risk"] == 1]
missed = deep[deep["predicted_risk"] == 0]

print("\nPHAN TICH LOI NGAP SAU V2")

print("Tong truong hop >= 1m:", len(deep))
print("Phat hien dung:", len(detected))
print("Bo sot:", len(missed))

print("\nXAC SUAT DU DOAN CUA 53 TRUONG HOP:")
print(
    deep["predicted_probability"]
    .describe()
    .round(4)
    .to_string()
)

print("\nXAC SUAT CUA CAC TRUONG HOP BO SOT:")
print(
    missed["predicted_probability"]
    .describe()
    .round(4)
    .to_string()
)

print("\nPHAN BO XAC SUAT CUA CAC TRUONG HOP BO SOT:")

ranges = [
    ("Duoi 0.10", 0.00, 0.10),
    ("0.10-0.20", 0.10, 0.20),
    ("0.20-0.30", 0.20, 0.30),
    ("0.30-0.40", 0.30, 0.40),
    ("0.40-0.50", 0.40, 0.50),
]

for name, lower, upper in ranges:
    count = int((
        (missed["predicted_probability"] >= lower)
        & (missed["predicted_probability"] < upper)
    ).sum())

    print(f"{name}: {count} truong hop")

print("\nSO VI TRI KHAC NHAU BI BO SOT:")
print(
    missed[["row", "col"]]
    .drop_duplicates()
    .shape[0]
)

print("\nHOAN THANH BUOC 34")
