
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "processed"

files = {
    "TRAIN V2": DATA_DIR / "train_dataset_v2.csv",
    "VALIDATION V2": DATA_DIR / "validation_dataset_v2.csv",
    "TEST V2": DATA_DIR / "test_dataset_v2.csv",
    "BLOCK SPLIT": DATA_DIR / "spatial_block_split.csv",
}

print("\nKIEM TRA DU LIEU CHO MO HINH V3")

for name, path in files.items():
    print("\n" + "=" * 55)
    print(name)
    print("File:", path.name)

    if not path.exists():
        print("LOI: Khong tim thay file")
        continue

    df = pd.read_csv(path)

    print("So dong:", len(df))
    print("Danh sach cot:")
    print(list(df.columns))

    print("5 dong dau:")
    print(df.head(5).to_string(index=False))

    print("Gia tri thieu:")
    print(df.isna().sum().to_string())

print("\nHOAN THANH BUOC 38")
