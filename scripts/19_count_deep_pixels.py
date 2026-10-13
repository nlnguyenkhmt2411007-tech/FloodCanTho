
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parents[1]
RASTER_FILE = ROOT / "data" / "raw" / "100years.tif"

with rasterio.open(RASTER_FILE) as src:
    depth = src.read(1, masked=True)

    valid = depth.compressed()
    valid = valid[np.isfinite(valid)]

    print("RASTER:", RASTER_FILE.name)
    print("Kich thuoc:", src.height, "x", src.width)
    print("Tong pixel hop le:", len(valid))

    print("\nTHONG KE DO SAU:")
    for threshold in [0.30, 0.50, 1.00]:
        count = int(np.sum(valid >= threshold))
        ratio = count / len(valid) * 100

        print(
            f"Do sau >= {threshold:.2f}m: "
            f"{count:,} pixel ({ratio:.4f}%)"
        )

    print("\nDo sau lon nhat:", round(float(valid.max()), 4))

print("\nHOAN THANH BUOC 19")
