import math

import rasterio
from rasterio.warp import transform
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["Route Flood Analysis"])

PERIODS = (2, 5, 10, 20, 50, 100)
THRESHOLD_M = 0.30
SAMPLE_SPACING_M = 20.0
MAX_SAMPLES = 500


class RouteFloodRequest(BaseModel):
    return_period_years: int
    coordinates: list[list[float]] = Field(min_length=2, max_length=3000)


def distance_m(a, b):
    """Approximate distance between two WGS84 coordinates."""
    lon1, lat1 = a
    lon2, lat2 = b

    radius = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = phi2 - phi1
    dlambda = math.radians(lon2 - lon1)

    h = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2)
        * math.sin(dlambda / 2) ** 2
    )

    return 2 * radius * math.asin(min(1.0, math.sqrt(h)))


def sample_route(coordinates):
    """Sample points along the route, including both endpoints."""
    distances = [
        distance_m(a, b)
        for a, b in zip(coordinates[:-1], coordinates[1:])
    ]

    total_length = sum(distances)

    if total_length <= 0:
        raise HTTPException(400, detail="Tuyen duong khong hop le")

    sample_count = min(
        MAX_SAMPLES,
        max(2, math.ceil(total_length / SAMPLE_SPACING_M) + 1),
    )

    targets = [
        total_length * i / (sample_count - 1)
        for i in range(sample_count)
    ]

    points = []
    segment_index = 0
    accumulated = 0.0

    for target in targets:
        while (
            segment_index < len(distances) - 1
            and accumulated + distances[segment_index] < target
        ):
            accumulated += distances[segment_index]
            segment_index += 1

        segment_length = distances[segment_index]
        fraction = (
            (target - accumulated) / segment_length
            if segment_length > 0 else 0.0
        )
        fraction = max(0.0, min(1.0, fraction))

        a = coordinates[segment_index]
        b = coordinates[segment_index + 1]

        points.append((
            a[0] + (b[0] - a[0]) * fraction,
            a[1] + (b[1] - a[1]) * fraction,
        ))

    return points, total_length


@router.post("/route-flood-analysis")
def analyze_route_flood(request: RouteFloodRequest):
    from backend.main import get_raster_path

    period = request.return_period_years

    if period not in PERIODS:
        raise HTTPException(400, detail="Chu ky lap lai khong hop le")

    coordinates = request.coordinates

    for point in coordinates:
        if (
            len(point) != 2
            or not all(math.isfinite(v) for v in point)
            or not (-180 <= point[0] <= 180)
            or not (-90 <= point[1] <= 90)
        ):
            raise HTTPException(400, detail="Toa do khong hop le")

    points, total_length = sample_route(coordinates)
    raster_path = get_raster_path(period)

    if not raster_path.is_file():
        raise HTTPException(500, detail="Khong tim thay raster")

    valid_depths = []
    above_threshold = 0
    outside_count = 0
    nodata_count = 0

    with rasterio.open(raster_path) as src:
        lons = [point[0] for point in points]
        lats = [point[1] for point in points]

        xs, ys = transform(
            "EPSG:4326", src.crs, lons, lats
        )

        inside_positions = []

        for x, y in zip(xs, ys):
            if (
                src.bounds.left <= x < src.bounds.right
                and src.bounds.bottom < y <= src.bounds.top
            ):
                inside_positions.append((x, y))
            else:
                outside_count += 1

        for sample in src.sample(inside_positions, masked=True):
            value = sample[0]

            if bool(getattr(value, "mask", False)):
                nodata_count += 1
                continue

            depth = float(value)

            if not math.isfinite(depth) or depth < 0:
                nodata_count += 1
                continue

            valid_depths.append(depth)

            if depth >= THRESHOLD_M:
                above_threshold += 1

    total_samples = len(points)
    valid_count = len(valid_depths)

    return {
        "status": "success",
        "return_period_years": period,
        "route_length_km": round(total_length / 1000, 3),
        "total_samples": total_samples,
        "valid_samples": valid_count,
        "outside_raster_samples": outside_count,
        "nodata_samples": nodata_count,
        "coverage_percent": round(
            valid_count / total_samples * 100, 1
        ),
        "max_depth_m": (
            round(max(valid_depths), 4)
            if valid_depths else None
        ),
        "above_threshold_samples": above_threshold,
        "depth_threshold_m": THRESHOLD_M,
        "sample_spacing_m_approx": round(
            total_length / (total_samples - 1), 1
        ),
        "data_source": "simulated_raster",
        "is_realtime_forecast": False,
        "is_route_safe": None,
        "message": (
            "Phan tich ngap mo phong doc tuyen duong. "
            "Khong phai du bao thoi gian thuc va "
            "khong xac nhan tuyen duong an toan."
        ),
    }
