
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  Coordinates,
  ReturnPeriod,
  FloodRiskLevel,
} from '../types/flood';

import { isCoordinateInBounds } from '../data/landmarks';
import { getApiBaseUrl } from '../services/floodApi';

import {
  Maximize2,
  Crosshair,
  AlertTriangle,
  RefreshCw,
  Layers,
  MapPin,
} from 'lucide-react';

const STUDY_BOUNDS_COORDS = {
  south: 10.032220,
  west: 105.737369,
  north: 10.060782,
  east: 105.763636,
};

const INITIAL_CENTER: [number, number] = [
  10.0465,
  105.7505,
];

const INITIAL_ZOOM = 14;

const FLOOD_SAMPLE_STEP = 100;

type TileProviderId =
  | 'osm-official'
  | 'osm-carto'
  | 'osm-fr';

interface TileProvider {
  id: TileProviderId;
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
}

const TILE_PROVIDERS: TileProvider[] = [
  {
    id: 'osm-official',
    name: 'OpenStreetMap chính thức',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  },
  {
    id: 'osm-carto',
    name: 'OSM Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, &copy; CARTO',
    subdomains: ['a', 'b', 'c', 'd'],
  },
  {
    id: 'osm-fr',
    name: 'OpenStreetMap France',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | OpenStreetMap France',
    subdomains: ['a', 'b', 'c'],
  },
];

interface FloodPoint {
  latitude: number;
  longitude: number;
  depth_m: number;
  level: 'high' | 'low';
}

interface FloodPointsResponse {
  status: string;
  return_period_years: number;
  total_points: number;
  data_source: string;
  points: FloodPoint[];
}


interface RouteMapData {
  geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: number[][] | number[][][];
  };
  start: {
    latitude: number;
    longitude: number;
  };
  end: {
    latitude: number;
    longitude: number;
  };
}

interface MapViewProps {
  routeData?: RouteMapData | null;
  selectedCoordinates: Coordinates;
  onSelectCoordinates: (coords: Coordinates) => void;
  selectedPeriod: ReturnPeriod;
  riskLevel?: FloodRiskLevel | null;
  simulatedDepth?: number | null;
  isPreviewMode?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  selectedCoordinates,
  onSelectCoordinates,
  selectedPeriod,
  riskLevel,
  routeData,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const floodLayerRef = useRef<L.LayerGroup | null>(null);

  const onSelectCoordinatesRef = useRef(onSelectCoordinates);

  const [activeProviderId, setActiveProviderId] =
    useState<TileProviderId>('osm-fr');

  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [tileSuccessCount, setTileSuccessCount] = useState(0);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const [showFloodPoints, setShowFloodPoints] = useState(true);
  const [showFloodPanel, setShowFloodPanel] = useState(false);
  const [floodPoints, setFloodPoints] = useState<FloodPoint[]>([]);
  const [floodLoading, setFloodLoading] = useState(false);
  const [floodError, setFloodError] = useState<string | null>(null);

  useEffect(() => {
    onSelectCoordinatesRef.current = onSelectCoordinates;
  }, [onSelectCoordinates]);

  const applyTileLayer = useCallback(
    (providerId: TileProviderId, map: L.Map) => {
      const provider =
        TILE_PROVIDERS.find((p) => p.id === providerId) ||
        TILE_PROVIDERS[0];

      if (currentTileLayerRef.current) {
        map.removeLayer(currentTileLayerRef.current);
      }

      setTileErrorCount(0);
      setTileSuccessCount(0);

      const newLayer = L.tileLayer(provider.url, {
        maxZoom: 19,
        attribution: provider.attribution,
        subdomains: provider.subdomains || [],
        crossOrigin: true,
      });

      let errors = 0;
      let successes = 0;

      newLayer.on('tileerror', () => {
        errors += 1;
        setTileErrorCount(errors);
      });

      newLayer.on('tileload', () => {
        successes += 1;
        setTileSuccessCount(successes);
      });

      newLayer.addTo(map);
      currentTileLayerRef.current = newLayer;
    },
    [],
  );

  // Khởi tạo bản đồ Leaflet một lần.
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const container = mapContainerRef.current;

    if ((container as any)._leaflet_id) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      delete (container as any)._leaflet_id;
    }

    const map = L.map(container, {
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 11,
      maxZoom: 19,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    L.control.zoom({
      position: 'topright',
    }).addTo(map);

    applyTileLayer('osm-fr', map);

    const studyBounds: L.LatLngBoundsExpression = [
      [
        STUDY_BOUNDS_COORDS.south,
        STUDY_BOUNDS_COORDS.west,
      ],
      [
        STUDY_BOUNDS_COORDS.north,
        STUDY_BOUNDS_COORDS.east,
      ],
    ];

    const studyBox = L.rectangle(studyBounds, {
      color: '#2563eb',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
    }).addTo(map);

    studyBox.bindTooltip(
      'Phạm vi dữ liệu ngập mô phỏng nghiên cứu tại Cần Thơ',
      {
        permanent: false,
        direction: 'top',
      },
    );

    // Nhóm riêng cho các điểm ngập mô phỏng.
    floodLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));

      onSelectCoordinatesRef.current({
        lat,
        lng,
      });
    });

    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    const t1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });

      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      map.remove();

      mapInstanceRef.current = null;
      markerRef.current = null;
      floodLayerRef.current = null;
      currentTileLayerRef.current = null;
    };
  }, [applyTileLayer]);

  // Tải các điểm ngập khi mở bản đồ hoặc đổi kịch bản.
  useEffect(() => {
    const controller = new AbortController();

    const fetchFloodPoints = async () => {
      setFloodLoading(true);
      setFloodError(null);
      setFloodPoints([]);

      try {
        const baseUrl = getApiBaseUrl().replace(/\/+$/, '');

        const url =
          `${baseUrl}/api/flood-points` +
          `?period=${selectedPeriod}` +
          `&step=${FLOOD_SAMPLE_STEP}`;

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `API trả về mã HTTP ${response.status}`,
          );
        }

        const data: FloodPointsResponse =
          await response.json();

        if (
          data.status !== 'success' ||
          !Array.isArray(data.points)
        ) {
          throw new Error('Dữ liệu API không hợp lệ');
        }

        if (!controller.signal.aborted) {
          setFloodPoints(data.points);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setFloodError(
          error instanceof Error
            ? error.message
            : 'Không thể tải điểm ngập',
        );
      } finally {
        if (!controller.signal.aborted) {
          setFloodLoading(false);
        }
      }
    };

    fetchFloodPoints();

    return () => {
      controller.abort();
    };
  }, [selectedPeriod]);

  // Vẽ điểm cảnh báo lên Leaflet.
  useEffect(() => {
    const layer = floodLayerRef.current;

    if (!layer) return;

    layer.clearLayers();

    if (!showFloodPoints) return;

    floodPoints.forEach((point) => {
      if (
        !Number.isFinite(point.latitude) ||
        !Number.isFinite(point.longitude) ||
        !Number.isFinite(point.depth_m)
      ) {
        return;
      }

      const isHigh = point.depth_m >= 0.30;

      const color = isHigh
        ? '#dc2626'
        : '#f59e0b';

      const circle = L.circleMarker(
        [point.latitude, point.longitude],
        {
          radius: isHigh ? 9 : 7,
          color: '#ffffff',
          weight: 2,
          fillColor: color,
          fillOpacity: 0.9,
          bubblingMouseEvents: false,
        },
      );

      const popup = document.createElement('div');

      popup.style.minWidth = '190px';
      popup.style.lineHeight = '1.6';

      const title = document.createElement('strong');
      title.textContent = 'Điểm ngập mô phỏng';

      const depth = document.createElement('div');
      depth.textContent =
        `Độ sâu: ${point.depth_m.toFixed(3)} m`;

      const scenario = document.createElement('div');
      scenario.textContent =
        `Kịch bản: ${selectedPeriod} năm`;

      const warning = document.createElement('div');
      warning.textContent = isHigh
        ? 'Vượt ngưỡng cảnh báo thử nghiệm 0,30 m'
        : 'Dưới ngưỡng cảnh báo thử nghiệm 0,30 m';

      warning.style.color = color;
      warning.style.fontWeight = '600';

      const note = document.createElement('small');
      note.textContent =
        'Dữ liệu mô phỏng, không phải cảnh báo thời gian thực.';

      popup.appendChild(title);
      popup.appendChild(depth);
      popup.appendChild(scenario);
      popup.appendChild(warning);
      popup.appendChild(note);

      circle.bindPopup(popup);

      circle.on('click', () => {
        onSelectCoordinatesRef.current({
          lat: point.latitude,
          lng: point.longitude,
        });
      });

      circle.addTo(layer);
    });
  }, [floodPoints, showFloodPoints, selectedPeriod]);

  // Marker của vị trí đang được người dùng kiểm tra.
  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) return;

    const { lat, lng } = selectedCoordinates;

    let pinColor = '#2563eb';

    if (riskLevel === 2) {
      pinColor = '#e11d48';
    } else if (riskLevel === 1) {
      pinColor = '#d97706';
    } else if (riskLevel === 0) {
      pinColor = '#059669';
    }

    const targetIcon = L.divIcon({
      className: 'target-pin-icon',
      html: `
        <div style="
          position:relative;
          width:36px;
          height:36px;
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          <div style="
            position:absolute;
            width:36px;
            height:36px;
            border-radius:50%;
            background:${pinColor};
            opacity:0.25;
          "></div>
          <div style="
            position:relative;
            width:22px;
            height:22px;
            border-radius:50%;
            background:${pinColor};
            border:3px solid white;
            box-shadow:0 3px 8px rgba(0,0,0,0.4);
            display:flex;
            align-items:center;
            justify-content:center;
            color:white;
            font-size:14px;
            font-weight:bold;
          ">+</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(targetIcon);
    } else {
      markerRef.current = L.marker(
        [lat, lng],
        {
          icon: targetIcon,
          zIndexOffset: 1000,
        },
      ).addTo(map);
    }
  }, [selectedCoordinates, riskLevel]);


  // Ve tuyen duong Geoapify tren lop Leaflet rieng.
  // Day la tuyen giao thong, CHUA duoc danh gia an toan ngap.
  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || !routeData) {
      return;
    }

    const layer = L.layerGroup().addTo(map);

    const { geometry, start, end } = routeData;

    const lines: number[][][] =
      geometry.type === 'LineString'
        ? [geometry.coordinates as number[][]]
        : (geometry.coordinates as number[][][]);

    const bounds = L.latLngBounds([]);
    let drawnSegments = 0;

    for (const line of lines) {
      if (!Array.isArray(line)) continue;

      const positions: L.LatLngTuple[] = [];

      for (const point of line) {
        if (!Array.isArray(point) || point.length < 2) {
          continue;
        }

        // GeoJSON = [longitude, latitude]
        // Leaflet = [latitude, longitude]
        const [longitude, latitude] = point;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          continue;
        }

        positions.push([latitude, longitude]);
      }

      if (positions.length < 2) continue;

      drawnSegments += 1;

      for (const position of positions) {
        bounds.extend(position);
      }

      // Vien trang giup duong de nhin.
      L.polyline(positions, {
        color: '#ffffff',
        weight: 9,
        opacity: 0.9,
        interactive: false,
      }).addTo(layer);

      // Duong xanh: tuyen giao thong Geoapify.
      L.polyline(positions, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        bubblingMouseEvents: false,
      })
        .bindTooltip(
          'Tuy?n giao th?ng Geoapify - ch?a ??nh gi? ng?p',
        )
        .addTo(layer);
    }

    if (drawnSegments === 0) {
      layer.remove();
      return;
    }

    const makeIcon = (label: string, color: string) =>
      L.divIcon({
        className: 'flood-route-marker',
        html: `
          <div style="
            width:30px;
            height:30px;
            border-radius:50%;
            background:${color};
            border:3px solid white;
            color:white;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:13px;
            font-weight:800;
            box-shadow:0 2px 8px rgba(0,0,0,.3);
          ">${label}</div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

    const startPosition: L.LatLngTuple = [
      start.latitude,
      start.longitude,
    ];

    const endPosition: L.LatLngTuple = [
      end.latitude,
      end.longitude,
    ];

    L.marker(startPosition, {
      icon: makeIcon('A', '#059669'),
      zIndexOffset: 1100,
    })
      .bindPopup('?i?m xu?t ph?t A')
      .addTo(layer);

    L.marker(endPosition, {
      icon: makeIcon('B', '#dc2626'),
      zIndexOffset: 1100,
    })
      .bindPopup('?i?m ??n B')
      .addTo(layer);

    bounds.extend(startPosition);
    bounds.extend(endPosition);

    map.invalidateSize();

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 16,
      animate: true,
    });

    // Xoa tuyen cu khi tim tuyen moi hoac unmount.
    return () => {
      layer.remove();
    };
  }, [routeData]);

  const handleSelectProvider = (id: TileProviderId) => {
    setActiveProviderId(id);
    setShowLayerMenu(false);

    if (mapInstanceRef.current) {
      applyTileLayer(id, mapInstanceRef.current);
    }
  };

  const handleResetToStudyArea = () => {
    const map = mapInstanceRef.current;

    if (!map) return;

    const bounds = L.latLngBounds(
      [
        STUDY_BOUNDS_COORDS.south,
        STUDY_BOUNDS_COORDS.west,
      ],
      [
        STUDY_BOUNDS_COORDS.north,
        STUDY_BOUNDS_COORDS.east,
      ],
    );

    map.fitBounds(bounds, {
      padding: [30, 30],
      animate: true,
    });
  };

  const handleCenterOnMarker = () => {
    const map = mapInstanceRef.current;

    if (!map) return;

    map.setView(
      [
        selectedCoordinates.lat,
        selectedCoordinates.lng,
      ],
      15,
      {
        animate: true,
      },
    );
  };

  const handleRetryTileLoad = () => {
    setTileErrorCount(0);

    if (currentTileLayerRef.current) {
      currentTileLayerRef.current.redraw();
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  };

  const inArea = isCoordinateInBounds(
    selectedCoordinates.lat,
    selectedCoordinates.lng,
  );

  const isSevereTileError =
    tileErrorCount >= 4 &&
    tileSuccessCount === 0;

  const highCount = floodPoints.filter(
    (point) => point.depth_m >= 0.30,
  ).length;

  const lowCount = floodPoints.length - highCount;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm">

      {/* Bản đồ Leaflet */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: 'min(78vh, 850px)',
          minHeight: '620px',
        }}
        className="w-full z-0"
      />

      {/* Thông báo lỗi tải bản đồ nền */}
      {isSevereTileError && (
        <div className="absolute top-14 left-3 right-3 z-[25] max-w-lg bg-amber-50 dark:bg-slate-900/95 border border-amber-300 dark:border-amber-700 p-3.5 rounded-xl shadow-xl text-xs space-y-2 text-slate-800 dark:text-slate-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">
                Không thể tải bản đồ nền
              </p>
              <p className="mt-1">
                Có thể máy chủ cung cấp tile đang gặp sự cố.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRetryTileLoad}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white"
            >
              Thử lại
            </button>

            <button
              onClick={() => handleSelectProvider('osm-carto')}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white"
            >
              Đổi nguồn bản đồ
            </button>
          </div>
        </div>
      )}

      {/* Thông tin kịch bản */}
      <div className="absolute top-3 left-3 z-[10] flex flex-col gap-2 pointer-events-none max-w-[calc(100%-75px)]">

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Kịch bản: T = {selectedPeriod} năm
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {selectedCoordinates.lat.toFixed(6)}°N,{' '}
            {selectedCoordinates.lng.toFixed(6)}°E
          </div>
        </div>

        <div
          className={`self-start px-2.5 py-1.5 rounded-lg text-[11px] font-medium border shadow-sm ${
            inArea
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {inArea
            ? 'Trong khung phạm vi nghiên cứu'
            : 'Ngoài phạm vi raster'}
        </div>
      </div>

      {/* Điều khiển lớp cảnh báo ngập */}
      <div className="absolute top-24 left-3 z-[10] max-w-[245px]">
        <div className="rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <button
            type="button"
            onClick={() => setShowFloodPanel((current) => !current)}
            aria-expanded={showFloodPanel}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              {floodLoading
                ? 'Dang tai...'
                : floodError
                  ? 'Loi tai du lieu'
                  : `${floodPoints.length} diem ngap`}
            </span>
            <span className="text-slate-500">
              {showFloodPanel ? '?' : '?'}
            </span>
          </button>

          {showFloodPanel && (
            <div className="border-t border-slate-200 p-3 text-xs dark:border-slate-700">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showFloodPoints}
                  onChange={(event) =>
                    setShowFloodPoints(event.target.checked)
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="font-semibold">
                  Hien thi diem ngap
                </span>
              </label>

              <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">
                {floodLoading
                  ? 'Dang tai du lieu...'
                  : floodError
                    ? floodError
                    : `${floodPoints.length} diem lay mau`}
              </p>

              {!floodError && !floodLoading && (
                <div className="mt-2 flex gap-3 text-[10px]">
                  <span className="text-amber-700">
                    {lowCount} diem duoi nguong
                  </span>
                  <span className="text-red-700">
                    {highCount} diem vuot nguong
                  </span>
                </div>
              )}

              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                Du lieu ngap mo phong, khong phai canh bao thoi gian thuc.
              </p>
              <p className="mt-1 text-[9px] text-slate-500">
                Contains data supplied by UK Centre for Ecology & Hydrology.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Các nút điều khiển bản đồ */}
      <div className="absolute bottom-4 left-3 z-[10] flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">

        <button
          onClick={handleResetToStudyArea}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          title="Hiển thị toàn bộ vùng nghiên cứu"
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">
            Vùng nghiên cứu
          </span>
        </button>

        <button
          onClick={handleCenterOnMarker}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          title="Đưa bản đồ về điểm đang chọn"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            Tâm điểm chọn
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() =>
              setShowLayerMenu(!showLayerMenu)
            }
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            title="Đổi nguồn bản đồ nền"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Nguồn Tile
            </span>
          </button>

          {showLayerMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-50 text-xs">

              {TILE_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() =>
                    handleSelectProvider(provider.id)
                  }
                  className={`w-full text-left px-2.5 py-2 rounded-lg ${
                    activeProviderId === provider.id
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hướng dẫn trên màn hình lớn */}
      <div className="absolute bottom-4 right-3 z-[10] hidden md:flex items-center gap-1.5 bg-slate-900/80 text-white backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px]">
        <MapPin className="w-3 h-3" />
        Nhấn vào bản đồ để kiểm tra độ sâu ngập
      </div>
    </div>
  );
};
