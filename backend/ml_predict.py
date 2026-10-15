
from functools import lru_cache
from pathlib import Path
import math

import joblib
import pandas as pd
import rasterio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from rasterio.warp import transform

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "raw"

MODEL_FILE = (
    ROOT / "models" /
    "random_forest_classifier_v2.joblib"
)

RETURN_PERIODS = [2, 5, 10, 20, 50, 100]
DEPTH_THRESHOLD_M = 0.30
PROBABILITY_THRESHOLD = 0.50

FEATURES = [
    "x_3857",
    "y_3857",
    "return_period_years",
]

router = APIRouter()


class MLPredictRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    return_period_years: int


@lru_cache(maxsize=1)
def load_model():
    if not MODEL_FILE.is_file():
        raise FileNotFoundError(
            f"Khong tim thay mo hinh: {MODEL_FILE}"
        )

    return joblib.load(MODEL_FILE)


def get_raster_path(period: int) -> Path:
    original = DATA_DIR / f"{period}years.tif"
    compressed = DATA_DIR / f"{period}years_compressed.tif"

    if original.is_file():
        return original

    return compressed


@router.post("/api/ml-predict")
def ml_predict(request: MLPredictRequest):
    period = request.return_period_years

    if period not in RETURN_PERIODS:
        raise HTTPException(
            status_code=400,
            detail="Chu ky lap lai khong hop le",
        )

    raster_path = get_raster_path(period)

    if not raster_path.is_file():
        raise HTTPException(
            status_code=500,
            detail="Khong tim thay raster tham chieu",
        )

    # Chuyển GPS sang CRS của raster.
    with rasterio.open(raster_path) as src:
        xs, ys = transform(
            "EPSG:4326",
            src.crs,
            [request.longitude],
            [request.latitude],
        )

        x = xs[0]
        y = ys[0]

        bounds = src.bounds

        if not (
            bounds.left <= x < bounds.right
            and bounds.bottom < y <= bounds.top
        ):
            return {
                "status": "outside_coverage",
                "latitude": request.latitude,
                "longitude": request.longitude,
                "return_period_years": period,
                "ml_probability": None,
                "ml_prediction": None,
                "message": "Vi tri ngoai pham vi raster",
            }

        # Lấy vị trí pixel và tọa độ tâm pixel.
        row, col = src.index(x, y)

        if not (
            0 <= row < src.height
            and 0 <= col < src.width
        ):
            raise HTTPException(
                status_code=400,
                detail="Pixel ngoai pham vi",
            )

        # Mô hình v2 được huấn luyện với tọa độ
        # tâm pixel x_3857, y_3857.
        pixel_x, pixel_y = rasterio.transform.xy(
            src.transform,
            row,
            col,
            offset="center",
        )

        pixel_crs = src.crs

    if pixel_crs is None:
        raise HTTPException(
            status_code=500,
            detail="Raster khong co he toa do",
        )

    # Đưa tọa độ tâm pixel về EPSG:3857.
    if str(pixel_crs).upper() != "EPSG:3857":
        converted_x, converted_y = transform(
            pixel_crs,
            "EPSG:3857",
            [pixel_x],
            [pixel_y],
        )

        pixel_x = converted_x[0]
        pixel_y = converted_y[0]

    features = pd.DataFrame(
        [{
            "x_3857": float(pixel_x),
            "y_3857": float(pixel_y),
            "return_period_years": period,
        }],
        columns=FEATURES,
    )

    try:
        model = load_model()

        probability = float(
            model.predict_proba(features)[0, 1]
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Loi du doan ML: {error}",
        )

    if not math.isfinite(probability):
        raise HTTPException(
            status_code=500,
            detail="Xac suat ML khong hop le",
        )

    predicted_class = int(
        probability >= PROBABILITY_THRESHOLD
    )

    return {
        "status": "success",
        "latitude": request.latitude,
        "longitude": request.longitude,
        "return_period_years": period,
        "ml_model": "random_forest_classifier_v2",
        "ml_probability": round(probability, 6),
        "ml_prediction": predicted_class,
        "depth_threshold_m": DEPTH_THRESHOLD_M,
        "probability_threshold": PROBABILITY_THRESHOLD,
        "data_source": "machine_learning_from_simulated_raster",
        "is_realtime_forecast": False,
        "message": (
            "Ket qua ML uoc luong lop ngap "
            "tu du lieu mo phong, "
            "khong phai du bao thoi gian thuc"
        ),
    }
