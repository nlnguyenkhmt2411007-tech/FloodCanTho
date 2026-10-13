
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
RASTER_FILE = ROOT / "data" / "raw" / "100years.tif"
OUTPUT_DIR = ROOT / "data" / "processed"

BLOCK_SIZE = 200

with rasterio.open(RASTER_FILE) as src:
    depth = src.read(1, masked=True)

    valid = (
        ~np.ma.getmaskarray(depth)
        & np.isfinite(depth.data)
    )

    height, width = depth.shape

    block_records = []

    for row_start in range(0, height, BLOCK_SIZE):
        for col_start in range(0, width, BLOCK_SIZE):

            row_end = min(row_start + BLOCK_SIZE, height)
            col_end = min(col_start + BLOCK_SIZE, width)

            block_valid = valid[
                row_start:row_end,
                col_start:col_end
            ]

            if not block_valid.any():
                continue

            block_depth = depth.data[
                row_start:row_end,
                col_start:col_end
            ][block_valid]

            max_depth = float(block_depth.max())

            if max_depth >= 1.00:
                risk_group = "D"
            elif max_depth >= 0.30:
                risk_group = "C"
            elif max_depth >= 0.05:
                risk_group = "B"
            else:
                risk_group = "A"

            block_records.append({
                "block_row": row_start // BLOCK_SIZE,
                "block_col": col_start // BLOCK_SIZE,
                "valid_pixels": int(block_valid.sum()),
                "max_depth_m": max_depth,
                "risk_group": risk_group,
            })

blocks = pd.DataFrame(block_records)

# Chia 60% train, 40% tam thoi
train_blocks, remaining = train_test_split(
    blocks,
    test_size=0.40,
    random_state=42,
    stratify=blocks["risk_group"]
)

# Chia 40% con lai thanh validation va test
val_blocks, test_blocks = train_test_split(
    remaining,
    test_size=0.50,
    random_state=42,
    stratify=remaining["risk_group"]
)

train_blocks = train_blocks.copy()
val_blocks = val_blocks.copy()
test_blocks = test_blocks.copy()

train_blocks["dataset"] = "train"
val_blocks["dataset"] = "validation"
test_blocks["dataset"] = "test"

result = pd.concat(
    [train_blocks, val_blocks, test_blocks],
    ignore_index=True
)

assert not result.duplicated(
    ["block_row", "block_col"]
).any()

output_file = OUTPUT_DIR / "spatial_block_split.csv"

result.to_csv(
    output_file,
    index=False,
    encoding="utf-8-sig"
)

print("\nHOAN THANH CHIA KHOI KHONG GIAN")
print("Tong khoi hop le:", len(blocks))

print("\nSO KHOI MOI TAP:")
print(result["dataset"].value_counts())

print("\nPHAN BO NHOM NGUY CO:")
print(
    pd.crosstab(
        result["dataset"],
        result["risk_group"]
    )
)

print("\nDA LUU:", output_file)
print("HOAN THANH BUOC 25")
