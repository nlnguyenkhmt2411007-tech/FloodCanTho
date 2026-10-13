
from pathlib import Path
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

reference = None
all_aligned = True

for filename in files:
    path = RAW_DIR / filename

    with rasterio.open(path) as src:
        current = {
            "crs": src.crs,
            "width": src.width,
            "height": src.height,
            "transform": src.transform,
            "bounds": src.bounds,
        }

        print(f"\nFile: {filename}")
        print("CRS:", src.crs)
        print("Kich thuoc:", src.width, "x", src.height)
        print("Bounds:", src.bounds)
        print("Transform:", src.transform)

        if reference is None:
            reference = current
            print("=> Raster tham chieu")
        else:
            aligned = current == reference

            if aligned:
                print("=> KHOP VOI RASTER THAM CHIEU")
            else:
                print("=> KHONG KHOP")
                all_aligned = False

print("\nKET LUAN:")
if all_aligned:
    print("6 RASTER MUA CO CUNG LUOI KHONG GIAN")
else:
    print("CAN KIEM TRA VA CHUAN HOA LUOI KHONG GIAN")
