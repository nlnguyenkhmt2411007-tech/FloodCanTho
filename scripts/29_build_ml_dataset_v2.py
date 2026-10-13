
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
OUTPUT_DIR = ROOT / "data" / "processed"

PERIODS = [2, 5, 10, 20, 50, 100]

DATASETS = {
    "train": "train_locations_v2.csv",
    "validation": "validation_locations_v2.csv",
    "test": "test_locations_v2.csv",
}

# Kiem tra khong trung vi tri giua ba tap
location_tables = {}

for dataset, filename in DATASETS.items():
    table = pd.read_csv(OUTPUT_DIR / filename)
    table["dataset"] = dataset
    location_tables[dataset] = table

all_locations = pd.concat(
    location_tables.values(),
    ignore_index=True
)

assert not all_locations.duplicated(
    ["row", "col"]
).any(), "Co vi tri trung giua cac tap!"

# Doc sau raster, lay do sau tai cac vi tri da chon
records = {
    dataset: [] for dataset in DATASETS
}

for period in PERIODS:
    raster_file = RAW_DIR / f"{period}years.tif"

    with rasterio.open(raster_file) as src:
        data = src.read(1, masked=True)

        for dataset, locations in location_tables.items():
            rows = locations["row"].to_numpy(dtype=int)
            cols = locations["col"].to_numpy(dtype=int)

            depths = data[rows, cols]

            if np.ma.getmaskarray(depths).any():
                raise ValueError(
                    f"Co pixel khong hop le: "
                    f"{dataset}, kich ban {period}"
                )

            xs, ys = rasterio.transform.xy(
                src.transform,
                rows,
                cols,
                offset="center"
            )

            frame = pd.DataFrame({
                "row": rows,
                "col": cols,
                "x_3857": np.asarray(xs),
                "y_3857": np.asarray(ys),
                "return_period_years": period,
                "depth_m": np.asarray(depths),
            })

            records[dataset].append(frame)

# Luu ba bo du lieu
print("\nKET QUA TAO ML DATASET V2")

for dataset, frames in records.items():
    result = pd.concat(
        frames,
        ignore_index=True
    )

    output_file = (
        OUTPUT_DIR / f"{dataset}_dataset_v2.csv"
    )

    result.to_csv(
        output_file,
        index=False,
        encoding="utf-8-sig"
    )

    print(f"\n{dataset.upper()}")
    print("So dong:", len(result))
    print("So vi tri:", result[
        ["row", "col"]
    ].drop_duplicates().shape[0])

    print("So kich ban:",
          result["return_period_years"].nunique())

    print("So dong ngap >= 0.30m:",
          int((result["depth_m"] >= 0.30).sum()))

    print("Da luu:", output_file)

print("\nHOAN THANH BUOC 29")
