
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parents[1]
RASTER_FILE = ROOT / "data" / "raw" / "100years.tif"

BLOCK_SIZE = 200
THRESHOLDS = [0.30, 0.50, 1.00]

with rasterio.open(RASTER_FILE) as src:
    depth = src.read(1, masked=True)

    valid = (
        ~np.ma.getmaskarray(depth)
        & np.isfinite(depth.data)
    )

    height, width = depth.shape

    total_block_rows = (
        height + BLOCK_SIZE - 1
    ) // BLOCK_SIZE

    total_block_cols = (
        width + BLOCK_SIZE - 1
    ) // BLOCK_SIZE

    print("\nTHONG KE KHOI KHONG GIAN")
    print("Kich thuoc raster:", height, "x", width)
    print("Kich thuoc khoi:", BLOCK_SIZE)
    print(
        "Tong so khoi tren luoi:",
        total_block_rows * total_block_cols
    )

    print("\nSO KHOI CO PIXEL NGAP THEO NGUONG:")

    for threshold in THRESHOLDS:
        risk_mask = (
            valid & (depth.data >= threshold)
        )

        rows, cols = np.where(risk_mask)

        block_ids = np.column_stack([
            rows // BLOCK_SIZE,
            cols // BLOCK_SIZE
        ])

        unique_blocks = np.unique(
            block_ids,
            axis=0
        )

        print(
            f"Do sau >= {threshold:.2f}m: "
            f"{len(unique_blocks)} khoi, "
            f"{len(rows):,} pixel"
        )

print("\nHOAN THANH BUOC 24")
