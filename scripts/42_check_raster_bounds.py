
from pathlib import Path
import rasterio
from rasterio.warp import transform_bounds

ROOT = Path(__file__).resolve().parents[1]

RASTER_FILE = (
    ROOT / "data" / "raw" / "100years.tif"
)

print("\nKIEM TRA PHAM VI BAN DO NGAP")

with rasterio.open(RASTER_FILE) as src:

    print("File:", RASTER_FILE.name)
    print("CRS:", src.crs)
    print("Chieu rong:", src.width)
    print("Chieu cao:", src.height)

    bounds = transform_bounds(
        src.crs,
        "EPSG:4326",
        *src.bounds
    )

    west, south, east, north = bounds

    print("\nTOA DO BIEN WGS84:")
    print(f"West:  {west:.6f}")
    print(f"South: {south:.6f}")
    print(f"East:  {east:.6f}")
    print(f"North: {north:.6f}")

    print("\nBOUNDING BOX:")
    print(
        f"{west:.6f}, {south:.6f}, "
        f"{east:.6f}, {north:.6f}"
    )

print("\nHOAN THANH BUOC 42")
