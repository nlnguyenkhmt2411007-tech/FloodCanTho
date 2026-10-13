
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "processed"

input_file = DATA_DIR / "rainfall_scenario_samples.csv"
output_file = DATA_DIR / "ml_dataset.csv"

df = pd.read_csv(input_file)

periods = [2, 5, 10, 20, 50, 100]
frames = []

for period in periods:
    part = df[
        ["row", "col", "x_3857", "y_3857",
         f"depth_{period}y_m"]
    ].copy()

    part["return_period_years"] = period

    part = part.rename(
        columns={f"depth_{period}y_m": "depth_m"}
    )

    frames.append(part)

ml_df = pd.concat(frames, ignore_index=True)

ml_df = ml_df[
    [
        "row",
        "col",
        "x_3857",
        "y_3857",
        "return_period_years",
        "depth_m",
    ]
]

if ml_df["depth_m"].isna().any():
    raise ValueError("Phat hien target bi thieu!")

if ml_df.duplicated(
    ["row", "col", "return_period_years"]
).any():
    raise ValueError("Phat hien dong du lieu trung!")

ml_df.to_csv(
    output_file,
    index=False,
    encoding="utf-8-sig"
)

print("\nHOAN THANH TAO ML DATASET")
print(f"So dong: {len(ml_df):,}")
print(f"So cot: {len(ml_df.columns)}")
print(f"Gia tri thieu: {ml_df.isna().sum().sum()}")
print(f"Da luu: {output_file}")

print("\n5 dong dau tien:")
print(ml_df.head().to_string(index=False))

print("\nThong ke target depth_m:")
print(ml_df["depth_m"].describe())
