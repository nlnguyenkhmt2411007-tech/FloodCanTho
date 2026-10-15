import React, { useEffect, useState } from 'react';
import {
  Cpu, Database, BarChart3, AlertTriangle,
  MapPin, Play, Loader2, CheckCircle2
} from 'lucide-react';
import {
  requestMlPrediction,
  requestFloodPrediction,
  type MlPredictionResponse,
} from '../services/floodApi';
import type {
  FloodPredictionResponse,
  ReturnPeriod,
  Coordinates,
} from '../types/flood';

const PERIODS: ReturnPeriod[] = [2, 5, 10, 20, 50, 100];

interface MlAnalysisViewProps {
  mapSelection?: {
    coordinates: Coordinates;
    period: ReturnPeriod;
  } | null;
}

export const MlAnalysisView: React.FC<MlAnalysisViewProps> = ({
  mapSelection,
}) => {
  const [latitude, setLatitude] = useState('10.046501697287116');
  const [longitude, setLongitude] = useState('105.75050686863982');
  const [period, setPeriod] = useState<ReturnPeriod>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mlResult, setMlResult] = useState<MlPredictionResponse | null>(null);
  const [rasterResult, setRasterResult] =
    useState<FloodPredictionResponse | null>(null);
  const [rasterError, setRasterError] = useState('');

  useEffect(() => {
    if (!mapSelection) return;

    setLatitude(String(mapSelection.coordinates.lat));
    setLongitude(String(mapSelection.coordinates.lng));
    setPeriod(mapSelection.period);
    setMlResult(null);
    setRasterResult(null);
    setError('');
    setRasterError('');
  }, [mapSelection]);

  async function runPrediction() {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 || lat > 90 ||
      lon < -180 || lon > 180
    ) {
      setError('Vui lòng nhập tọa độ hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');
    setRasterError('');
    setMlResult(null);
    setRasterResult(null);

    const request = {
      latitude: lat,
      longitude: lon,
      return_period_years: period,
    };

    try {
      const [ml, raster] = await Promise.all([
        requestMlPrediction(request),
        requestFloodPrediction(request),
      ]);

      if (ml.data?.status === 'success') {
        setMlResult(ml.data);
      } else {
        setError(
          ml.errorMessage ||
          ml.data?.message ||
          'Không nhận được kết quả Machine Learning.'
        );
      }

      if (raster.data?.status === 'success') {
        setRasterResult(raster.data);
      } else {
        setRasterError(
          raster.errorMessage ||
          raster.data?.message ||
          'Không có kết quả raster tại vị trí này.'
        );
      }
    } catch {
      setError('Có lỗi khi thực hiện phân tích.');
    } finally {
      setLoading(false);
    }
  }

  const probability = mlResult?.ml_probability;
  const depth = rasterResult?.depth_m;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      <header className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider">
          <Cpu className="w-4 h-4" />
          Machine Learning · FloodCanTho
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
          Phân tích nguy cơ ngập bằng Random Forest
        </h1>
        <p className="mt-3 text-sm text-blue-100 leading-relaxed">
          Mô hình phân loại nhị phân Random Forest v2, học từ
          dữ liệu độ sâu ngập raster mô phỏng theo các chu kỳ lặp lại.
          Đây là nghiên cứu thử nghiệm, không phải dự báo thời gian thực.
        </p>
      </header>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-lg">Thử nghiệm mô hình ML v2</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Vĩ độ (Latitude)</span>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={e => setLatitude(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Kinh độ (Longitude)</span>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={e => setLongitude(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Chu kỳ lặp lại</span>
            <select
              value={period}
              onChange={e => setPeriod(Number(e.target.value) as ReturnPeriod)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"
            >
              {PERIODS.map(value => (
                <option key={value} value={value}>
                  {value} năm
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={runPrediction}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-3 transition"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Play className="w-4 h-4" />}
          {loading ? 'Đang phân tích...' : 'Chạy Machine Learning'}
        </button>

        {error && (
          <div role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {mlResult && (
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Mô hình Random Forest v2 đã phản hồi
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 p-5">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Điểm xác suất lớp ngập ≥ 0,30 m
                </p>
                <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-2">
                  {probability !== null && probability !== undefined
                    ? `${(probability * 100).toFixed(2)}%`
                    : 'Không có dữ liệu'}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Điểm xác suất của mô hình, chưa được kiểm định hiệu chuẩn
                  thành xác suất ngập ngoài thực tế.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-5">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Phân loại ML (ngưỡng 50%)
                </p>
                <p className="text-xl font-bold mt-2">
                  {mlResult.ml_prediction === 1
                    ? 'Vượt ngưỡng ngập 0,30 m'
                    : 'Dưới ngưỡng ngập 0,30 m'}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Kết quả ước lượng từ mô hình, không phải độ sâu đo thực tế.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                Đối chiếu với raster mô phỏng
              </h3>
              {rasterResult && depth !== null && depth !== undefined ? (
                <div className="space-y-2 text-sm">
                  <p>
                    Độ sâu raster:
                    <strong className="ml-2">{depth.toFixed(3)} m</strong>
                  </p>
                  <p>
                    Phân loại theo raster:
                    <strong className="ml-2">
                      {depth >= 0.3
                        ? 'Đạt hoặc vượt 0,30 m'
                        : 'Dưới 0,30 m'}
                    </strong>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {Number(mlResult.ml_prediction === 1) === Number(depth >= 0.3)
                      ? 'Hai phương pháp cho cùng nhãn phân loại tại điểm này.'
                      : 'Hai phương pháp cho nhãn khác nhau tại điểm này.'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {rasterError || 'Chưa có dữ liệu raster để đối chiếu.'}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Kết quả kiểm thử Random Forest v2
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Mẫu kiểm thử', '60.000'],
            ['Precision', '16,50%'],
            ['Recall', '47,82%'],
            ['F1-score', '24,53%'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tập test có 964 mẫu đạt ngưỡng ngập trong 60.000 mẫu.
          Mô hình phát hiện đúng 461 mẫu, bỏ sót 503 mẫu và báo nhầm
          2.333 mẫu. Accuracy đạt 95,27%, nhưng cần thận trọng vì
          dữ liệu mất cân bằng nghiêm trọng.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-5 space-y-2">
        <h2 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Giới hạn nghiên cứu
        </h2>
        <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
          Mô hình học từ raster ngập mô phỏng, không sử dụng dữ liệu
          mưa, mực nước hay quan trắc thời gian thực. Kết quả chỉ phục vụ
          nghiên cứu và đối chiếu thuật toán, không dùng để quyết định
          an toàn giao thông hoặc thay thế cảnh báo chính thức.
        </p>
      </section>
    </div>
  );
};
