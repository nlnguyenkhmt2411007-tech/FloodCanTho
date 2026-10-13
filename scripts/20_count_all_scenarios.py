
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
OUTPUT_DIR = ROOT / "data" / "processed"

scenarios = [2, 5, 10, 20, 50, 100]
results = []

for period in scenarios:
    raster_file = RAW_DIR / f"{period}years.tif"

    with rasterio.open(raster_file) as src:
        depth = src.read(1, masked=True)

        valid = depth.compressed()
        valid = valid[np.isfinite(valid)]

        total = len(valid)

        result = {
            "return_period_years": period,
            "valid_pixels": total,
            "pixels_ge_030m": int(
                np.sum(valid >= 0.30)
            ),
            "pixels_ge_050m": int(
                np.sum(valid >= 0.50)
            ),
            "pixels_ge_100m": int(
                np.sum(valid >= 1.00)
            ),
            "max_depth_m": round(
                float(valid.max()), 4
            ),
        }

        result["ratio_ge_030_pct"] = round(
            result["pixels_ge_030m"] / total * 100, 4
        )

        result["ratio_ge_100_pct"] = round(
            result["pixels_ge_100m"] / total * 100, 4
        )

        results.append(result)

df = pd.DataFrame(results)

print("\nPHAN BO NGAP THEO 6 KICH BAN:")
print(df.to_string(index=False))

output_file = (
    OUTPUT_DIR / "all_scenarios_depth_counts.csv"
)

df.to_csv(
    output_file,
    index=False,
    encoding="utf-8-sig"
)

print("\nDa luu:", output_file)
print("HOAN THANH BUOC 20")
