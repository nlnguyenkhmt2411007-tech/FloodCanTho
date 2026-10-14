
import json
import math
import os

from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException, Query


router = APIRouter(prefix="/api", tags=["Routing"])

GEOAPIFY_SEARCH_URL = (
    "https://api.geoapify.com/v1/geocode/search"
)

GEOAPIFY_ROUTING_URL = (
    "https://api.geoapify.com/v1/routing"
)


def get_geoapify_api_key() -> str:
    api_key = os.environ.get(
        "GEOAPIFY_API_KEY", ""
    ).strip()

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Geoapify API key chua duoc cau hinh",
        )

    return api_key


def request_geoapify(url: str, service_name: str) -> dict:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "FloodCanTho/1.0",
        },
    )

    try:
        with urlopen(request, timeout=20) as response:
            return json.load(response)

    except HTTPError as error:
        # Khong tra URL hoac API key ra frontend.
        raise HTTPException(
            status_code=502,
            detail=(
                f"Dich vu {service_name} "
                f"tra ve loi HTTP {error.code}"
            ),
        ) from None

    except (URLError, TimeoutError):
        raise HTTPException(
            status_code=502,
            detail=(
                f"Khong ket noi duoc "
                f"dich vu {service_name}"
            ),
        ) from None

    except (ValueError, UnicodeDecodeError):
        raise HTTPException(
            status_code=502,
            detail=(
                f"Du lieu tu dich vu "
                f"{service_name} khong hop le"
            ),
        ) from None


@router.get("/places/search")
def search_places(
    q: str = Query(min_length=2, max_length=150),
):
    api_key = get_geoapify_api_key()

    params = urlencode(
        {
            "text": q,
            "filter": "countrycode:vn",
            "bias": "proximity:105.75,10.045",
            "limit": 5,
            "format": "json",
            "apiKey": api_key,
        }
    )

    data = request_geoapify(
        f"{GEOAPIFY_SEARCH_URL}?{params}",
        "tim dia chi",
    )

    places = []

    for item in data.get("results", []):
        lat = item.get("lat")
        lon = item.get("lon")

        if not isinstance(lat, (int, float)):
            continue

        if not isinstance(lon, (int, float)):
            continue

        if not math.isfinite(lat) or not math.isfinite(lon):
            continue

        places.append(
            {
                "name": item.get("formatted", ""),
                "latitude": lat,
                "longitude": lon,
            }
        )

    return {
        "status": "success",
        "query": q,
        "places": places,
        "total": len(places),
    }


@router.get("/route")
def get_route(
    start_lat: float = Query(ge=-90, le=90),
    start_lon: float = Query(ge=-180, le=180),
    end_lat: float = Query(ge=-90, le=90),
    end_lon: float = Query(ge=-180, le=180),
    mode: str = Query(default="drive"),
):
    """
    Lay tuyen duong thuc tu Geoapify.

    mode:
      - drive: o to
      - walk: di bo

    Luu y:
      - Tuyen duong chua xet muc do ngap.
      - Khong phai chi dan an toan trong mua lu.
    """

    if mode not in ("drive", "walk"):
        raise HTTPException(
            status_code=400,
            detail="Che do di chuyen khong hop le",
        )

    coordinates = (
        start_lat,
        start_lon,
        end_lat,
        end_lon,
    )

    if not all(math.isfinite(v) for v in coordinates):
        raise HTTPException(
            status_code=400,
            detail="Toa do khong hop le",
        )

    if (
        start_lat == end_lat
        and start_lon == end_lon
    ):
        raise HTTPException(
            status_code=400,
            detail="Diem di va diem den phai khac nhau",
        )

    api_key = get_geoapify_api_key()

    travel_mode = (
        "drive"
        if mode == "drive"
        else "walk"
    )

    params = urlencode(
        {
            "waypoints": (
                f"{start_lat},{start_lon}"
                f"|{end_lat},{end_lon}"
            ),
            "mode": travel_mode,
            "apiKey": api_key,
        }
    )

    data = request_geoapify(
        f"{GEOAPIFY_ROUTING_URL}?{params}",
        "tim tuyen duong",
    )

    features = data.get("features", [])

    if not features:
        raise HTTPException(
            status_code=404,
            detail="Khong tim thay tuyen duong phu hop",
        )

    feature = features[0]

    properties = feature.get("properties", {})
    geometry = feature.get("geometry", {})

    if not isinstance(properties, dict):
        raise HTTPException(
            status_code=502,
            detail="Thong tin tuyen duong khong hop le",
        )

    if not isinstance(geometry, dict):
        raise HTTPException(
            status_code=502,
            detail="Hinh hoc tuyen duong khong hop le",
        )

    # Geoapify tra ve GeoJSON.
    # GeoJSON su dung thu tu [longitude, latitude].
    geometry_type = geometry.get("type")

    if geometry_type not in (
        "LineString",
        "MultiLineString",
    ):
        raise HTTPException(
            status_code=502,
            detail="Dinh dang tuyen duong khong duoc ho tro",
        )

    coordinates_geojson = geometry.get("coordinates")

    if not isinstance(coordinates_geojson, list):
        raise HTTPException(
            status_code=502,
            detail="Tuyen duong khong co toa do hop le",
        )

    distance_m = properties.get("distance")
    time_s = properties.get("time")

    if not isinstance(distance_m, (int, float)):
        distance_m = None

    if not isinstance(time_s, (int, float)):
        time_s = None

    return {
        "status": "success",
        "mode": mode,
        "start": {
            "latitude": start_lat,
            "longitude": start_lon,
        },
        "end": {
            "latitude": end_lat,
            "longitude": end_lon,
        },
        "distance_m": (
            round(distance_m, 1)
            if distance_m is not None
            else None
        ),
        "distance_km": (
            round(distance_m / 1000, 2)
            if distance_m is not None
            else None
        ),
        "duration_minutes": (
            round(time_s / 60, 1)
            if time_s is not None
            else None
        ),
        "geometry": {
            "type": geometry_type,
            "coordinates": coordinates_geojson,
        },
        "route_source": "geoapify",
        "flood_analysis_available": False,
        "is_flood_safe_route": None,
        "message": (
            "Tuyen duong giao thong tu Geoapify. "
            "Chua danh gia muc do ngap tren tuyen."
        ),
    }
