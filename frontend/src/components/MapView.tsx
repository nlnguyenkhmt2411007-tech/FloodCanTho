import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Coordinates,
  ReturnPeriod,
  FloodRiskLevel,
} from '../types/flood';
import { isCoordinateInBounds } from '../data/landmarks';
import {
  Maximize2,
  Crosshair,
  AlertTriangle,
  RefreshCw,
  Layers,
  Info,
} from 'lucide-react';

// Giới hạn vùng nghiên cứu thử nghiệm theo đề tài
const STUDY_BOUNDS_COORDS = {
  south: 10.032220,
  west: 105.737369,
  north: 10.060782,
  east: 105.763636,
};

// Tâm bản đồ ban đầu theo yêu cầu: vĩ độ 10.0465, kinh độ 105.7505
const INITIAL_CENTER: [number, number] = [10.0465, 105.7505];
const INITIAL_ZOOM = 14;

// Các nguồn TileLayer hợp lệ dựa trên 100% dữ liệu OpenStreetMap (HTTPS, công khai)
export interface TileProvider {
  id: 'osm-official' | 'osm-carto' | 'osm-fr';
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
}

const TILE_PROVIDERS: TileProvider[] = [
  {
    id: 'osm-official',
    name: 'OpenStreetMap (Chính thức)',
    // URL chính thức theo yêu cầu mục 3
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | FloodCanTho',
  },
  {
    id: 'osm-carto',
    name: 'OSM Voyager (Dự phòng cho iframe/Cloud)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
  },
  {
    id: 'osm-fr',
    name: 'OSM Pháp (Mirror quốc tế)',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | OpenStreetMap France',
    subdomains: ['a', 'b', 'c'],
  },
];

interface MapViewProps {
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Quản lý nguồn tile: mặc định là OpenStreetMap chính thức (osm-official)
  const [activeProviderId, setActiveProviderId] = useState<'osm-official' | 'osm-carto' | 'osm-fr'>('osm-fr');
  const [tileErrorCount, setTileErrorCount] = useState<number>(0);
  const [tileSuccessCount, setTileSuccessCount] = useState<number>(0);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Hàm chuyển đổi TileLayer
  const applyTileLayer = useCallback((providerId: 'osm-official' | 'osm-carto' | 'osm-fr', map: L.Map) => {
    const provider = TILE_PROVIDERS.find((p) => p.id === providerId) || TILE_PROVIDERS[0];

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    setTileErrorCount(0);
    setTileSuccessCount(0);

    const newLayer = L.tileLayer(provider.url, {
      maxZoom: 19,
      attribution: provider.attribution,
      subdomains: provider.subdomains || [],
      crossOrigin: true, // Cho phép cross-origin để tránh lỗi block trong iframe
    });

    let errors = 0;
    let successes = 0;

    newLayer.on('tileerror', () => {
      errors++;
      setTileErrorCount(errors);
    });

    newLayer.on('tileload', () => {
      successes++;
      setTileSuccessCount(successes);
    });

    newLayer.addTo(map);
    currentTileLayerRef.current = newLayer;
  }, []);

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Ngăn chặn khởi tạo đè nếu container đã có instance Leaflet
    if ((mapContainerRef.current as any)._leaflet_id) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    // Tâm bản đồ 10.0465, 105.7505; Zoom 14
    const map = L.map(mapContainerRef.current, {
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 11,
      maxZoom: 19,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Áp dụng TileLayer OpenStreetMap chính thức ban đầu
    applyTileLayer(activeProviderId, map);

    // Hình chữ nhật giới hạn vùng nghiên cứu theo đúng tọa độ đề bài
    const studyRectangleBounds: L.LatLngBoundsExpression = [
      [STUDY_BOUNDS_COORDS.south, STUDY_BOUNDS_COORDS.west],
      [STUDY_BOUNDS_COORDS.north, STUDY_BOUNDS_COORDS.east],
    ];

    const studyBox = L.rectangle(studyRectangleBounds, {
      color: '#2563eb', // viền xanh dương
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
    }).addTo(map);

    studyBox.bindTooltip(
      'Khu vực nghiên cứu thử nghiệm Cần Thơ (Bounding Box: Ninh Kiều - Bình Thủy)',
      { permanent: false, direction: 'top' }
    );

    // Lắng nghe sự kiện click trên bản đồ -> Cập nhật kinh độ và vĩ độ (Yêu cầu 7)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));
      onSelectCoordinates({ lat, lng });
    });

    mapInstanceRef.current = map;

    // Đảm bảo cập nhật kích thước khung chứa sau khi render
    requestAnimationFrame(() => {
      map.invalidateSize();
    });
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Xử lý đổi nguồn Tile nếu người dùng chọn
  const handleSelectProvider = (id: 'osm-official' | 'osm-carto' | 'osm-fr') => {
    setActiveProviderId(id);
    setShowLayerMenu(false);
    if (mapInstanceRef.current) {
      applyTileLayer(id, mapInstanceRef.current);
    }
  };

  // Cập nhật marker điểm chọn khi tọa độ thay đổi
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const { lat, lng } = selectedCoordinates;

    let pinColor = '#2563eb';
    if (riskLevel === 2) pinColor = '#e11d48';
    else if (riskLevel === 1) pinColor = '#d97706';
    else if (riskLevel === 0) pinColor = '#059669';

    const targetIcon = L.divIcon({
      className: 'target-pin-icon',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: ${pinColor};
            opacity: 0.3;
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: relative;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background-color: ${pinColor};
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: bold;
          ">
            ●
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(targetIcon);
    } else {
      const marker = L.marker([lat, lng], {
        icon: targetIcon,
        zIndexOffset: 1000,
      }).addTo(mapInstanceRef.current);
      markerRef.current = marker;
    }
  }, [selectedCoordinates, riskLevel]);

  // Nút đưa khung nhìn về trọn vẹn vùng nghiên cứu
  const handleResetToStudyArea = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds(
      [STUDY_BOUNDS_COORDS.south, STUDY_BOUNDS_COORDS.west],
      [STUDY_BOUNDS_COORDS.north, STUDY_BOUNDS_COORDS.east]
    );
    mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], animate: true });
  };

  // Nút di chuyển tâm vào tọa độ đang chọn
  const handleCenterOnMarker = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(
      [selectedCoordinates.lat, selectedCoordinates.lng],
      15,
      { animate: true }
    );
  };

  // Thử tải lại các mảnh bản đồ tile
  const handleRetryTileLoad = () => {
    setTileErrorCount(0);
    if (currentTileLayerRef.current) {
      currentTileLayerRef.current.redraw();
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  };

  const inArea = isCoordinateInBounds(selectedCoordinates.lat, selectedCoordinates.lng);

  // Kiểm tra nếu xảy ra lỗi tải tile nghiêm trọng (nhiều hơn 3 lỗi và chưa tải được tile nào)
  const isSevereTileError = tileErrorCount >= 4 && tileSuccessCount === 0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm">
      {/* Container bản đồ Leaflet có kích thước rõ ràng, không bị height = 0 */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '560px', minHeight: '520px' }}
        className="w-full h-[520px] sm:h-[580px] z-0"
      />

      {/* Thông báo lỗi rõ ràng nếu môi trường Preview / mạng chặn tải tile OpenStreetMap (Yêu cầu 5 & 10) */}
      {isSevereTileError && (
        <div className="absolute top-14 left-3 right-3 sm:right-auto z-[25] max-w-lg bg-amber-50 dark:bg-slate-900/95 border border-amber-300 dark:border-amber-700 p-3.5 rounded-xl shadow-xl text-xs space-y-2 text-slate-800 dark:text-slate-200 backdrop-blur-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Không thể tải mảnh bản đồ từ {TILE_PROVIDERS.find(p => p.id === activeProviderId)?.name}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                <strong>Nguyên nhân kỹ thuật:</strong> Máy chủ OpenStreetMap chính thức (Tile Usage Policy) hoặc chính sách bảo mật iframe/mạng của môi trường Preview có thể đang từ chối tải ảnh tile từ domain bên ngoài.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
            <button
              onClick={handleRetryTileLoad}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-white hover:bg-slate-900 font-medium text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Thử lại URL chính thức
            </button>
            <button
              onClick={() => handleSelectProvider('osm-carto')}
              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-[11px] flex items-center gap-1.5 transition-colors"
            >
              Chuyển sang nguồn OSM Voyager (Dự phòng)
            </button>
          </div>
        </div>
      )}

      {/* Top Floating Bar: Scenario & Coordinates HUD */}
      <div className="absolute top-3 left-3 z-[10] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Kịch bản chu kỳ: T = {selectedPeriod} năm
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 dark:text-slate-300 font-mono">
            {selectedCoordinates.lat.toFixed(6)}°N, {selectedCoordinates.lng.toFixed(6)}°E
          </span>
        </div>

        <div
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border shadow-sm ${
            inArea
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
          }`}
        >
          {inArea ? '✓ Trong phạm vi dữ liệu' : '⚠ Ngoài phạm vi raster'}
        </div>
      </div>

      {/* Floating Map Actions (Bottom Left) */}
      <div className="absolute bottom-4 left-3 z-[10] flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
        <button
          onClick={handleResetToStudyArea}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Thu phóng toàn bộ vùng bounding box nghiên cứu Cần Thơ"
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Vùng nghiên cứu</span>
        </button>

        <button
          onClick={handleCenterOnMarker}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Di chuyển tâm bản đồ tới điểm đang chọn"
        >
          <Crosshair className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          <span className="hidden sm:inline">Tâm điểm chọn</span>
        </button>

        {/* Nút tùy chọn nguồn Tile OSM */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Đổi nguồn tile bản đồ OpenStreetMap"
          >
            <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span className="hidden sm:inline">Nguồn Tile</span>
          </button>

          {showLayerMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-50 text-xs">
              <span className="block px-2 py-1 font-semibold text-[11px] text-slate-400 uppercase">
                Chọn nguồn dữ liệu Tile
              </span>
              {TILE_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleSelectProvider(provider.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    activeProviderId === provider.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{provider.name}</span>
                  {activeProviderId === provider.id && <span className="text-[10px]">●</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions Overlay Helper */}
      <div className="absolute bottom-4 right-3 z-[10] hidden md:block bg-slate-900/80 text-white backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px]">
        Nhấp chuột vào bản đồ bất kỳ để chọn tọa độ kiểm tra
      </div>
    </div>
  );
};
