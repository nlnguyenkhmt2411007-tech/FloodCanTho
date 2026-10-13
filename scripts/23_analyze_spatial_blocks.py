
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parents[1]
RASTER_FILE = ROOT / "data" / "raw" / "100years.tif"

BLOCK_SIZE = 200

with rasterio.open(RASTER_FILE) as src:
    depth = src.read(1, masked=True)

    valid = (
        ~np.ma.getmaskarray(depth)
        & np.isfinite(depth.data)
    )

    deep_mask = valid & (depth.data >= 1.0)

    rows, cols = np.where(deep_mask)

    block_rows = rows // BLOCK_SIZE
    block_cols = cols // BLOCK_SIZE

    block_ids = np.column_stack([
        block_rows,
        block_cols
    ])

    unique_blocks, counts = np.unique(
        block_ids,
        axis=0,
        return_counts=True
    )

    order = np.argsort(counts)[::-1]

    print("\nPHAN BO NGAP TREN 1M THEO KHOI")
    print("Kich thuoc khoi:", BLOCK_SIZE, "x", BLOCK_SIZE)
    print("Tong pixel ngap tren 1m:", len(rows))
    print("So khoi co ngap tren 1m:", len(unique_blocks))

    print("\n10 KHOI CO NHIEU PIXEL NGAP SAU NHAT:")

    for i in order[:10]:
        br, bc = unique_blocks[i]

        print(
            f"Khoi ({br}, {bc}): "
            f"{counts[i]:,} pixel"
        )

    print("\nSO KHOI THEO SO PIXEL NGAP SAU:")
    print("1-9 pixel:", int(
        ((counts >= 1) & (counts < 10)).sum()
    ))
    print("10-99 pixel:", int(
        ((counts >= 10) & (counts < 100)).sum()
    ))
    print("Tu 100 pixel:", int(
        (counts >= 100).sum()
    ))

print("\nHOAN THANH BUOC 23")
