
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "processed"

V1_TRAIN_FILE = DATA_DIR / "train_final.csv"
V2_TEST_FILE = DATA_DIR / "test_dataset_v2.csv"
BLOCK_SPLIT_FILE = DATA_DIR / "spatial_block_split.csv"

BLOCK_SIZE = 200

v1_train = pd.read_csv(V1_TRAIN_FILE)
v2_test = pd.read_csv(V2_TEST_FILE)
blocks = pd.read_csv(BLOCK_SPLIT_FILE)

# Moi vi tri xuat hien trong 6 kich ban,
# nen chi lay cac cap row, col duy nhat.
v1_locations = v1_train[
    ["row", "col"]
].drop_duplicates().copy()

v2_locations = v2_test[
    ["row", "col"]
].drop_duplicates().copy()

# Kiem tra trung chinh xac vi tri pixel
exact_overlap = v1_locations.merge(
    v2_locations,
    on=["row", "col"],
    how="inner"
)

# Gan khoi cho vi tri huan luyen V1
v1_locations["block_row"] = (
    v1_locations["row"] // BLOCK_SIZE
)

v1_locations["block_col"] = (
    v1_locations["col"] // BLOCK_SIZE
)

test_blocks = blocks[
    blocks["dataset"] == "test"
][["block_row", "block_col"]].drop_duplicates()

# Vi tri huan luyen V1 nam trong khoi Test V2
spatial_overlap = v1_locations.merge(
    test_blocks,
    on=["block_row", "block_col"],
    how="inner"
)

print("\nKIEM TRA CHONG LAN KHONG GIAN V1 - V2")

print("So vi tri Train V1:", len(v1_locations))
print("So vi tri Test V2:", len(v2_locations))

print("\nTRUNG CHINH XAC PIXEL:")
print("So vi tri trung:", len(exact_overlap))

print("\nCHONG LAN THEO KHOI 200x200:")
print(
    "So vi tri Train V1 trong khoi Test V2:",
    len(spatial_overlap)
)

print(
    "So khoi Test V2 chua vi tri Train V1:",
    spatial_overlap[
        ["block_row", "block_col"]
    ].drop_duplicates().shape[0]
)

ratio = (
    len(spatial_overlap) / len(v1_locations) * 100
)

print(
    f"Ty le vi tri Train V1 trong khoi Test V2: "
    f"{ratio:.2f}%"
)

print("\nHOAN THANH BUOC 37")
