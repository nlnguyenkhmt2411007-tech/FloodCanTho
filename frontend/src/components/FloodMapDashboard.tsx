import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  Coordinates,
  ReturnPeriod,
  FloodPredictionResponse,
} from '../types/flood';
import { MapView } from './MapView';
import { FloodLeftCards, MiniStudyMap } from './FloodLeftCards';
import { ScenarioSelector } from './ScenarioSelector';
import { LocationInspector } from './LocationInspector';
import { MapLegend } from './MapLegend';
import { ScientificNotice } from './ScientificNotice';
import {
  requestFloodPrediction,
  isMixedContentScenario,
  getApiBaseUrl,
} from '../services/floodApi';
import {
  Map,
  Route,
  MapPin,
  Navigation,
  Layers,
  Info,
  ChevronDown,
  ArrowDownUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
interface FloodMapDashboardProps {
  isBackendConnected: boolean;
  onOpenSettings: () => void;
  onConnectionChange: (connected: boolean) => void;
  onAnalyzeWithMl: (
    coordinates: Coordinates,
    period: ReturnPeriod,
  ) => void;
}
interface Place {
  name: string;
  latitude: number;
  longitude: number;
}
interface PlaceSearchResponse {
  status: string;
  places: Place[];
  total: number;
}
interface RouteGeometry {
  type: 'LineString' | 'MultiLineString';
  coordinates: number[][] | number[][][];
}
interface RouteResponse {
  start: {
    latitude: number;
    longitude: number;
  };
  end: {
    latitude: number;
    longitude: number;
  };
  status: string;
  mode: 'drive' | 'walk';
  distance_km: number | null;
  duration_minutes: number | null;
  geometry: RouteGeometry;
  route_source: string;
  flood_analysis_available: boolean;
  is_flood_safe_route: boolean | null;
  message: string;
}
interface RouteFloodAnalysis {
  status: string;
  return_period_years: number;
  route_length_km: number;
  total_samples: number;
  valid_samples: number;
  outside_raster_samples: number;
  nodata_samples: number;
  coverage_percent: number;
  max_depth_m: number | null;
  above_threshold_samples: number;
  depth_threshold_m: number;
  sample_spacing_m_approx: number;
  data_source: string;
  is_realtime_forecast: boolean;
  is_route_safe: boolean | null;
  message: string;
}
type LocationField = 'origin' | 'destination';
type TravelMode = 'driving' | 'walking';
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Đã xảy ra lỗi không xác định.';
}
async function fetchJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') {
        detail = body.detail;
      }
    } catch {
      // Neu server khong tra JSON, dung thong bao mac dinh.
    }
    throw new Error(
      detail || `Máy chủ trả về lỗi HTTP ${response.status}`,
    );
  }
  return (await response.json()) as T;
}
export const FloodMapDashboard: React.FC<
  FloodMapDashboardProps
> = ({
  isBackendConnected,
  onOpenSettings,
  onConnectionChange,
  onAnalyzeWithMl,
}) => {
    const [coordinates, setCoordinates] =
      useState<Coordinates>({
        lat: 10.0461,
        lng: 105.7538,
      });
    const [selectedPeriod, setSelectedPeriod] =
      useState<ReturnPeriod>(100);
    const [predictionData, setPredictionData] =
      useState<FloodPredictionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [originPlace, setOriginPlace] =
      useState<Place | null>(null);
    const [destinationPlace, setDestinationPlace] =
      useState<Place | null>(null);
    const [activeSearch, setActiveSearch] =
      useState<LocationField | null>(null);
    const [suggestions, setSuggestions] =
      useState<Place[]>([]);
    const [isSearching, setIsSearching] =
      useState(false);
    const [searchError, setSearchError] =
      useState('');
    const [travelMode, setTravelMode] =
      useState<TravelMode>('driving');
    const [routeData, setRouteData] =
      useState<RouteResponse | null>(null);
    const [isRouting, setIsRouting] =
      useState(false);
    const [routeError, setRouteError] =
      useState('');
    const [routeFloodData, setRouteFloodData] =
      useState<RouteFloodAnalysis | null>(null);
    const [isAnalyzingRouteFlood, setIsAnalyzingRouteFlood] =
      useState(false);
    const [routeFloodError, setRouteFloodError] =
      useState('');
    const [showScientificNotice, setShowScientificNotice] =
      useState(false);
    const visibleRouteFloodData =
      routeFloodData?.return_period_years === selectedPeriod
        ? routeFloodData
        : null;
    const searchRequestId = useRef(0);
    const routeRequestId = useRef(0);
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
    const isMixedContent =
      isMixedContentScenario(baseUrl);
    const fetchPrediction = useCallback(
      async (
        coords: Coordinates,
        period: ReturnPeriod,
      ) => {
        if (!isBackendConnected) {
          setPredictionData(null);
          return;
        }
        setIsLoading(true);
        try {
          const res = await requestFloodPrediction({
            latitude: coords.lat,
            longitude: coords.lng,
            return_period_years: period,
          });
          if (res.success && res.data) {
            setPredictionData(res.data);
          } else {
            if (!res.connected) {
              onConnectionChange(false);
            }
            setPredictionData(null);
          }
        } finally {
          setIsLoading(false);
        }
      },
      [isBackendConnected, onConnectionChange],
    );
    useEffect(() => {
      fetchPrediction(coordinates, selectedPeriod);
    }, [
      coordinates,
      selectedPeriod,
      isBackendConnected,
      fetchPrediction,
    ]);
    // Tim dia chi sau khi nguoi dung ngung go 400ms.
    useEffect(() => {
      if (!activeSearch) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }
      const query = (
        activeSearch === 'origin'
          ? origin
          : destination
      ).trim();
      if (query.length < 2) {
        setSuggestions([]);
        setIsSearching(false);
        setSearchError('');
        return;
      }
      const controller = new AbortController();
      const requestId = ++searchRequestId.current;
      setIsSearching(true);
      setSearchError('');
      const timer = window.setTimeout(async () => {
        try {
          const params = new URLSearchParams({ q: query });
          const data = await fetchJson<PlaceSearchResponse>(
            `${baseUrl}/api/places/search?${params.toString()}`,
            controller.signal,
          );
          if (requestId !== searchRequestId.current) {
            return;
          }
          setSuggestions(
            Array.isArray(data.places)
              ? data.places
              : [],
          );
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }
          if (requestId !== searchRequestId.current) {
            return;
          }
          setSuggestions([]);
          setSearchError(getErrorMessage(error));
        } finally {
          if (
            !controller.signal.aborted &&
            requestId === searchRequestId.current
          ) {
            setIsSearching(false);
          }
        }
      }, 400);
      return () => {
        window.clearTimeout(timer);
        controller.abort();
      };
    }, [activeSearch, origin, destination, baseUrl]);
    const handleSelectCoordinates = (
      newCoords: Coordinates,
    ) => {
      setCoordinates(newCoords);
    };
    const handleSelectPeriod = (
      newPeriod: ReturnPeriod,
    ) => {
      routeRequestId.current += 1;
      setSelectedPeriod(newPeriod);
      setRouteData(null);
      setRouteFloodData(null);
      setRouteFloodError('');
      setIsAnalyzingRouteFlood(false);
      setIsRouting(false);
    };
    const handleInputChange = (
      field: LocationField,
      value: string,
    ) => {
      if (field === 'origin') {
        setOrigin(value);
        setOriginPlace(null);
      } else {
        setDestination(value);
        setDestinationPlace(null);
      }
      setActiveSearch(field);
      routeRequestId.current += 1;
      setRouteData(null);
      setRouteFloodData(null);
      setRouteFloodError('');
      setIsAnalyzingRouteFlood(false);
      setIsRouting(false);
      setRouteError('');
    };
    const handleSelectPlace = (
      field: LocationField,
      place: Place,
    ) => {
      if (field === 'origin') {
        setOrigin(place.name);
        setOriginPlace(place);
      } else {
        setDestination(place.name);
        setDestinationPlace(place);
      }
      setActiveSearch(null);
      setSuggestions([]);
      setSearchError('');
      routeRequestId.current += 1;
      setRouteData(null);
      setRouteFloodData(null);
      setRouteFloodError('');
      setIsAnalyzingRouteFlood(false);
      setIsRouting(false);
      setRouteError('');
      setCoordinates({
        lat: place.latitude,
        lng: place.longitude,
      });
    };
    const handleSwapLocations = () => {
      setOrigin(destination);
      setDestination(origin);
      setOriginPlace(destinationPlace);
      setDestinationPlace(originPlace);
      setActiveSearch(null);
      setSuggestions([]);
      routeRequestId.current += 1;
      setRouteData(null);
      setRouteFloodData(null);
      setRouteFloodError('');
      setIsAnalyzingRouteFlood(false);
      setIsRouting(false);
      setRouteError('');
    };
    const handleFindRoute = async () => {
      if (!originPlace || !destinationPlace) {
        setRouteError(
          'Hãy chọn cả điểm xuất phát và điểm đến từ danh sách gợi ý.',
        );
        return;
      }
      const currentRouteRequestId = ++routeRequestId.current;
      setRouteFloodData(null);
      setRouteFloodError('');
      setIsAnalyzingRouteFlood(false);
      setIsRouting(true);
      setRouteError('');
      setRouteData(null);
      setActiveSearch(null);
      const params = new URLSearchParams({
        start_lat: String(originPlace.latitude),
        start_lon: String(originPlace.longitude),
        end_lat: String(destinationPlace.latitude),
        end_lon: String(destinationPlace.longitude),
        mode: travelMode === 'driving' ? 'drive' : 'walk',
      });
      try {
        const data = await fetchJson<RouteResponse>(
          `${baseUrl}/api/route?${params.toString()}`,
        );
        if (
          data.status !== 'success' ||
          !data.geometry?.coordinates
        ) {
          throw new Error(
            'Máy chủ không trả về tuyến đường hợp lệ.',
          );
        }
        if (currentRouteRequestId !== routeRequestId.current) return;
        setRouteData(data);
        // Analyze simulated flood depth without hiding the traffic route.
        setRouteFloodData(null);
        setRouteFloodError('');
        setIsAnalyzingRouteFlood(true);
        try {
          const geometry = data.geometry;
          let routeCoordinates: number[][];
          if (geometry.type === 'LineString') {
            routeCoordinates = geometry.coordinates as number[][];
          } else {
            const segments = geometry.coordinates as number[][][];
            if (segments.length !== 1) {
              throw new Error(
                'Flood analysis does not support disconnected route segments.',
              );
            }
            routeCoordinates = segments[0];
          }
          const response = await fetch(
            `${baseUrl}/api/route-flood-analysis`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                return_period_years: selectedPeriod,
                coordinates: routeCoordinates,
              }),
            },
          );
          if (!response.ok) {
            let detail = '';
            try {
              const body = await response.json();
              if (typeof body.detail === 'string') {
                detail = body.detail;
              }
            } catch {
              // Keep the default HTTP error.
            }
            throw new Error(
              detail || `Flood analysis HTTP ${response.status}`,
            );
          }
          const analysis =
            (await response.json()) as RouteFloodAnalysis;
          if (analysis.status !== 'success') {
            throw new Error('Flood analysis returned invalid data.');
          }
          if (currentRouteRequestId !== routeRequestId.current) return;
          setRouteFloodData(analysis);
        } catch (analysisError) {
          if (currentRouteRequestId === routeRequestId.current) {
            setRouteFloodError(getErrorMessage(analysisError));
          }
        } finally {
          if (currentRouteRequestId === routeRequestId.current) {
            setIsAnalyzingRouteFlood(false);
          }
        }
      } catch (error) {
        if (currentRouteRequestId === routeRequestId.current) {
          setRouteError(getErrorMessage(error));
        }
      } finally {
        if (currentRouteRequestId === routeRequestId.current) {
          setIsRouting(false);
        }
      }
    };
    const renderSuggestions = (
      field: LocationField,
    ) => {
      if (activeSearch !== field) {
        return null;
      }
      const query = (
        field === 'origin' ? origin : destination
      ).trim();
      if (query.length < 2) {
        return null;
      }
      return (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {isSearching ? (
            <div className="flex items-center gap-2 p-3 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tìm địa chỉ...
            </div>
          ) : searchError ? (
            <p className="p-3 text-xs text-red-600">
              {searchError}
            </p>
          ) : suggestions.length === 0 ? (
            <p className="p-3 text-xs text-slate-500">
              Không tìm thấy địa điểm phù hợp.
            </p>
          ) : (
            suggestions.map((place, index) => (
              <button
                key={`${field}-${place.latitude}-${place.longitude}-${index}`}
                type="button"
                onClick={() =>
                  handleSelectPlace(field, place)
                }
                className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2.5 text-left text-xs text-slate-700 transition hover:bg-blue-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span className="break-words">
                  {place.name}
                </span>
              </button>
            ))
          )}
        </div>
      );
    };
    let mapRiskLevel: 0 | 1 | 2 | null = null;
    if (
      predictionData &&
      predictionData.depth_m !== null
    ) {
      if (predictionData.depth_m >= 0.3) {
        mapRiskLevel = 2;
      } else if (predictionData.depth_m > 0.05) {
        mapRiskLevel = 1;
      } else {
        mapRiskLevel = 0;
      }
    }
    return (
      <div className="w-full space-y-4 py-4">
        {/* Dashboard ba cot */}
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* TIM DUONG A-B LUON HIEN THI */}
          <aside className="order-1 min-w-0">
<section className="overflow-visible rounded-[24px] border border-[#d9e4e1] bg-white shadow-[0_10px_30px_rgba(19,58,69,0.06)] dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 rounded-t-[24px] border-b border-[#e2e9e5] bg-[#f5f8f5] px-5 py-4 dark:border-slate-800 dark:bg-slate-800">
                <Route className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tìm đường & cảnh báo ngập
                </h2>
              </div>
              <div className="space-y-3 p-4">
                {/* Diem xuat phat */}
                <div>
                  <label
                    htmlFor="flood-origin"
                    className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Điểm xuất phát
                  </label>
                  <div className="relative">
                    <Navigation className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-emerald-600" />
                    <input
                      id="flood-origin"
                      type="text"
                      value={origin}
                      onChange={(event) =>
                        handleInputChange(
                          'origin',
                          event.target.value,
                        )
                      }
                      onFocus={() =>
                        setActiveSearch('origin')
                      }
                      placeholder="Nhập địa chỉ xuất phát..."
                      autoComplete="off"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    {renderSuggestions('origin')}
                  </div>
                  {originPlace && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Đã chọn địa điểm
                    </p>
                  )}
                </div>
                {/* Doi vi tri */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    title="Đổi điểm xuất phát và điểm đến"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <ArrowDownUp className="h-4 w-4" />
                  </button>
                </div>
                {/* Diem den */}
                <div>
                  <label
                    htmlFor="flood-destination"
                    className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Điểm đến
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-red-500" />
                    <input
                      id="flood-destination"
                      type="text"
                      value={destination}
                      onChange={(event) =>
                        handleInputChange(
                          'destination',
                          event.target.value,
                        )
                      }
                      onFocus={() =>
                        setActiveSearch('destination')
                      }
                      placeholder="Bạn muốn đi đến đâu?"
                      autoComplete="off"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    {renderSuggestions('destination')}
                  </div>
                  {destinationPlace && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Đã chọn địa điểm
                    </p>
                  )}
                </div>
                {/* Phuong tien */}
                <div>
                  <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phương tiện di chuyển
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTravelMode('driving');
                        routeRequestId.current += 1;
                        setRouteData(null);
                        setRouteFloodData(null);
                        setRouteFloodError('');
                        setIsAnalyzingRouteFlood(false);
                        setIsRouting(false);
                      }}
                      className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${travelMode === 'driving'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
                        }`}
                    >
                      Xe cơ giới
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTravelMode('walking');
                        routeRequestId.current += 1;
                        setRouteData(null);
                        setRouteFloodData(null);
                        setRouteFloodError('');
                        setIsAnalyzingRouteFlood(false);
                        setIsRouting(false);
                      }}
                      className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${travelMode === 'walking'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
                        }`}
                    >
                      Đi bộ
                    </button>
                  </div>
                </div>
                {/* Tim tuyen duong */}
                <button
                  type="button"
                  onClick={handleFindRoute}
                  disabled={isRouting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173a45] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#285b65] disabled:cursor-wait disabled:opacity-60"
                >
                  {isRouting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Route className="h-4 w-4" />
                  )}
                  {isRouting
                    ? 'Đang tìm tuyến đường...'
                    : 'Tìm tuyến đường'}
                </button>
                {routeError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{routeError}</span>
                  </div>
                )}
                {/* ROUTE_SUMMARY_V2: ket qua hien ngay tai noi tim duong */}
                {routeData && (
                  <section aria-live="polite" className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Đã tìm thấy tuyến đường</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-blue-50 p-2"><div className="text-[10px] text-slate-500">Quãng đường</div><div className="text-lg font-bold text-blue-700">{routeData.distance_km !== null ? `${routeData.distance_km} km` : 'Chưa có'}</div></div>
                      <div className="rounded-lg bg-white p-2"><div className="text-[10px] text-slate-500">Thời gian</div><div className="text-lg font-bold text-slate-900">{routeData.duration_minutes !== null ? `${routeData.duration_minutes} phút` : 'Chưa có'}</div></div>
                    </div>
                    {isAnalyzingRouteFlood ? (
                      <p className="flex items-center gap-2 text-xs text-blue-700"><Loader2 className="h-4 w-4 animate-spin" />Đang phân tích ngập dọc tuyến…</p>
                    ) : visibleRouteFloodData ? (
                      <div className="space-y-1 rounded-lg bg-white p-2 text-xs">
                        <p className="font-bold text-slate-800">Ngập mô phỏng · kịch bản {visibleRouteFloodData.return_period_years} năm</p>
                        <div className="flex justify-between gap-2"><span>Độ sâu lớn nhất</span><strong>{visibleRouteFloodData.max_depth_m === null ? 'Không có dữ liệu' : `${visibleRouteFloodData.max_depth_m.toFixed(3)} m`}</strong></div>
                        <div className="flex justify-between gap-2"><span>Điểm từ 0,30 m</span><strong className="text-rose-600">{visibleRouteFloodData.above_threshold_samples}</strong></div>
                        <div className="flex justify-between gap-2"><span>Dữ liệu hợp lệ</span><strong>{visibleRouteFloodData.valid_samples}/{visibleRouteFloodData.total_samples} ({visibleRouteFloodData.coverage_percent}%)</strong></div>
                        {(visibleRouteFloodData.outside_raster_samples > 0 || visibleRouteFloodData.nodata_samples > 0) && <p className="rounded-md bg-amber-50 p-2 text-amber-800">Thiếu dữ liệu: {visibleRouteFloodData.outside_raster_samples} điểm ngoài raster và {visibleRouteFloodData.nodata_samples} điểm NoData. Không thể đánh giá đầy đủ toàn tuyến.</p>}
                        <p className="text-[10px] text-slate-500">Dữ liệu mô phỏng, không phải cảnh báo thời gian thực; không xác nhận tuyến an toàn.</p>
                      </div>
                    ) : <p className="text-xs text-amber-700">{routeFloodError ? `Chưa phân tích được ngập: ${routeFloodError}` : 'Chưa có kết quả phân tích ngập cho kịch bản này.'}</p>}
                    <button type="button" onClick={() => { const el = document.getElementById('flood-advanced-details') as HTMLDetailsElement | null; if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }} className="text-xs font-semibold text-blue-700 underline">Xem phân tích chi tiết</button>
                  </section>
                )}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                  Chọn địa điểm từ danh sách gợi ý để tìm tuyến đường.
                  Kết quả phân tích ngập mô phỏng sẽ hiện ngay tại đây sau khi tìm thành công.
                </div>
              </div>
            </section>
            <FloodLeftCards showOverview={false} />
        {/* Luu y khoa hoc */}
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20">
          <button
            type="button"
            onClick={() =>
              setShowScientificNotice(!showScientificNotice)
            }
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-amber-600" />
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Lưu ý khoa học và giới hạn dữ liệu
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-amber-600 transition-transform ${showScientificNotice ? 'rotate-180' : ''
                }`}
            />
          </button>
          {showScientificNotice ? (
            <div className="border-t border-amber-200 px-3 pb-3 pt-2 dark:border-amber-900">
              <ScientificNotice compact={true} />
            </div>
          ) : (
            <p className="px-4 pb-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              Độ sâu ngập được mô phỏng theo kịch bản.
              Ngưỡng 0,30 m là ngưỡng cảnh báo thử nghiệm,
              không phải dữ liệu ngập thời gian thực.
            </p>
          )}
        </div>

          </aside>
          {/* COT GIUA: BAN DO */}
          <main className="order-2 min-w-0">
            <div className="overflow-visible rounded-[26px] border border-[#d9e4e1] bg-white shadow-[0_14px_45px_rgba(19,58,69,0.08)] dark:border-[#34515b] dark:bg-[#102b36]">
              <div className="relative overflow-hidden rounded-t-[26px] border-b border-[#e2e9e5] bg-gradient-to-r from-[#f5f8f5] via-white to-[#edf4f2] px-5 py-5 sm:px-7 dark:border-[#34515b] dark:from-[#143541] dark:via-[#102b36] dark:to-[#173d46]">
                <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border border-[#d6e5df]/70 dark:border-white/10" />
                <div className="pointer-events-none absolute -right-2 -top-8 h-28 w-28 rounded-full border border-[#d6e5df]/70 dark:border-white/10" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#173a45] text-[#f3d6a5] shadow-md">
                      <Map className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9b7a4e] dark:text-[#e6c494]">KHÁM PHÁ CẦN THƠ</p>
                      <h1 className="text-lg font-extrabold tracking-tight text-[#173a45] sm:text-xl dark:text-white">Bản đồ ngập lụt Cần Thơ</h1>
                      <p className="mt-1 text-xs leading-relaxed text-[#60777b] dark:text-[#b8ced0]">Khám phá Cần Thơ qua các kịch bản ngập mô phỏng.</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#e4d5bd] bg-[#fff9ee] px-4 py-2 text-xs font-bold text-[#886234] dark:border-[#7a6248] dark:bg-[#3a332d] dark:text-[#f2d5a8]">
                    <span className="h-2 w-2 rounded-full bg-[#c69c5d]" />
                    Kịch bản {selectedPeriod} năm
                  </span>
                </div>
              </div>
              <MapView
                routeData={routeData}
                selectedCoordinates={coordinates}
                onSelectCoordinates={handleSelectCoordinates}
                selectedPeriod={selectedPeriod}
                onOpenSettings={onOpenSettings}
                riskLevel={mapRiskLevel}
                simulatedDepth={
                  predictionData
                    ? predictionData.depth_m
                    : null
                }
              />
            </div>
            <p className="mt-2 px-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Các điểm màu vàng và đỏ được lấy mẫu từ
              dữ liệu raster ngập mô phỏng. Không phải
              các điểm quan trắc ngập thực tế.
            </p>
          {/* VISIBLE_FEATURE_CARDS_V2: 3 cong cu luon hien thi */}
          <section className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3" aria-label="Các chức năng chính">
            <div className="rounded-[22px] border border-[#d9e4e1] bg-white p-5 shadow-[0_8px_28px_rgba(19,58,69,0.05)]">
              <h2 className="mb-2 text-sm font-bold text-slate-900">Bản đồ tổng quan</h2>
              <MiniStudyMap />
              <p className="mt-2 text-[11px] text-slate-500">Phạm vi nghiên cứu Cần Thơ, kịch bản ngập mô phỏng.</p>
            </div>
                        {/* FEATURE_CARDS_ENHANCED_V3 */}
            <div className="flex flex-col rounded-[22px] border border-[#d9e4e1] bg-white p-5 shadow-[0_8px_28px_rgba(19,58,69,0.05)]">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-lg">🧠</span>
                <div>
                  <h2 className="text-sm font-bold text-indigo-800">Phân tích ML và công cụ nâng cao</h2>
                  <p className="text-[11px] text-slate-500">Phân tích dữ liệu ngập mô phỏng</p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Khám phá độ sâu ngập tại điểm chọn và đánh giá rủi ro tuyến đường.
              </p>

              <div className="mt-3 space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="text-base">🌊</span>
                  <span>Dự đoán độ sâu ngập mô phỏng</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="text-base">🛣️</span>
                  <span>Đánh giá rủi ro tuyến đường</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="text-base">📊</span>
                  <span>Phân tích kết quả và dữ liệu</span>
                </div>
              </div>

              <div className="flex-1" />

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('flood-advanced-details') as HTMLDetailsElement | null;
                  if (el) {
                    el.open = true;
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="mt-3 rounded-xl bg-[#173a45] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#285b65]"
              >
                Mở công cụ phân tích →
              </button>
            </div>

            <div className="flex flex-col rounded-[22px] border border-[#d9e4e1] bg-white p-5 shadow-[0_8px_28px_rgba(19,58,69,0.05)]">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg">📖</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Giới thiệu &amp; Hướng dẫn sử dụng</h2>
                  <p className="text-[11px] text-slate-500">Bắt đầu với 3 bước đơn giản</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">01</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Chọn điểm A và B</div>
                    <p className="text-[11px] leading-relaxed text-slate-500">Nhập địa điểm hoặc chọn trên bản đồ.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">02</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Tìm tuyến đường</div>
                    <p className="text-[11px] leading-relaxed text-slate-500">Xem tuyến và thông tin ngập mô phỏng.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">03</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Khám phá công cụ</div>
                    <p className="text-[11px] leading-relaxed text-slate-500">Dùng bộ lọc, chú giải và phân tích ML.</p>
                  </div>
                </div>
              </div>

              <div className="flex-1" />

              <p className="mt-3 rounded-lg bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-800">
                Kịch bản 100 năm là dữ liệu mô phỏng, không phải cảnh báo ngập thời gian thực.
              </p>
            </div>
          </section>
          </main>
          {/* BANG CONG CU: TIM DUONG VA PHAN TICH */}
          <details id="flood-advanced-details" className="order-4 col-span-1 min-w-0 xl:col-span-2">
            <summary className="cursor-pointer rounded-[20px] border border-[#d9e4e1] bg-[#f5f8f5] px-5 py-4 text-sm font-bold text-[#173a45] shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              Công cụ nâng cao · Phân tích tuyến đường và ML
            </summary>
            <aside className="mt-3 min-w-0 space-y-4">
          {/* KICH BAN VA CHU GIAI */}
          <div className="min-w-0 space-y-4">
            {/* Chon kich ban */}
            <section className="min-w-0">
              <ScenarioSelector
                selectedPeriod={selectedPeriod}
                onSelectPeriod={handleSelectPeriod}
              />
            </section>
            {/* Chu giai */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chú giải bản đồ
                </h2>
              </div>
              <MapLegend />
            </section>
          </div>

            {/* Ket qua dinh tuyen */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <Route className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Phân tích tuyến đường
                </h2>
              </div>
              {routeData ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Đã tìm thấy tuyến đường
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
                      <p className="text-[11px] text-slate-500">
                        Quãng đường
                      </p>
                      <p className="mt-1 text-lg font-bold text-blue-700 dark:text-blue-300">
                        {routeData.distance_km !== null
                          ? `${routeData.distance_km} km`
                          : 'Chưa có'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="text-[11px] text-slate-500">
                        Thời gian
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {routeData.duration_minutes !== null
                          ? `${routeData.duration_minutes} phút`
                          : 'Chưa có'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phương tiện:{' '}
                    {routeData.mode === 'drive'
                      ? 'Xe cơ giới'
                      : 'Đi bộ'}
                  </p>
                  {isAnalyzingRouteFlood ? (
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang phân tích độ sâu ngập dọc tuyến...
                    </div>
                  ) : visibleRouteFloodData ? (
                    <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Kết quả ngập mô phỏng - kịch bản{' '}
                        {visibleRouteFloodData.return_period_years} năm
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                          <p className="text-[11px] text-slate-500">
                            Độ sâu ngập lớn nhất
                          </p>
                          <p className="text-base font-bold text-slate-900 dark:text-white">
                            {visibleRouteFloodData.max_depth_m !== null
                              ? `${visibleRouteFloodData.max_depth_m.toFixed(3)} m`
                              : 'Không có dữ liệu'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/20">
                          <p className="text-[11px] text-slate-500">
                            Điểm đạt ngưỡng 0,30 m
                          </p>
                          <p className="text-base font-bold text-amber-700 dark:text-amber-300">
                            {visibleRouteFloodData.above_threshold_samples}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Dữ liệu hợp lệ: {visibleRouteFloodData.valid_samples}/
                        {visibleRouteFloodData.total_samples} điểm
                        {' '}({visibleRouteFloodData.coverage_percent}%).
                      </p>
                      {(visibleRouteFloodData.outside_raster_samples > 0 ||
                        visibleRouteFloodData.nodata_samples > 0) && (
                          <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                            Thiếu dữ liệu: {visibleRouteFloodData.outside_raster_samples} điểm
                            ngoài phạm vi raster và{' '}
                            {visibleRouteFloodData.nodata_samples} điểm NoData.
                            Không thể đánh giá đầy đủ toàn tuyến.
                          </div>
                        )}
                      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        Dữ liệu ngập mô phỏng theo kịch bản, không phải dự báo
                        thời gian thực. Ngưỡng 0,30 m chỉ dùng thử nghiệm.
                        Không xác nhận tuyến đường an toàn.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                      {routeFloodError
                        ? `Chưa phân tích được ngập: ${routeFloodError}`
                        : 'Chưa có kết quả phân tích ngập cho kịch bản đang chọn.'}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Nhập điểm xuất phát, điểm đến và
                    chọn phương tiện để tính tuyến đường.
                  </p>
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center dark:border-slate-700 dark:bg-slate-800/50">
                    <Route className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chưa có tuyến đường được tính toán
                    </span>
                  </div>
                </>
              )}
            </section>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onAnalyzeWithMl(coordinates, selectedPeriod)}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Phân tích điểm này bằng ML
              </button>
              <LocationInspector
                coordinates={coordinates}
                period={selectedPeriod}
                predictionData={predictionData}
                isBackendConnected={isBackendConnected}
                isLoading={isLoading}
                onRefreshPrediction={() =>
                  fetchPrediction(
                    coordinates,
                    selectedPeriod,
                  )
                }
                onSelectLandmark={handleSelectCoordinates}
                onOpenSettings={onOpenSettings}
                isMixedContentBlocked={isMixedContent}
              />
            </div>
            </aside>
          </details>
        </div>
      </div>
    );
  };




