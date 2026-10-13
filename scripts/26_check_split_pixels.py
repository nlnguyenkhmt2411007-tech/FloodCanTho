
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio

ROOT = Path(__file__).resolve().parents[1]

RASTER_FILE = ROOT / "data" / "raw" / "100years.tif"
SPLIT_FILE = ROOT / "data" / "processed" / "spatial_block_split.csv"

BLOCK_SIZE = 200

blocks = pd.read_csv(SPLIT_FILE)

with rasterio.open(RASTER_FILE) as src:
    depth = src.read(1, masked=True)

    valid = (
        ~np.ma.getmaskarray(depth)
        & np.isfinite(depth.data)
    )

    height, width = depth.shape

records = []

for item in blocks.itertuples(index=False):

    row_start = int(item.block_row) * BLOCK_SIZE
    col_start = int(item.block_col) * BLOCK_SIZE

    row_end = min(row_start + BLOCK_SIZE, height)
    col_end = min(col_start + BLOCK_SIZE, width)

    block_valid = valid[
        row_start:row_end,
        col_start:col_end
    ]

    values = depth.data[
        row_start:row_end,
        col_start:col_end
    ][block_valid]

    records.append({
        "dataset": item.dataset,
        "A": int((values < 0.05).sum()),
        "B": int((
            (values >= 0.05) &
            (values < 0.30)
        ).sum()),
        "C": int((
            (values >= 0.30) &
            (values < 1.00)
        ).sum()),
        "D": int((values >= 1.00).sum()),
        "total": len(values),
    })

result = pd.DataFrame(records)

summary = result.groupby("dataset")[
    ["A", "B", "C", "D", "total"]
].sum()

summary = summary.reindex([
    "train", "validation", "test"
])

print("\nPHAN BO PIXEL THEO TAP DU LIEU")
print(summary.to_string())

print("\nTONG CONG TOAN BO:")
print(summary.sum().to_string())

print("\nTY LE PIXEL NGAP TU 0.30M:")
for dataset, row in summary.iterrows():
    risk_pixels = int(row["C"] + row["D"])
    total_pixels = int(row["total"])

    ratio = risk_pixels / total_pixels * 100

    print(
        f"{dataset}: {risk_pixels:,} pixel "
        f"({ratio:.4f}%)"
    )

assert int(summary["total"].sum()) == 5_492_483
assert int(summary["D"].sum()) == 5_387

print("\nKIEM TRA TONG SO PIXEL: DAT")
print("HOAN THANH BUOC 26")
