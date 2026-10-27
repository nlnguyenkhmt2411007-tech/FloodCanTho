
import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  Info,
  Layers3,
  Loader2,
  MapPin,
  Play,
  RefreshCw,
  ShieldCheck,
  Waves,
} from 'lucide-react';
import { MapView } from './MapView';
import {
  requestMlPrediction,
  requestFloodPrediction,
  type MlPredictionResponse,
} from '../services/floodApi';
import type {
  Coordinates,
  FloodPredictionResponse,
  ReturnPeriod,
} from '../types/flood';

type MlModelName =
  | 'random_forest_v2'
  | 'decision_tree'
  | 'extra_trees';

type ComparisonRow = {
  model: MlModelName;
  result: MlPredictionResponse | null;
  error: string;
};

interface MlAnalysisViewProps {
  mapSelection?: {
    coordinates: Coordinates;
    period: ReturnPeriod;
  } | null;
}

const PERIODS: ReturnPeriod[] = [2, 5, 10, 20, 50, 100];

const MODELS: {
  value: MlModelName;
  label: string;
  short: string;
}[] = [
  {
    value: 'random_forest_v2',
    label: 'Random Forest v2',
    short: 'RF',
  },
  {
    value: 'decision_tree',
    label: 'Decision Tree',
    short: 'DT',
  },
  {
    value: 'extra_trees',
    label: 'Extra Trees',
    short: 'ET',
  },
];

const METRICS = [
  {
    model: 'Random Forest v2',
    precision: 16.5,
    recall: 47.82,
    f1: 24.53,
    balanced: 71.93,
  },
  {
    model: 'Decision Tree',
    precision: 18.31,
    recall: 53.42,
    f1: 27.28,
    balanced: 74.77,
  },
  {
    model: 'Extra Trees',
    precision: 10.41,
    recall: 51.04,
    f1: 17.29,
    balanced: 71.93,
  },
];

const formatPercent = (value: number) =>
  `${(value * 100).toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

const formatMetric = (value: number) =>
  `${value.toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

const modelLabel = (name: MlModelName) =>
  MODELS.find(model => model.value === name)?.label ?? name;

/**
 * Backend localhost trả về:
 * random_forest_v2, decision_tree, extra_trees.
 *
 * Backend Render cũ trả về:
 * random_forest_classifier_v2.
 *
 * Chỉ chấp nhận tên cũ cho Random Forest.
 * Không dùng kết quả RF để giả làm Decision Tree / Extra Trees.
 */
function isMatchingModel(
  requested: MlModelName,
  actual?: string,
): boolean {
  if (!actual) return false;

  if (requested === 'random_forest_v2') {
    return (
      actual === 'random_forest_v2' ||
      actual === 'random_forest_classifier_v2'
    );
  }

  return actual === requested;
}

const cardClass =
  'rounded-[22px] border border-slate-200/80 ' +
  'bg-white shadow-sm dark:border-slate-800 ' +
  'dark:bg-slate-900';

const inputClass =
  'w-full rounded-xl border border-slate-200 ' +
  'bg-slate-50 px-3 py-3 text-sm font-medium ' +
  'text-slate-800 outline-none transition ' +
  'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 ' +
  'dark:border-slate-700 dark:bg-slate-800 ' +
  'dark:text-slate-100';

export const MlAnalysisView: React.FC<MlAnalysisViewProps> = ({
  mapSelection,
}) => {
  const [latitude, setLatitude] = useState(
    '10.046501697287116',
  );
  const [longitude, setLongitude] = useState(
    '105.75050686863982',
  );
  const [period, setPeriod] = useState<ReturnPeriod>(10);
  const [modelName, setModelName] =
    useState<MlModelName>('random_forest_v2');

  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState('');
  const [rasterError, setRasterError] = useState('');

  const [comparisonRows, setComparisonRows] =
    useState<ComparisonRow[]>([]);

  const [mlResult, setMlResult] =
    useState<MlPredictionResponse | null>(null);

  const [rasterResult, setRasterResult] =
    useState<FloodPredictionResponse | null>(null);

  const requestVersion = useRef(0);

  const clearResults = () => {
    requestVersion.current += 1;
    setLoading(false);
    setHasRun(false);
    setError('');
    setRasterError('');
    setComparisonRows([]);
    setMlResult(null);
    setRasterResult(null);
  };

  const mapCoordinates: Coordinates = {
    lat: Number.isFinite(Number(latitude))
      ? Number(latitude)
      : 10.046501697287116,
    lng: Number.isFinite(Number(longitude))
      ? Number(longitude)
      : 105.75050686863982,
  };

  const handleMapSelection = (coords: Coordinates) => {
    setLatitude(String(coords.lat));
    setLongitude(String(coords.lng));
    clearResults();
  };

  useEffect(() => {
    if (!mapSelection) return;

    setLatitude(String(mapSelection.coordinates.lat));
    setLongitude(String(mapSelection.coordinates.lng));
    setPeriod(mapSelection.period);
    clearResults();
  }, [mapSelection]);

  async function runPrediction() {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      clearResults();
      setError('Vui lòng nhập vĩ độ và kinh độ hợp lệ.');
      return;
    }

    const version = ++requestVersion.current;

    setLoading(true);
    setHasRun(false);
    setError('');
    setRasterError('');
    setComparisonRows([]);
    setMlResult(null);
    setRasterResult(null);

    const request = {
      latitude: lat,
      longitude: lon,
      return_period_years: period,
    };

    try {
      const [modelResponses, rasterResponse] =
        await Promise.all([
          Promise.all(
            MODELS.map(model =>
              requestMlPrediction({
                ...request,
                model_name: model.value,
              }),
            ),
          ),
          requestFloodPrediction(request),
        ]);

      if (version !== requestVersion.current) return;

      const rows: ComparisonRow[] = MODELS.map(
        (model, index) => {
          const response = modelResponses[index];
          const data = response.data;

          const hasPrediction =
            data?.status === 'success' &&
            typeof data.ml_probability === 'number' &&
            Number.isFinite(data.ml_probability) &&
            (data.ml_prediction === 0 ||
              data.ml_prediction === 1);

          const matches =
            hasPrediction &&
            isMatchingModel(model.value, data?.ml_model);

          let rowError = '';

          if (!hasPrediction) {
            rowError =
              response.errorMessage ||
              data?.message ||
              'Không nhận được kết quả ML.';
          } else if (!matches) {
            rowError =
              `Backend trả về "${data?.ml_model ?? 'không rõ'}" ` +
              `thay vì "${model.value}".`;
          }

          return {
            model: model.value,
            result: matches && data ? data : null,
            error: rowError,
          };
        },
      );

      setComparisonRows(rows);

      const selectedRow = rows.find(
        row => row.model === modelName,
      );

      if (selectedRow?.result) {
        setMlResult(selectedRow.result);
      } else {
        setError(
          selectedRow?.error ||
          'Mô hình được chọn chưa có kết quả hợp lệ.',
        );
      }

      if (
        rasterResponse.data?.status === 'success'
      ) {
        setRasterResult(rasterResponse.data);
      } else {
        setRasterError(
          rasterResponse.errorMessage ||
          rasterResponse.data?.message ||
          'Không có dữ liệu raster tại vị trí này.',
        );
      }

      setHasRun(true);
    } catch {
      if (version === requestVersion.current) {
        setError('Có lỗi khi thực hiện phân tích ML.');
        setHasRun(true);
      }
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
      }
    }
  }

  const probability = mlResult?.ml_probability;
  const depth = rasterResult?.depth_m;

  const successfulModels = comparisonRows.filter(
    row => row.result !== null,
  ).length;

  const mismatchedModels = comparisonRows.filter(
    row =>
      row.error.includes('Backend trả về'),
  ).length;

  const rasterAvailable =
    typeof depth === 'number' &&
    Number.isFinite(depth);

  const matchesRaster =
    mlResult &&
    rasterAvailable
      ? Number(mlResult.ml_prediction === 1) ===
        Number(depth >= 0.3)
      : null;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5 pb-12 pt-3 text-slate-900 dark:text-slate-100">

      {/* PAGE HEADER */}
      <header className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#102A56] via-[#174684] to-[#1769A6] px-6 py-7 text-white shadow-lg shadow-blue-950/10 sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[45px] border-white/5" />
        <div className="pointer-events-none absolute bottom-[-100px] right-1/4 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
              <Activity className="h-4 w-4" />
              FloodCanTho / ML Analysis
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Phân tích nguy cơ ngập
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Khám phá kết quả mô hình học máy tại từng vị trí,
              đối chiếu với raster ngập mô phỏng và đánh giá
              hiệu quả các thuật toán.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-sm">
              <Database className="h-4 w-4" />
              Dữ liệu mô phỏng
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              Nghiên cứu ML v2
            </span>
          </div>
        </div>
      </header>

      {/* MAP + CONTROL PANEL */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">

        {/* MAP */}
        <section className={`${cardClass} min-w-0 overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <MapPin className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold">
                  Bản đồ vị trí phân tích
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chọn điểm trực tiếp trên bản đồ
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              <Layers3 className="h-3.5 w-3.5" />
              Raster mô phỏng
            </span>
          </div>

          <div className="min-w-0 p-3 sm:p-4">
            <div className="min-w-0 overflow-hidden rounded-2xl">
              <MapView
                selectedCoordinates={mapCoordinates}
                onSelectCoordinates={handleMapSelection}
                selectedPeriod={period}
                simulatedDepth={rasterResult?.depth_m ?? null}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 text-xs dark:border-slate-800 dark:bg-slate-800/30 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">
                {Number(latitude).toFixed(6)},{' '}
                {Number(longitude).toFixed(6)}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <Waves className="h-4 w-4 shrink-0 text-cyan-600" />
              <span className="text-slate-600 dark:text-slate-300">
                Chu kỳ lặp lại: {period} năm
              </span>
            </div>
          </div>
        </section>

        {/* CONTROL */}
        <section className={`${cardClass} min-w-0 overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Cpu className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold">
                  Thiết lập phân tích
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cấu hình và chạy mô hình ML
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <label
                htmlFor="ml-model"
                className="block text-sm font-semibold"
              >
                Thuật toán Machine Learning
              </label>

              <select
                id="ml-model"
                value={modelName}
                disabled={loading}
                onChange={event => {
                  setModelName(
                    event.target.value as MlModelName,
                  );
                  clearResults();
                }}
                className={inputClass}
              >
                {MODELS.map(model => (
                  <option
                    key={model.value}
                    value={model.value}
                  >
                    {model.label}
                  </option>
                ))}
              </select>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mô hình được chọn sẽ hiển thị trong thẻ
                kết quả chính.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-semibold">
                  Vĩ độ
                </span>

                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={event => {
                    setLatitude(event.target.value);
                    clearResults();
                  }}
                  className={inputClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-semibold">
                  Kinh độ
                </span>

                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={event => {
                    setLongitude(event.target.value);
                    clearResults();
                  }}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="ml-period"
                className="block text-sm font-semibold"
              >
                Chu kỳ lặp lại
              </label>

              <select
                id="ml-period"
                value={period}
                onChange={event => {
                  setPeriod(
                    Number(event.target.value) as ReturnPeriod,
                  );
                  clearResults();
                }}
                className={inputClass}
              >
                {PERIODS.map(value => (
                  <option key={value} value={value}>
                    {value} năm
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={runPrediction}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}

              {loading
                ? 'Đang phân tích dữ liệu...'
                : 'Chạy phân tích Machine Learning'}

              {!loading && (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                <p className="text-xs leading-5 text-blue-800 dark:text-blue-200">
                  Hệ thống sử dụng dữ liệu ngập mô phỏng.
                  Điểm ML không phải xác suất ngập
                  thực tế và không phải cảnh báo thời gian thực.
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* RESULTS */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Activity className="h-5 w-5 text-blue-600" />
              Kết quả phân tích
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Kết quả tại vị trí và chu kỳ lặp lại đã chọn
            </p>
          </div>

          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang xử lý
            </span>
          ) : mlResult ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã có kết quả
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Chưa có kết quả
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {!hasRun && !loading && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <RefreshCw className="h-5 w-5 shrink-0 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chọn tọa độ, thuật toán và chu kỳ, sau đó
                nhấn Chạy phân tích để xem kết quả.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-blue-900/30 dark:from-blue-950/30 dark:to-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <Activity className="h-4 w-4" />
                Điểm ML
              </div>

              <p className="mt-4 text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">
                {typeof probability === 'number'
                  ? formatPercent(probability)
                  : '—'}
              </p>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Điểm mô hình chưa hiệu chuẩn
              </p>
            </div>

            <div className={`rounded-2xl border p-5 ${
              mlResult?.ml_prediction === 1
                ? 'border-rose-100 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-950/20'
                : 'border-emerald-100 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4" />
                Phân loại ML
              </div>

              <p className={`mt-4 text-xl font-extrabold ${
                mlResult?.ml_prediction === 1
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}>
                {mlResult
                  ? mlResult.ml_prediction === 1
                    ? 'Vượt ngưỡng'
                    : 'Dưới ngưỡng'
                  : '—'}
              </p>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Ngưỡng độ sâu 0,30 m
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5 dark:border-cyan-900/30 dark:from-cyan-950/20 dark:to-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                <Waves className="h-4 w-4" />
                Độ sâu raster
              </div>

              <p className="mt-4 text-3xl font-extrabold text-cyan-700 dark:text-cyan-300">
                {rasterAvailable
                  ? `${depth.toFixed(3)} m`
                  : '—'}
              </p>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Dữ liệu raster mô phỏng
              </p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 dark:border-violet-900/30 dark:from-violet-950/20 dark:to-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300">
                <Layers3 className="h-4 w-4" />
                Chu kỳ lặp lại
              </div>

              <p className="mt-4 text-3xl font-extrabold text-violet-700 dark:text-violet-300">
                {period} năm
              </p>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Kịch bản ngập mô phỏng
              </p>
            </div>
          </div>

          {hasRun && (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  Mô hình đang xem: {modelLabel(modelName)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Điểm phân loại ML sử dụng ngưỡng 50%.
                </p>
              </div>

              {matchesRaster !== null && (
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                  matchesRaster
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                }`}>
                  {matchesRaster
                    ? 'ML và raster cùng nhãn'
                    : 'ML và raster khác nhãn'}
                </span>
              )}

              {rasterError && (
                <span className="text-xs text-amber-700 dark:text-amber-300">
                  {rasterError}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* DYNAMIC MODEL COMPARISON */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              So sánh dự đoán ba thuật toán
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Kết quả động tại cùng tọa độ và chu kỳ lặp lại
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            {hasRun
              ? `${successfulModels}/3 mô hình hợp lệ`
              : 'Chờ phân tích'}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {hasRun && mismatchedModels > 0 && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    Backend chưa hỗ trợ đầy đủ ba thuật toán
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
                    Một số phản hồi trả về tên mô hình khác
                    với mô hình được yêu cầu. Hệ thống đã ẩn
                    các điểm không hợp lệ để tránh so sánh sai.
                    Cần cập nhật backend Render trước khi
                    sử dụng bảng so sánh đầy đủ.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Thuật toán</th>
                  <th className="px-5 py-4">Điểm ML</th>
                  <th className="px-5 py-4">Phân loại</th>
                  <th className="px-5 py-4">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {MODELS.map(model => {
                  const row = comparisonRows.find(
                    item => item.model === model.value,
                  );

                  const score =
                    row?.result?.ml_probability;

                  const prediction =
                    row?.result?.ml_prediction;

                  const valid =
                    typeof score === 'number';

                  return (
                    <tr
                      key={model.value}
                      className={`border-t border-slate-100 dark:border-slate-800 ${
                        model.value === modelName
                          ? 'bg-blue-50/40 dark:bg-blue-950/10'
                          : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-extrabold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            {model.short}
                          </div>
                          <div>
                            <p className="font-bold">
                              {model.label}
                            </p>
                            {model.value === modelName && (
                              <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-300">
                                Đang được chọn
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {valid ? (
                          <div className="min-w-[130px]">
                            <p className="mb-2 font-bold tabular-nums">
                              {formatPercent(score)}
                            </p>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                              <div
                                className={`h-full rounded-full ${
                                  prediction === 1
                                    ? 'bg-rose-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(100, score * 100),
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            {loading ? 'Đang xử lý...' : '—'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {valid ? (
                          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                            prediction === 1
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}>
                            {prediction === 1
                              ? 'Vượt ngưỡng'
                              : 'Dưới ngưỡng'}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {loading ? (
                          <span className="inline-flex items-center gap-2 text-xs text-blue-600">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Đang chạy
                          </span>
                        ) : valid ? (
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Hợp lệ
                          </span>
                        ) : row?.error ? (
                          <span
                            title={row.error}
                            className="inline-flex max-w-[170px] items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
                          >
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              Chưa hỗ trợ / lỗi API
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Chưa chạy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Điểm ML là đầu ra của từng mô hình, chưa được
            hiệu chuẩn thành xác suất ngập thực tế.
            Bảng chỉ hiển thị kết quả khi backend xác nhận
            đúng mô hình được yêu cầu.
          </p>
        </div>
      </section>

      {/* FIXED MODEL METRICS */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Database className="h-5 w-5 text-indigo-600" />
              Đánh giá hiệu quả mô hình
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Chỉ số cố định trên cùng tập kiểm thử 60.000 mẫu
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Kết quả kiểm thử
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Thuật toán</th>
                  <th className="px-5 py-4">Precision</th>
                  <th className="px-5 py-4">Recall</th>
                  <th className="px-5 py-4">F1-score</th>
                  <th className="px-5 py-4">
                    Balanced Accuracy
                  </th>
                </tr>
              </thead>

              <tbody>
                {METRICS.map(metric => (
                  <tr
                    key={metric.model}
                    className={`border-t border-slate-100 dark:border-slate-800 ${
                      metric.model === 'Decision Tree'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/10'
                        : ''
                    }`}
                  >
                    <td className="px-5 py-4 font-bold">
                      {metric.model}
                      {metric.model === 'Decision Tree' && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          F1 cao nhất
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {formatMetric(metric.precision)}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {formatMetric(metric.recall)}
                    </td>
                    <td className="px-5 py-4 font-bold tabular-nums">
                      {formatMetric(metric.f1)}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {formatMetric(metric.balanced)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm leading-6 text-emerald-800 dark:text-emerald-300">
              <strong>Decision Tree</strong> có F1-score cao nhất
              trong ba mô hình, đạt <strong>27,28%</strong>.
              Đây là kết quả trên tập kiểm thử mô phỏng,
              không phải kết quả thay đổi theo tọa độ.
            </p>
          </div>
        </div>
      </section>

      {/* SCIENTIFIC NOTICE */}
      <section className="rounded-[22px] border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-bold text-amber-900 dark:text-amber-200">
              Lưu ý về giới hạn nghiên cứu
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-900/90 dark:text-amber-100">
              Các mô hình học máy được huấn luyện và đánh giá
              trên dữ liệu raster ngập mô phỏng, không sử dụng
              quan trắc mưa, mực nước hoặc dữ liệu thời gian thực.
              Kết quả chỉ phục vụ mục đích nghiên cứu và so sánh
              thuật toán; không thay thế cảnh báo ngập chính thức
              hoặc dùng để quyết định an toàn giao thông.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
