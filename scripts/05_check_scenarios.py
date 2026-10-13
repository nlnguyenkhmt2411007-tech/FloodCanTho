
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

# Sai so so sanh 1 mm de tranh nhieu do lam tron
tolerance = 0.001

previous = None
previous_name = None
valid_mask = None

for filename in files:
    with rasterio.open(RAW_DIR / filename) as src:
        band = src.read(1, masked=True)

        current_mask = ~np.ma.getmaskarray(band)
        current = band.filled(np.nan)

        if previous is None:
            valid_mask = current_mask & np.isfinite(current)
        else:
            common_valid = (
                valid_mask
                & current_mask
                & np.isfinite(current)
                & np.isfinite(previous)
            )

            diff = current[common_valid] - previous[common_valid]

            decrease_count = int(np.count_nonzero(diff < -tolerance))
            increase_count = int(np.count_nonzero(diff > tolerance))
            stable_count = int(
                np.count_nonzero(np.abs(diff) <= tolerance)
            )

            total = len(diff)

            print(f"\n{previous_name} -> {filename}")
            print(f"So o duoc so sanh: {total:,}")
            print(f"So o tang: {increase_count:,}")
            print(f"So o gan nhu khong doi: {stable_count:,}")
            print(f"So o giam hon 1 mm: {decrease_count:,}")

            if total > 0:
                print(
                    f"Ty le o giam: "
                    f"{decrease_count / total * 100:.4f}%"
                )

            valid_mask = common_valid

        previous = current
        previous_name = filename

print("\nHOAN THANH KIEM TRA CAC KICH BAN MUA")
