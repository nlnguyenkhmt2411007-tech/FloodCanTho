
from pathlib import Path
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "processed"

# Doc tap train va test da tao truoc do
train_full = pd.read_csv(DATA_DIR / "train_dataset.csv")
test = pd.read_csv(DATA_DIR / "test_dataset.csv")

# Tao ma nhom theo vi tri raster
def get_groups(df):
    return (
        df["row"].astype(str)
        + "_"
        + df["col"].astype(str)
    )

groups = get_groups(train_full)

# Tach 20% train ban dau lam validation
splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.2,
    random_state=123
)

train_idx, val_idx = next(
    splitter.split(train_full, groups=groups)
)

train_new = train_full.iloc[train_idx].copy()
validation = train_full.iloc[val_idx].copy()

# Kiem tra khong trung vi tri giua 3 tap
train_groups = set(get_groups(train_new))
val_groups = set(get_groups(validation))
test_groups = set(get_groups(test))

assert train_groups.isdisjoint(val_groups)
assert train_groups.isdisjoint(test_groups)
assert val_groups.isdisjoint(test_groups)

# Luu thanh file moi, khong ghi de file cu
train_new.to_csv(
    DATA_DIR / "train_final.csv",
    index=False,
    encoding="utf-8-sig"
)

validation.to_csv(
    DATA_DIR / "validation_dataset.csv",
    index=False,
    encoding="utf-8-sig"
)

print("\nHOAN THANH TAO VALIDATION")
print(f"Train: {len(train_new):,} mau")
print(f"Validation: {len(validation):,} mau")
print(f"Test: {len(test):,} mau")

print("\nSO VI TRI:")
print("Train:", len(train_groups))
print("Validation:", len(val_groups))
print("Test:", len(test_groups))

print("\nSO MAU NGAP SAU >= 0.30m:")
for name, data in [
    ("Train", train_new),
    ("Validation", validation),
    ("Test", test)
]:
    count = (data["depth_m"] >= 0.30).sum()
    ratio = count / len(data) * 100

    print(
        f"{name}: {count} mau "
        f"({ratio:.3f}%)"
    )

print("\nKHONG CO VI TRI TRUNG GIUA 3 TAP")
