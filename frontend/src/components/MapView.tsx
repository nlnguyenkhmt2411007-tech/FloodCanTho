
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
  Search, Ruler, ListFilter, BookOpen, Settings, X, Check,
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
  onOpenSettings?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  selectedCoordinates,
  onSelectCoordinates,
  selectedPeriod,
  riskLevel,
  routeData,
  onOpenSettings,
}) => {
  // FLOOD_TOOLBAR_V1: Cong cu noi tren ban do.
  const [activeTool, setActiveTool] = useState<'layers' | 'search' | 'measure' | 'filter' | 'legend' | null>(null);
  const [mapSearch, setMapSearch] = useState('');
  const [mapSearchError, setMapSearchError] = useState('');
  const [visibleLevels, setVisibleLevels] = useState({ green: true, yellow: true, red: true });
  const visibleLevelsRef = useRef(visibleLevels);
  visibleLevelsRef.current = visibleLevels;
  const [measureMode, setMeasureMode] = useState(false);
  const measureModeRef = useRef(false);
  const measureStartRef = useRef<L.LatLng | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const [measureResult, setMeasureResult] = useState('Chọn điểm đầu tiên trên bản đồ.');
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
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) map.fire('moveend');
  }, [visibleLevels]);

  const [showFloodPoints, setShowFloodPoints] = useState(false);
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

    // Lop diem ngap tren duong duoc gan vao ban do hien tai.
    {
      const controller = new AbortController();
    const layer = L.layerGroup().addTo(map);
    let points: any[] = [];

    // FLOOD_MARKERS_BALANCED_V2: lay mau hien thi, khong sua GeoJSON goc.
    let lastDrawKey = '';
    const drawPoints = () => {
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      const center = map.getCenter();
      const levels = visibleLevelsRef.current;

      const drawKey = [
        zoom,
        center.lat.toFixed(5),
        center.lng.toFixed(5),
        bounds.getSouth().toFixed(5),
        bounds.getWest().toFixed(5),
        bounds.getNorth().toFixed(5),
        bounds.getEast().toFixed(5),
        levels.green,
        levels.yellow,
        levels.red,
        points.length,
      ].join('|');

      if (drawKey === lastDrawKey) return;
      lastDrawKey = drawKey;

      layer.clearLayers();
      // Giu nguyen du lieu goc; chi lay mau diem HIEN THI theo muc zoom.
      const maxPoints = zoom >= 17 ? 340 : zoom >= 15 ? 230 : 155;
      const cellSize = zoom >= 17 ? 15 : zoom >= 15 ? 19 : 23;
      const radius = zoom >= 17 ? 4.5 : zoom >= 15 ? 4.2 : 3.8;

      type RoadPoint = { properties: {
        latitude: number; longitude: number; depth_m: number;
        level: 'green' | 'yellow' | 'red'; road_name?: string;
      } };
      const visible = (points as RoadPoint[]).filter((feature) => {
        const p = feature.properties;
        return visibleLevelsRef.current[p.level] &&
          Number.isFinite(p.latitude) && Number.isFinite(p.longitude) &&
          bounds.contains([p.latitude, p.longitude]);
      });
      // Phan bo theo tung nhom mau, tranh mau do chiem het suat ve.
      const groups = {
        red: visible.filter((f) => f.properties.level === 'red'),
        yellow: visible.filter((f) => f.properties.level === 'yellow'),
        green: visible.filter((f) => f.properties.level === 'green'),
      };
      const occupied = new Set<string>();
      const selected: RoadPoint[] = [];
      const warningPositions: L.LatLngTuple[] = [];
      const warningCells = new Set<string>();
      const warningGap = zoom >= 17 ? 100 : zoom >= 15 ? 125 : 150;

      const addFrom = (items: RoadPoint[], limit: number) => {
        let added = 0;
        // Lay mau deu tren toan danh sach, khong chi lay cum dau tien.
        const stride = Math.max(1, Math.floor(items.length / Math.max(1, limit)));
        for (let pass = 0; pass < stride && added < limit; pass++) {
          for (let i = pass; i < items.length && added < limit; i += stride) {
            const feature = items[i];
            const p = feature.properties;
            const pixel = map.latLngToContainerPoint([p.latitude, p.longitude]);
            const key = `${Math.floor(pixel.x / cellSize)}:${Math.floor(pixel.y / cellSize)}`;
            if (occupied.has(key)) continue;
            occupied.add(key);
            selected.push(feature);
            added++;
          }
        }
      };
      // Uu tien du diem do de thay ngay khi mo ban do, van giu xanh/vang ro rang.
      addFrom(groups.red, Math.min(groups.red.length, Math.round(maxPoints * 0.22)));
      addFrom(groups.yellow, Math.min(groups.yellow.length, Math.round(maxPoints * 0.34)));
      addFrom(groups.green, maxPoints - selected.length);
      if (selected.length < maxPoints) {
        addFrom([...groups.red, ...groups.yellow, ...groups.green], maxPoints - selected.length);
      }

      for (const feature of selected) {
        const p = feature.properties;
        const isRed = p.level === 'red';
        const color = isRed ? '#F51535' : p.level === 'yellow' ? '#FFC400' : '#00B85B';
        const circle = L.circleMarker([p.latitude, p.longitude], {
          radius: isRed ? radius + 1.3 : radius,
          color: '#ffffff', weight: 1.4, fillColor: color,
          fillOpacity: 0.97, bubblingMouseEvents: false,
        });
        const popup = document.createElement('div');
        popup.style.cssText = 'min-width:260px;max-width:300px;line-height:1.55;font-family:inherit;color:#0f172a';

        const status = document.createElement('div');
        status.style.cssText = `padding:10px 12px;border-radius:10px;font-size:13px;font-weight:800;color:${isRed ? '#be123c' : p.level === 'yellow' ? '#a16207' : '#047857'};background:${isRed ? '#fff1f2' : p.level === 'yellow' ? '#fffbeb' : '#ecfdf5'};border:1px solid ${isRed ? '#fecdd3' : p.level === 'yellow' ? '#fde68a' : '#a7f3d0'}`;
        status.textContent = isRed ? '⚠ Ngập nặng' : p.level === 'yellow' ? '● Ngập nhẹ' : '● Không ngập';

        const road = document.createElement('div');
        road.style.cssText = 'margin-top:12px;font-size:13px;font-weight:750;color:#334155';
        road.textContent = String(p.road_name || 'Chưa có tên đường');

        const depthLabel = document.createElement('div');
        depthLabel.style.cssText = 'margin-top:9px;font-size:11px;font-weight:650;color:#64748b';
        depthLabel.textContent = 'ĐỘ SÂU NGẬP MÔ PHỎNG';

        const depth = document.createElement('div');
        depth.style.cssText = `margin-top:1px;font-size:29px;line-height:1.25;font-weight:850;letter-spacing:-0.5px;color:${isRed ? '#e11d48' : p.level === 'yellow' ? '#ca8a04' : '#059669'}`;
        depth.textContent = `${Number(p.depth_m).toFixed(2).replace('.', ',')} m`;

        const detail = document.createElement('div');
        detail.style.cssText = 'margin-top:10px;padding:9px 10px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;color:#475569';
        detail.textContent = `Tọa độ: ${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}`;

        const note = document.createElement('div');
        note.style.cssText = `margin-top:10px;padding:10px 11px;border-radius:8px;font-size:11px;line-height:1.65;color:${isRed ? '#9f1239' : '#475569'};background:${isRed ? '#fff1f2' : '#f8fafc'}`;
        note.textContent = isRed
          ? 'Vượt ngưỡng cảnh báo thử nghiệm 0,30 m. Dữ liệu mô phỏng kịch bản 100 năm, không phải cảnh báo ngập thời gian thực.'
          : 'Dữ liệu mô phỏng kịch bản 100 năm, không phải cảnh báo ngập thời gian thực.';

        popup.append(status, road, depthLabel, depth, detail, note);
        circle.bindPopup(popup);
        circle.on('click', () => onSelectCoordinatesRef.current({ lat: p.latitude, lng: p.longitude }));
        circle.addTo(layer);

        // Bieu tuong do lon chi tai mot so vi tri, ke ca zoom ban dau.
        if (isRed && zoom >= 13) {
          const pixel = map.latLngToContainerPoint([p.latitude, p.longitude]);
          const wx = Math.floor(pixel.x / warningGap);
          const wy = Math.floor(pixel.y / warningGap);
          const key = `${wx}:${wy}`;
          if (!warningCells.has(key) && warningPositions.length < (zoom >= 16 ? 10 : 6)) {
            warningCells.add(key);
            warningPositions.push([p.latitude, p.longitude]);
          }
        }
      }
      for (const position of warningPositions) {
        const icon = L.divIcon({
          className: 'flood-warning-icon',
          html: `
            <div style="
              width:44px;
              height:44px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:50%;
              background:rgba(239,68,68,0.18);
              box-shadow:0 0 0 6px rgba(239,68,68,0.10),
                         0 0 18px 5px rgba(239,68,68,0.45);
            ">
              <div style="
                width:32px;
                height:32px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:50%;
                background:#ef233c;
                border:2px solid white;
                box-shadow:0 3px 10px rgba(185,28,28,0.45);
              ">
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10.3 3.9 1.9 18.4A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
                  <path d="M12 9v4"/>
                  <path d="M12 17h.01"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        L.marker(position, {
          icon,
          interactive: false,
          zIndexOffset: 450,
        }).addTo(layer);
      }
    };

    fetch('/data/flood_road_points_100years.geojson', {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (
          data.type !== 'FeatureCollection' ||
          !Array.isArray(data.features)
        ) {
          throw new Error('GeoJSON khong hop le');
        }

        points = data.features.map((feature: any) => ({
          ...feature,
          properties: {
            ...feature.properties,
            longitude: Number(feature.geometry.coordinates[0]),
            latitude: Number(feature.geometry.coordinates[1]),
          },
        }));
        console.log('Da nap diem ngap:', points.length);
        drawPoints();
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error('Loi tai diem ngap tren duong:', error);
        }
      });

    map.on('zoomend', drawPoints);


      map.on('unload', () => {
        controller.abort();
        map.off('zoomend', drawPoints);
        layer.remove();
      });
    }


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
      fillOpacity: 0.035,
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

    measureLayerRef.current = L.layerGroup().addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (measureModeRef.current) {
        const measureLayer = measureLayerRef.current;
        if (!measureLayer) return;
        if (!measureStartRef.current) {
          measureStartRef.current = e.latlng;
          measureLayer.clearLayers();
          L.circleMarker(e.latlng, { radius: 6, color: '#2563eb', fillColor: '#fff', fillOpacity: 1 }).addTo(measureLayer);
          setMeasureResult('Chọn điểm thứ hai để đo khoảng cách.');
        } else {
          const start = measureStartRef.current;
          const distance = start.distanceTo(e.latlng);
          measureLayer.clearLayers();
          L.polyline([start, e.latlng], { color: '#2563eb', weight: 3, dashArray: '6,5' }).addTo(measureLayer);
          L.circleMarker(start, { radius: 6, color: '#2563eb' }).addTo(measureLayer);
          L.circleMarker(e.latlng, { radius: 6, color: '#2563eb' }).addTo(measureLayer);
          setMeasureResult(distance >= 1000 ? `${(distance / 1000).toFixed(2)} km (đường thẳng)` : `${Math.round(distance)} m (đường thẳng)`);
          measureStartRef.current = null;
        }
        return;
      }
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
      let lastWidth = container.clientWidth;
      let lastHeight = container.clientHeight;

      resizeObserver = new ResizeObserver(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (
          width <= 0 ||
          height <= 0 ||
          (width === lastWidth && height === lastHeight)
        ) {
          return;
        }

        lastWidth = width;
        lastHeight = height;

        map.invalidateSize({
          pan: false,
          debounceMoveend: true,
        });
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
      measureLayerRef.current = null;
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

      const color =
        point.depth_m >= 0.30
          ? '#dc2626' // Đỏ: ngập từ 0,30 m
          : point.depth_m >= 0.05
            ? '#f59e0b' // Cam: từ 0,05 m đến dưới 0,30 m
            : '#16a34a'; // Xanh: dưới 0,05 m

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

  const handleToolClick = (tool: 'layers' | 'search' | 'measure' | 'filter' | 'legend') => {
    if (tool !== 'measure') {
      measureModeRef.current = false;
      setMeasureMode(false);
    }
    if (tool === 'measure') {
      const next = activeTool !== 'measure';
      measureModeRef.current = next;
      setMeasureMode(next);
      measureStartRef.current = null;
      measureLayerRef.current?.clearLayers();
      setMeasureResult('Chọn điểm đầu tiên trên bản đồ.');
    }
    setActiveTool((old) => old === tool ? null : tool);
  };

  const handleMapSearch = () => {
    const values = mapSearch.trim().split(/[,;\s]+/).map(Number);
    if (values.length !== 2 || values.some((n) => !Number.isFinite(n)) ||
        values[0] < -90 || values[0] > 90 || values[1] < -180 || values[1] > 180) {
      setMapSearchError('Nhập tọa độ theo mẫu: 10.0465, 105.7505');
      return;
    }
    setMapSearchError('');
    const [lat, lng] = values;
    mapInstanceRef.current?.setView([lat, lng], 17, { animate: true });
    onSelectCoordinatesRef.current({ lat, lng });
  };

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

  // Điểm xanh: độ sâu dưới 0,05 m
  const greenCount = floodPoints.filter(
    (point) => point.depth_m >= 0 && point.depth_m < 0.05,
  ).length;

  // Điểm cam: từ 0,05 m đến dưới 0,30 m
  const orangeCount = floodPoints.filter(
    (point) => point.depth_m >= 0.05 && point.depth_m < 0.30,
  ).length;

  // Điểm đỏ: từ 0,30 m trở lên
  const highCount = floodPoints.filter(
    (point) => point.depth_m >= 0.30,
  ).length;

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm xl:pr-[102px]">

      {/* Bản đồ Leaflet */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: 'clamp(400px, 52vh, 540px)',
          minHeight: '400px',
        }}
        className="w-full z-0"
      />

      {/* FLOOD_TOOLBAR_V1: Thanh cong cu phai va bang noi. */}
      <div className="absolute right-2 top-2 left-2 z-[500] flex flex-col-reverse items-end gap-2 xl:left-auto xl:right-0 xl:top-0 xl:flex-row xl:items-start">
        {activeTool && (
          <div className="w-[min(290px,calc(100vw-40px))] max-h-[55vh] overflow-y-auto xl:w-[min(290px,calc(100vw-115px))] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md text-xs text-slate-800">
            <div className="mb-3 flex items-center justify-between gap-2">
              <strong className="text-sm">{{ layers: 'Lớp bản đồ', search: 'Tìm địa điểm', measure: 'Đo khoảng cách', filter: 'Lọc điểm ngập', legend: 'Chú giải' }[activeTool]}</strong>
              <button type="button" aria-label="Đóng bảng công cụ" onClick={() => { setActiveTool(null); setMeasureMode(false); measureModeRef.current = false; }} className="rounded-lg p-1 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            {activeTool === 'layers' && <div className="space-y-1.5">
              {TILE_PROVIDERS.map((provider) => <button type="button" key={provider.id} onClick={() => handleSelectProvider(provider.id)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${activeProviderId === provider.id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}><span>{provider.name}</span>{activeProviderId === provider.id && <Check className="h-4 w-4" />}</button>)}
              <p className="pt-1 text-[10px] text-slate-500">Nguồn bản đồ nền hiện có. Chưa tích hợp ảnh vệ tinh.</p>
            </div>}
            {activeTool === 'search' && <div className="space-y-2">
              <p className="text-slate-600">Tìm vị trí bằng tọa độ vĩ độ, kinh độ.</p>
              <input value={mapSearch} onChange={(e) => setMapSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleMapSearch(); }} placeholder="10.0465, 105.7505" aria-label="Tọa độ tìm kiếm" className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500" />
              {mapSearchError && <p className="text-red-600">{mapSearchError}</p>}
              <button type="button" onClick={handleMapSearch} className="w-full rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white">Đến vị trí</button>
              <p className="text-[10px] text-slate-500">Tìm theo tên địa điểm có sẵn trong ô A → B bên trái khi API hoạt động.</p>
            </div>}
            {activeTool === 'measure' && <div className="space-y-2">
              <p className="text-slate-600">Nhấn hai vị trí trên bản đồ để đo khoảng cách đường thẳng.</p>
              <p className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700">{measureResult}</p>
              <button type="button" onClick={() => { measureStartRef.current = null; measureLayerRef.current?.clearLayers(); setMeasureResult('Chọn điểm đầu tiên trên bản đồ.'); }} className="rounded-lg border border-slate-200 px-3 py-2">Đo lại</button>
              {!measureMode && <p>Chọn lại nút đo để bật chế độ đo.</p>}
            </div>}
            {activeTool === 'filter' && <div className="space-y-3">
              {([{ key: 'green', label: 'Không ngập · dưới 0,05 m', color: '#00B85B' }, { key: 'yellow', label: 'Ngập nhẹ · 0,05–dưới 0,30 m', color: '#FFC400' }, { key: 'red', label: 'Ngập nặng · từ 0,30 m', color: '#F51535' }] as const).map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={visibleLevels[item.key]} onChange={(e) => setVisibleLevels((old) => ({ ...old, [item.key]: e.target.checked }))} className="accent-blue-600" /><span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} /><span>{item.label}</span></label>)}
              <p className="text-[10px] text-slate-500">Lọc lớp điểm mô phỏng từ GeoJSON 100 năm đang hiển thị.</p>
            </div>}
            {activeTool === 'legend' && <div className="space-y-2">
              <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#00B85B]" />Không ngập: dưới 0,05 m</p>
              <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#FFC400]" />Ngập nhẹ: 0,05 đến dưới 0,30 m</p>
              <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#F51535]" />Ngập nặng: từ 0,30 m</p>
              <p className="pt-1 text-[10px] text-slate-500">Dữ liệu mô phỏng 100 năm, không phải cảnh báo thời gian thực. Ngưỡng 0,30 m là thử nghiệm.</p>
            </div>}
          </div>
        )}
        <div className="flex w-full max-w-full min-w-0 shrink-0 flex-row items-center gap-1 overflow-x-auto overscroll-x-contain rounded-2xl xl:w-[90px] xl:flex-col xl:overflow-visible border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
          {([
            { id: 'layers', label: 'Lớp bản đồ', Icon: Layers },
            { id: 'search', label: 'Tìm địa điểm', Icon: Search },
            { id: 'measure', label: 'Đo khoảng cách', Icon: Ruler },
            { id: 'filter', label: 'Lọc điểm ngập', Icon: ListFilter },
            { id: 'legend', label: 'Chú giải', Icon: BookOpen },
          ] as const).map(({ id, label, Icon }) => <button key={id} type="button" title={label} aria-pressed={activeTool === id} onClick={() => handleToolClick(id)} className={`flex min-w-[66px] shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] xl:w-full font-semibold leading-tight transition ${activeTool === id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}><Icon className="h-5 w-5" />{label}</button>)}
          <button type="button" title="Cài đặt" onClick={() => onOpenSettings?.()} className="flex min-w-[66px] shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] xl:w-full font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700"><Settings className="h-5 w-5" />Cài đặt</button>
        </div>
      </div>

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
          className={`self-start px-2.5 py-1.5 rounded-lg text-[11px] font-medium border shadow-sm ${inArea
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
                  <span className="text-green-700">
                    🟢 {greenCount} điểm xanh
                  </span>
                  <span className="text-amber-700">
                    {orangeCount} điểm cam
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


      {/* Chú giải lớp đường ngập mô phỏng 100 năm */}
      <div className="absolute bottom-16 left-3 z-[10] hidden max-w-[260px] md:block rounded-xl border border-slate-200 bg-white/95 dark:bg-slate-900/95 dark:border-slate-700 p-3 shadow-lg text-xs">
        <div className="font-bold text-slate-800 dark:text-slate-100">
          Ngập mô phỏng - kịch bản 100 năm
        </div>
        <div className="mt-2 space-y-1.5 text-slate-700 dark:text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-7 h-1.5 rounded bg-[#00B85B]" />
            Dưới 0,05 m
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-1.5 rounded bg-[#FFC400]" />
            0,05 đến dưới 0,30 m
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-1.5 rounded bg-[#F51535]" />
            Từ 0,30 m
          </div>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          Không phải cảnh báo thời gian thực.
        </p>
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
                  className={`w-full text-left px-2.5 py-2 rounded-lg ${activeProviderId === provider.id
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






