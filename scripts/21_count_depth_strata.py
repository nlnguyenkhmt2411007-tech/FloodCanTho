
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"

periods = [2, 5, 10, 20, 50, 100]

max_depth = None
valid_mask = None

for period in periods:
    file_path = RAW_DIR / f"{period}years.tif"

    with rasterio.open(file_path) as src:
        data = src.read(1, masked=True)

        current_mask = ~np.ma.getmaskarray(data)
        current_mask &= np.isfinite(data.data)

        if max_depth is None:
            max_depth = np.full(
                data.shape,
                -np.inf,
                dtype=np.float32
            )
            valid_mask = current_mask.copy()
        else:
            valid_mask &= current_mask

        np.maximum(
            max_depth,
            data.filled(-np.inf),
            out=max_depth
        )

valid_depth = max_depth[valid_mask]

groups = {
    "A: duoi 0.05m": valid_depth < 0.05,
    "B: 0.05-0.30m": (
        (valid_depth >= 0.05)
        & (valid_depth < 0.30)
    ),
    "C: 0.30-1.00m": (
        (valid_depth >= 0.30)
        & (valid_depth < 1.00)
    ),
    "D: tu 1.00m": valid_depth >= 1.00,
}

total = len(valid_depth)

print("\nPHAN BO VI TRI THEO DO SAU LON NHAT")
print("Tong vi tri hop le:", f"{total:,}")

for name, mask in groups.items():
    count = int(mask.sum())
    percentage = count / total * 100

    print(
        f"{name}: {count:,} vi tri "
        f"({percentage:.4f}%)"
    )

print("\nTong 4 nhom:", sum(
    int(mask.sum()) for mask in groups.values()
))

print("HOAN THANH BUOC 21")
