
from pathlib import Path
import rasterio
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
OUTPUT_DIR = ROOT / "data" / "processed"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

files = [
    "2years.tif",
    "5years.tif",
    "10years.tif",
    "20years.tif",
    "50years.tif",
    "100years.tif",
    "2011inundationMap.tif",
]

results = []

for filename in files:
    path = RAW_DIR / filename

    if not path.exists():
        print(f"Khong tim thay: {path}")
        continue

    print(f"\nDang kiem tra: {filename}")

    with rasterio.open(path) as src:
        band = src.read(1, masked=True)
        values = band.compressed()
        values = values[np.isfinite(values)]

        info = {
            "file": filename,
            "crs": str(src.crs),
            "width": src.width,
            "height": src.height,
            "resolution_x": src.res[0],
            "resolution_y": src.res[1],
            "nodata": src.nodata,
            "valid_pixels": len(values),
            "min_depth_m": float(values.min()) if len(values) else None,
            "max_depth_m": float(values.max()) if len(values) else None,
            "mean_depth_m": float(values.mean()) if len(values) else None,
            "median_depth_m": float(np.median(values)) if len(values) else None,
            "zero_pixels": int(np.count_nonzero(values == 0)),
            "positive_pixels": int(np.count_nonzero(values > 0)),
        }

        results.append(info)

        print(f"CRS: {info['crs']}")
        print(f"Kich thuoc: {src.width} x {src.height}")
        print(f"Do phan giai: {src.res}")
        print(f"NoData: {src.nodata}")
        print(f"So o hop le: {len(values):,}")
        print(f"Do sau lon nhat: {info['max_depth_m']} m")

df = pd.DataFrame(results)

output_file = OUTPUT_DIR / "raster_summary.csv"
df.to_csv(output_file, index=False, encoding="utf-8-sig")

print("\nHOAN THANH KIEM TRA 7 FILE GEOTIFF")
print(f"Da luu ket qua: {output_file}")
