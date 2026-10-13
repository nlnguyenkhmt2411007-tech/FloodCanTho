
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio

ROOT = Path(__file__).resolve().parents[1]

RASTER_FILE = ROOT / "data" / "raw" / "100years.tif"
SPLIT_FILE = ROOT / "data" / "processed" / "spatial_block_split.csv"
OUTPUT_DIR = ROOT / "data" / "processed"

BLOCK_SIZE = 200
SAMPLE_SIZE = 10000

blocks = pd.read_csv(SPLIT_FILE)

with rasterio.open(RASTER_FILE) as src:
    depth = src.read(1, masked=True)

    valid = (
        ~np.ma.getmaskarray(depth)
        & np.isfinite(depth.data)
    )

    height, width = depth.shape


def sample_dataset(dataset_name, random_seed):

    selected_blocks = blocks[
        blocks["dataset"] == dataset_name
    ]

    spatial_mask = np.zeros(
        (height, width),
        dtype=bool
    )

    for item in selected_blocks.itertuples(index=False):

        r0 = int(item.block_row) * BLOCK_SIZE
        c0 = int(item.block_col) * BLOCK_SIZE

        r1 = min(r0 + BLOCK_SIZE, height)
        c1 = min(c0 + BLOCK_SIZE, width)

        spatial_mask[r0:r1, c0:c1] = True

    eligible = valid & spatial_mask

    rows, cols = np.where(eligible)

    rng = np.random.default_rng(random_seed)

    selected = rng.choice(
        len(rows),
        size=SAMPLE_SIZE,
        replace=False
    )

    sample_rows = rows[selected]
    sample_cols = cols[selected]

    sample_depth = depth.data[
        sample_rows,
        sample_cols
    ]

    groups = np.select(
        [
            sample_depth < 0.05,
            sample_depth < 0.30,
            sample_depth < 1.00
        ],
        ["A", "B", "C"],
        default="D"
    )

    result = pd.DataFrame({
        "row": sample_rows,
        "col": sample_cols,
        "depth_group": groups
    })

    assert len(result) == SAMPLE_SIZE
    assert not result.duplicated(
        ["row", "col"]
    ).any()

    output_file = (
        OUTPUT_DIR /
        f"{dataset_name}_locations_v2.csv"
    )

    result.to_csv(
        output_file,
        index=False,
        encoding="utf-8-sig"
    )

    print(f"\n{dataset_name.upper()}")
    print("Tong vi tri:", len(result))

    print("\nSo vi tri theo nhom:")
    print(
        result["depth_group"]
        .value_counts()
        .reindex(["A", "B", "C", "D"], fill_value=0)
    )

    print("\nSo vi tri ngap tu 0.30m:",
          int((sample_depth >= 0.30).sum()))

    print("Da luu:", output_file)


print("\nKET QUA LAY MAU VALIDATION VA TEST V2")

sample_dataset(
    dataset_name="validation",
    random_seed=123
)

sample_dataset(
    dataset_name="test",
    random_seed=456
)

print("\nHOAN THANH BUOC 28")
