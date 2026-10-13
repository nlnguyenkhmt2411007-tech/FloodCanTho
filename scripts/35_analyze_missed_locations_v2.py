
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]

INPUT_FILE = (
    ROOT / "data" / "processed" /
    "classifier_v2_test_results.csv"
)

OUTPUT_FILE = (
    ROOT / "data" / "processed" /
    "missed_deep_locations_v2.csv"
)

BLOCK_SIZE = 200

data = pd.read_csv(INPUT_FILE)

# Chi lay truong hop ngap tu 1m nhung du doan khong ngap
missed = data[
    (data["depth_m"] >= 1.00) &
    (data["predicted_risk"] == 0)
].copy()

missed["block_row"] = (
    missed["row"] // BLOCK_SIZE
)

missed["block_col"] = (
    missed["col"] // BLOCK_SIZE
)

summary = missed.groupby(
    ["row", "col", "block_row", "block_col"],
    as_index=False
).agg(
    missed_scenarios=(
        "return_period_years", "count"
    ),
    max_missed_depth_m=(
        "depth_m", "max"
    ),
    mean_predicted_probability=(
        "predicted_probability", "mean"
    ),
    max_predicted_probability=(
        "predicted_probability", "max"
    )
)

summary = summary.sort_values(
    "max_missed_depth_m",
    ascending=False
)

summary.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print("\nPHAN TICH VI TRI NGAP SAU BI BO SOT V2")

print("Tong truong hop bo sot:", len(missed))
print("So vi tri khac nhau:", len(summary))

print(
    "So khoi khong gian khac nhau:",
    summary[
        ["block_row", "block_col"]
    ].drop_duplicates().shape[0]
)

print("\nDANH SACH CAC VI TRI:")
print(
    summary.round(4).to_string(index=False)
)

print("\nSO VI TRI THEO KHOI:")
print(
    summary.groupby(
        ["block_row", "block_col"]
    ).size().to_string()
)

print("\nDA LUU:", OUTPUT_FILE)
print("HOAN THANH BUOC 35")
