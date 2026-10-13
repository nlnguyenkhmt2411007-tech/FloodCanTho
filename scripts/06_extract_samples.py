
from pathlib import Path
import numpy as np
import pandas as pd
import rasterio

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
OUT_DIR = ROOT / "data" / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SCENARIOS = {
    2: "2years.tif",
    5: "5years.tif",
    10: "10years.tif",
    20: "20years.tif",
    50: "50years.tif",
    100: "100years.tif",
}

SAMPLE_SIZE = 10000
SEED = 42

# Doc raster tham chieu va lay vi tri o hop le
with rasterio.open(RAW_DIR / "2years.tif") as src:
    mask = src.read_masks(1) > 0
    rows, cols = np.where(mask)

    rng = np.random.default_rng(SEED)
    n = min(SAMPLE_SIZE, len(rows))
    chosen = rng.choice(len(rows), size=n, replace=False)

    sample_rows = rows[chosen]
    sample_cols = cols[chosen]

    xs, ys = rasterio.transform.xy(
        src.transform,
        sample_rows,
        sample_cols,
        offset="center"
    )

    data = {
        "row": sample_rows,
        "col": sample_cols,
        "x_3857": np.asarray(xs),
        "y_3857": np.asarray(ys),
    }

# Lay do sau tai cung vi tri cho 6 kich ban
for period, filename in SCENARIOS.items():
    with rasterio.open(RAW_DIR / filename) as src:
        band = src.read(1, masked=True)

        depths = band[sample_rows, sample_cols]

        if np.any(np.ma.getmaskarray(depths)):
            raise ValueError(
                f"Phat hien NoData tai vi tri lay mau: {filename}"
            )

        data[f"depth_{period}y_m"] = np.asarray(
            depths, dtype=np.float32
        )

    print(f"Da trich xuat: {filename}")

df = pd.DataFrame(data)

output_file = OUT_DIR / "rainfall_scenario_samples.csv"
df.to_csv(output_file, index=False, encoding="utf-8-sig")

print("\nHOAN THANH TRICH XUAT DU LIEU MAU")
print(f"So vi tri lay mau: {len(df):,}")
print(f"So cot du lieu: {len(df.columns)}")
print(f"Da luu: {output_file}")
print("\n5 dong dau tien:")
print(df.head().to_string(index=False))
