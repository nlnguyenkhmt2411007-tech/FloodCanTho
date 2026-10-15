
from pathlib import Path
import math

import rasterio
from rasterio.warp import transform

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Router tim kiem dia chi Geoapify
from backend.routing import router as routing_router
from backend.route_flood import router as route_flood_router
from backend.ml_predict import router as ml_router


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "raw"

RETURN_PERIODS = [2, 5, 10, 20, 50, 100]

# Nguong canh bao thu nghiem, khong phai nguong chinh thuc.
DEPTH_THRESHOLD_M = 0.30

# Nguong hien thi diem ngap nhe tren ban do.
MIN_DISPLAY_DEPTH_M = 0.0


def get_raster_path(period: int) -> Path:
    original = DATA_DIR / f"{period}years.tif"
    compressed = DATA_DIR / f"{period}years_compressed.tif"

    if original.is_file():
        return original

    return compressed


app = FastAPI(
    title="FloodCanTho API",
    description=(
        "API tra cuu do sau ngap mo phong "
        "va tim kiem dia chi tai Can Tho"
    ),
    version="1.2.0",
)

# CORS phuc vu ung dung demo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Dang ky Geoapify router.
# Endpoint moi: GET /api/places/search?q=...
app.include_router(routing_router)
app.include_router(route_flood_router)
app.include_router(ml_router)


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
        "is_realtime_forecast": False,
    }


@app.get("/api/health")
def health():
    files = {
        str(period): get_raster_path(period).is_file()
        for period in RETURN_PERIODS
    }

    return {
        "status": (
            "ready"
            if all(files.values())
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

    if not raster_path.is_file():
        raise HTTPException(
            status_code=500,
            detail=f"Khong tim thay {raster_path.name}",
        )

    with rasterio.open(raster_path) as src:
        # Chuyen toa do WGS84 sang CRS cua raster.
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
                "depth_m": None,
                "flood_risk": None,
                "message": "Vi tri nam ngoai pham vi raster",
            }

        # Lay mau pixel, giu nguyen xu ly NoData.
        sample = next(
            src.sample(
                [(x, y)],
                masked=True,
            )
        )

        value = sample[0]

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

        if (
            not math.isfinite(depth)
            or not (-1000 < depth < 10000)
        ):
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


@app.get("/api/flood-points")
def get_flood_points(
    period: int = Query(default=100),
    step: int = Query(default=35, ge=20, le=150),
):
    """
    Lay cac diem ngap dai dien tu raster mo phong.

    - step: khoang cach lay mau theo pixel.
    - Bo qua pixel NoData.
    - Chi lay diem co do sau >= 0.05 m.
    - Khong phai diem quan trac thuc te.
    - Khong phai du bao ngap theo thoi gian thuc.
    """

    if period not in RETURN_PERIODS:
        raise HTTPException(
            status_code=400,
            detail="Chu ky lap lai khong hop le",
        )

    raster_path = get_raster_path(period)

    if not raster_path.is_file():
        raise HTTPException(
            status_code=500,
            detail=f"Khong tim thay {raster_path.name}",
        )

    points = []

    with rasterio.open(raster_path) as src:
        # Doc du lieu theo tung diem, khong tai toan bo raster.
        # Phu hop hon voi bo nho gioi han cua Render Free.
        for row in range(0, src.height, step):
            for col in range(0, src.width, step):

                x, y = src.xy(row, col)

                sample = next(
                    src.sample(
                        [(x, y)],
                        masked=True,
                    )
                )

                value = sample[0]

                # Khong hien thi cac pixel khong co du lieu.
                if bool(getattr(value, "mask", False)):
                    continue

                depth = float(value)

                if not math.isfinite(depth):
                    continue

                if not (
                    MIN_DISPLAY_DEPTH_M <= depth < 10000
                ):
                    continue

                lon, lat = transform(
                    src.crs,
                    "EPSG:4326",
                    [x],
                    [y],
                )

                points.append(
                    {
                        "latitude": round(lat[0], 6),
                        "longitude": round(lon[0], 6),
                        "depth_m": round(depth, 4),
                        "level": (
                            "high"
                            if depth >= DEPTH_THRESHOLD_M
                            else "low"
                        ),
                    }
                )
        # Gioi han toi da 150 diem de ban do de quan sat hon.
    # Chon deu tren danh sach, khong chi lay 150 diem dau.
    MAX_DISPLAY_POINTS = 150

    if len(points) > MAX_DISPLAY_POINTS:
        original_points = points
        points = [
            original_points[
                i * (len(original_points) - 1) // (MAX_DISPLAY_POINTS - 1)
            ]
            for i in range(MAX_DISPLAY_POINTS)
        ]
    return {
        
        "status": "success",
        "return_period_years": period,
        "sample_step_pixels": step,
        "minimum_display_depth_m": MIN_DISPLAY_DEPTH_M,
        "depth_threshold_m": DEPTH_THRESHOLD_M,
        "total_points": len(points),
        "data_source": "simulated_raster",
        "is_realtime_forecast": False,
        "message": (
            "Cac diem dai dien duoc lay mau tu raster mo phong. "
            "Khong phai vi tri quan trac ngap thuc te."
        ),
        "points": points,
    }
