import React from 'react';
import {
  Coordinates,
  ReturnPeriod,
  FloodPredictionResponse,
  formatFloodRiskLabel,
} from '../types/flood';
import { isCoordinateInBounds, CAN_THO_LANDMARKS } from '../data/landmarks';
import {
  Compass,
  AlertCircle,
  RefreshCw,
  Settings2,
  Database,
  Layers,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { getApiBaseUrl } from '../services/floodApi';

interface LocationInspectorProps {
  coordinates: Coordinates;
  period: ReturnPeriod;
  predictionData: FloodPredictionResponse | null;
  isBackendConnected: boolean;
  isLoading: boolean;
  onRefreshPrediction: () => void;
  onSelectLandmark: (coords: Coordinates) => void;
  onOpenSettings: () => void;
  isMixedContentBlocked?: boolean;
}

export const LocationInspector: React.FC<LocationInspectorProps> = ({
  coordinates,
  period,
  predictionData,
  isBackendConnected,
  isLoading,
  onRefreshPrediction,
  onSelectLandmark,
  onOpenSettings,
  isMixedContentBlocked = false,
}) => {
  const inArea = isCoordinateInBounds(coordinates.lat, coordinates.lng);
  const currentBaseUrl = getApiBaseUrl();

  // Khi có dữ liệu thật từ API
  const riskInfo = predictionData
    ? formatFloodRiskLabel(
        predictionData.status,
        predictionData.flood_risk,
        predictionData.depth_m
      )
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Thông tin vị trí & Nguy cơ ngập
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Điểm quan trắc trên bản đồ Cần Thơ
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefreshPrediction}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Truy vấn lại API cho tọa độ này"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Coordinates Display */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 block text-[11px]">Vĩ độ (Latitude)</span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {coordinates.lat.toFixed(6)}° N
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Kinh độ (Longitude)</span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {coordinates.lng.toFixed(6)}° E
          </span>
        </div>
      </div>

      {/* Scope Status */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Phạm vi raster nghiên cứu:</span>
        <span
          className={`font-medium ${
            inArea
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {inArea ? '✓ Nằm trong vùng thí điểm CTUT' : '⚠ Nằm ngoài phạm vi raster'}
        </span>
      </div>

      {/* Trạng thái dữ liệu */}
      {!isBackendConnected ? (
        // TRẠNG THÁI: Chưa kết nối dữ liệu thực (Trung thực tuyệt đối)
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Chưa kết nối dữ liệu thực
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  GET /api/health chưa sẵn sàng
                </span>
              </div>

              {isMixedContentBlocked ? (
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong>Lưu ý môi trường Preview:</strong> Web app đang chạy trên máy chủ đám mây HTTPS, còn FastAPI đang chạy trên máy local tại{' '}
                  <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">{currentBaseUrl}</code>.
                  Trình duyệt chặn kết nối trực tiếp do chính sách bảo mật Mixed Content &amp; Private Network Access.
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hệ thống không tạo kết quả ngập giả mạo. Khi backend FastAPI phản hồi trạng thái{' '}
                  <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">status: "ready"</code>,
                  hệ thống sẽ tự động gọi <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">POST /api/predict</code> để lấy độ sâu ngập mô phỏng.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Cấu hình URL Backend &amp; Kiểm tra
            </button>
            <span className="text-[11px] text-slate-400">
              Mặc định: 127.0.0.1:8000
            </span>
          </div>
        </div>
      ) : (
        // TRẠNG THÁI: ĐÃ KẾT NỐI API THỰC TẾ
        <div className="space-y-3">
          {predictionData && riskInfo ? (
            <>
              {/* Depth & Risk Level */}
              <div className="grid grid-cols-2 gap-2">
                {/* Độ sâu mô phỏng từ raster */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Độ sâu mô phỏng (depth_m)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    {predictionData.depth_m !== null ? (
                      <>
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                          {predictionData.depth_m.toFixed(4)}
                        </span>
                        <span className="text-xs text-slate-500">mét</span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-slate-400 font-mono">
                        Không có dữ liệu
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Chu kỳ T = {predictionData.return_period_years} năm
                  </span>
                </div>

                {/* Mức nguy cơ theo ngưỡng 0.30m */}
                <div className={`p-3 rounded-xl border ${riskInfo.badgeBg}`}>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Đánh giá nguy cơ (Ngưỡng 0,30m)
                  </span>
                  <div className={`text-xs font-bold mt-1 ${riskInfo.colorClass} leading-tight`}>
                    {riskInfo.label}
                  </div>
                  <span className="text-[10px] opacity-80 block mt-1 font-mono text-slate-500">
                    Mã API: {predictionData.flood_risk || predictionData.status}
                  </span>
                </div>
              </div>

              {/* Chi tiết phản hồi thực tế từ backend */}
              <div className="text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] border-b border-slate-200/50 dark:border-slate-700/50 pb-1.5">
                  <span className="text-slate-500">Trạng thái API:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                    {predictionData.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Nguồn dữ liệu:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {predictionData.data_source || 'simulated_raster'}
                  </span>
                </div>

                {predictionData.message && (
                  <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Ghi chú từ backend: </span>
                    <span>{predictionData.message}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Đang chờ dữ liệu dự đoán từ API...</span>
              <button
                onClick={onRefreshPrediction}
                className="text-blue-600 dark:text-blue-400 font-semibold underline"
              >
                Gửi truy vấn
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tọa độ kiểm thử nhanh */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
          Tọa độ kiểm thử nhanh (Cần Thơ):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CAN_THO_LANDMARKS.slice(0, 4).map((lm) => (
            <button
              key={lm.id}
              onClick={() => onSelectLandmark({ lat: lm.lat, lng: lm.lng })}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title={lm.notes}
            >
              {lm.name}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
          Kịch bản ngập mô phỏng theo chu kỳ lặp lại T năm; kết quả độ sâu tại vị trí được chọn sẽ được cung cấp sau khi kết nối API Python.
        </p>
      </div>
    </div>
  );
};
