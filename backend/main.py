
from pathlib import Path

import rasterio
from rasterio.warp import transform
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "raw"

RETURN_PERIODS = [2, 5, 10, 20, 50, 100]
DEPTH_THRESHOLD_M = 0.30
def get_raster_path(period: int) -> Path:
    original = DATA_DIR / f"{period}years.tif"
    compressed = DATA_DIR / f"{period}years_compressed.tif"

    if original.is_file():
        return original

    return compressed

app = FastAPI(
    title="FloodCanTho API",
    description="API tra cứu độ sâu ngập mô phỏng",
    version="1.0.0",
)

# CORS phục vụ phát triển thử nghiệm.
# Khi triển khai công khai cần giới hạn origin cụ thể.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class FloodRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    return_period_years: int


@app.get("/")
def home():
    return {
        "project": "FloodCanTho",
        "status": "running",
        "data_type": "simulated_inundation_depth",
        "return_periods": RETURN_PERIODS,
    }


@app.get("/api/health")
@app.get("/api/health")
def health():
    files = {
        str(period): get_raster_path(period).is_file()
        for period in RETURN_PERIODS
    }

    return {
        "status": (
            "ready" if all(files.values())
            else "missing_raster_files"
        ),
        "raster_files": files,
    }


@app.post("/api/predict")
def predict(request: FloodRequest):

    period = request.return_period_years

    if period not in RETURN_PERIODS:
        raise HTTPException(
            status_code=400,
            detail="Chu ky lap lai khong hop le",
        )

    raster_path = get_raster_path(period)

    if not raster_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Khong tim thay {raster_path.name}",
        )

    with rasterio.open(raster_path) as src:

        # Chuyen kinh do, vi do WGS84
        # sang he toa do cua raster.
        xs, ys = transform(
            "EPSG:4326",
            src.crs,
            [request.longitude],
            [request.latitude],
        )

        x = xs[0]
        y = ys[0]

        # Kiem tra pham vi raster.
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
                "depth_m": None,
                "flood_risk": None,
                "message": "Vi tri nam ngoai pham vi raster",
            }

        # Doc pixel tai toa do duoc chon.
        sample = next(
            src.sample(
                [(x, y)],
                masked=True
            )
        )

        value = sample[0]

        # Pixel NoData khong duoc xem la khong ngap.
        if bool(getattr(value, "mask", False)):
            return {
                "status": "no_data",
                "latitude": request.latitude,
                "longitude": request.longitude,
                "return_period_years": period,
                "depth_m": None,
                "flood_risk": None,
                "message": "Khong co du lieu tai vi tri nay",
            }

        depth = float(value)

        if not (-1000 < depth < 10000):
            raise HTTPException(
                status_code=500,
                detail="Gia tri raster bat thuong",
            )

        flood_risk = (
            "above_experimental_threshold"
            if depth >= DEPTH_THRESHOLD_M
            else "below_experimental_threshold"
        )

        return {
            "status": "success",
            "latitude": request.latitude,
            "longitude": request.longitude,
            "return_period_years": period,
            "depth_m": round(depth, 4),
            "flood_risk": flood_risk,
            "depth_threshold_m": DEPTH_THRESHOLD_M,
            "data_source": "simulated_raster",
            "is_realtime_forecast": False,
            "message": (
                "Do sau ngap mo phong theo kich ban, "
                "khong phai du bao thoi gian thuc"
            ),
        }
