
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

# Nguong khao sat, chua phai nguong canh bao chinh thuc
thresholds = [0.05, 0.10, 0.20, 0.30, 0.50]

results = []

for filename in files:
    path = RAW_DIR / filename

    with rasterio.open(path) as src:
        band = src.read(1, masked=True)
        values = band.compressed()
        values = values[np.isfinite(values)]

        if len(values) == 0:
            continue

        row = {
            "file": filename,
            "valid_pixels": len(values),
            "min_depth_m": float(values.min()),
            "median_depth_m": float(np.median(values)),
            "max_depth_m": float(values.max()),
        }

        for threshold in thresholds:
            count = int(np.count_nonzero(values >= threshold))
            percent = count / len(values) * 100

            name = f"ge_{threshold:.2f}m_pct"
            row[name] = round(percent, 4)

        results.append(row)
        print(f"Da phan tich: {filename}")

df = pd.DataFrame(results)

output_file = OUTPUT_DIR / "depth_distribution.csv"
df.to_csv(output_file, index=False, encoding="utf-8-sig")

print("\nHOAN THANH PHAN TICH DO SAU NGAP")
print(df.to_string(index=False))
print(f"\nDa luu: {output_file}")
