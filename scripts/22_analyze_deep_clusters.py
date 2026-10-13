
from pathlib import Path

import numpy as np
import rasterio
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[1]
RASTER_FILE = ROOT / "data" / "raw" / "100years.tif"

with rasterio.open(RASTER_FILE) as src:
    depth = src.read(1, masked=True)

    valid = (
        ~np.ma.getmaskarray(depth)
        & np.isfinite(depth.data)
    )

    deep_mask = valid & (depth.data >= 1.00)

# Lien thong 8 huong: tinh ca cac pixel cheo nhau
structure = np.ones((3, 3), dtype=np.uint8)

cluster_map, cluster_count = label(
    deep_mask,
    structure=structure
)

# Dem kich thuoc tung cum, bo qua nhan 0
sizes = np.bincount(cluster_map.ravel())[1:]
sizes_sorted = np.sort(sizes)[::-1]

print("\nPHAN TICH CUM NGAP TREN 1M")
print("Tong pixel ngap sau:", int(deep_mask.sum()))
print("So cum lien thong:", cluster_count)

print("\n10 CUM LON NHAT:")
for i, size in enumerate(sizes_sorted[:10], start=1):
    print(f"Cum {i}: {int(size):,} pixel")

print("\nSO CUM THEO KICH THUOC:")
print("Cum 1 pixel:", int((sizes == 1).sum()))
print("Cum 2-9 pixel:", int(
    ((sizes >= 2) & (sizes < 10)).sum()
))
print("Cum 10-99 pixel:", int(
    ((sizes >= 10) & (sizes < 100)).sum()
))
print("Cum tu 100 pixel:", int(
    (sizes >= 100).sum()
))

print("\nHOAN THANH BUOC 22")
