
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio

ROOT = Path(__file__).resolve().parents[1]

RASTER_FILE = ROOT / "data" / "raw" / "100years.tif"
SPLIT_FILE = ROOT / "data" / "processed" / "spatial_block_split.csv"
OUTPUT_FILE = ROOT / "data" / "processed" / "train_locations_v2.csv"

BLOCK_SIZE = 200
RANDOM_SEED = 42

TARGET_COUNTS = {
    "A": 8000,
    "B": 5000,
    "C": 5000,
    "D": 2000,
}

rng = np.random.default_rng(RANDOM_SEED)

blocks = pd.read_csv(SPLIT_FILE)
train_blocks = blocks[blocks["dataset"] == "train"]

with rasterio.open(RASTER_FILE) as src:
    depth = src.read(1, masked=True)

    valid = (
        ~np.ma.getmaskarray(depth)
        & np.isfinite(depth.data)
    )

    height, width = depth.shape

# Chi cho phep lay mau tu cac khoi train
train_mask = np.zeros((height, width), dtype=bool)

for item in train_blocks.itertuples(index=False):
    r0 = int(item.block_row) * BLOCK_SIZE
    c0 = int(item.block_col) * BLOCK_SIZE

    r1 = min(r0 + BLOCK_SIZE, height)
    c1 = min(c0 + BLOCK_SIZE, width)

    train_mask[r0:r1, c0:c1] = True

eligible = valid & train_mask

group_masks = {
    "A": eligible & (depth.data < 0.05),
    "B": eligible & (
        (depth.data >= 0.05) &
        (depth.data < 0.30)
    ),
    "C": eligible & (
        (depth.data >= 0.30) &
        (depth.data < 1.00)
    ),
    "D": eligible & (depth.data >= 1.00),
}

samples = []

for group, target in TARGET_COUNTS.items():
    rows, cols = np.where(group_masks[group])

    available = len(rows)

    if available < target:
        raise ValueError(
            f"Nhom {group} chi co {available} pixel, "
            f"khong du {target} mau."
        )

    selected = rng.choice(
        available,
        size=target,
        replace=False
    )

    for index in selected:
        samples.append({
            "row": int(rows[index]),
            "col": int(cols[index]),
            "depth_group": group,
        })

result = pd.DataFrame(samples)

# Tron thu tu cac dong
result = result.sample(
    frac=1,
    random_state=RANDOM_SEED
).reset_index(drop=True)

assert len(result) == 20000
assert not result.duplicated(["row", "col"]).any()

result.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print("\nKET QUA LAY MAU TRAIN V2")
print("Tong vi tri:", len(result))

print("\nSO VI TRI THEO NHOM:")
print(
    result["depth_group"]
    .value_counts()
    .sort_index()
)

print("\nSO VI TRI TRUNG LAP:",
      result.duplicated(["row", "col"]).sum())

print("\nDA LUU:", OUTPUT_FILE)
print("HOAN THANH BUOC 27")
