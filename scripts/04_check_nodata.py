
from pathlib import Path
import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"

files = [
    "2years.tif",
    "5years.tif",
    "10years.tif",
    "20years.tif",
    "50years.tif",
    "100years.tif",
]

reference_mask = None
all_same = True

for filename in files:
    path = RAW_DIR / filename

    with rasterio.open(path) as src:
        # True = o co du lieu hop le
        mask = src.read_masks(1) > 0

        valid_count = int(np.count_nonzero(mask))
        nodata_count = int(mask.size - valid_count)

        print(f"\nFile: {filename}")
        print(f"So o hop le: {valid_count:,}")
        print(f"So o NoData: {nodata_count:,}")

        if reference_mask is None:
            reference_mask = mask.copy()
            print("=> Raster tham chieu")
        else:
            different = int(
                np.count_nonzero(mask != reference_mask)
            )

            print(f"So o khac mask tham chieu: {different:,}")

            if different != 0:
                all_same = False

print("\nKET LUAN:")

if all_same:
    print("6 RASTER CO CUNG MAT NA DU LIEU HOP LE")
else:
    print("MAT NA KHAC NHAU - CAN XU LY TRUOC KHI GHEP")
