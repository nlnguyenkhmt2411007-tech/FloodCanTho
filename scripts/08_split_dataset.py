
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "processed"

df = pd.read_csv(DATA_DIR / "ml_dataset.csv")

# Moi vi tri (row, col) la mot nhom.
# Ca 6 kich ban cua cung vi tri phai nam trong cung mot tap.
groups = (
    df["row"].astype(str)
    + "_"
    + df["col"].astype(str)
)

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.2,
    random_state=42
)

train_idx, test_idx = next(
    splitter.split(df, groups=groups)
)

train_df = df.iloc[train_idx].copy()
test_df = df.iloc[test_idx].copy()

train_groups = set(groups.iloc[train_idx])
test_groups = set(groups.iloc[test_idx])

assert train_groups.isdisjoint(test_groups), (
    "Loi: Vi tri bi trung giua train va test!"
)

train_file = DATA_DIR / "train_dataset.csv"
test_file = DATA_DIR / "test_dataset.csv"

train_df.to_csv(
    train_file, index=False, encoding="utf-8-sig"
)
test_df.to_csv(
    test_file, index=False, encoding="utf-8-sig"
)

print("HOAN THANH CHIA DATASET")
print(f"Train: {len(train_df):,} dong")
print(f"Test: {len(test_df):,} dong")
print(f"So vi tri train: {len(train_groups):,}")
print(f"So vi tri test: {len(test_groups):,}")
print(
    "Vi tri trung giua hai tap:",
    len(train_groups & test_groups)
)

print("\nThong ke target:")
print(
    pd.DataFrame({
        "train": train_df["depth_m"].describe(),
        "test": test_df["depth_m"].describe()
    })
)
