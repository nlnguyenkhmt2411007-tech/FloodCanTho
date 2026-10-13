import React, { useState } from 'react';
import {
  X,
  Server,
  Activity,
  Check,
  AlertCircle,
  RefreshCw,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  checkBackendHealth,
  DEFAULT_API_URL,
  isMixedContentScenario,
} from '../services/floodApi';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: (connected: boolean) => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
  onConnectionChange,
}) => {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    details?: any;
    isMixedContentBlocked?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const isCurrentMixed = isMixedContentScenario(urlInput);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Lưu tạm thời để test URL mới
    setApiBaseUrl(urlInput);
    const res = await checkBackendHealth();

    setIsTesting(false);
    setTestResult({
      tested: true,
      success: res.connected,
      message: res.message,
      details: res.statusDetails,
      isMixedContentBlocked: res.isMixedContentBlocked,
    });
    onConnectionChange(res.connected);
  };

  const handleSave = () => {
    setApiBaseUrl(urlInput);
    onClose();
  };

  const handleResetDefault = () => {
    setUrlInput(DEFAULT_API_URL);
    setApiBaseUrl(DEFAULT_API_URL);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Cấu hình Python FastAPI Backend
              </h3>
              <p className="text-xs text-slate-500">
                Kết nối máy chủ trích xuất raster độ sâu ngập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Input */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Địa chỉ Base URL Backend:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Khôi phục mặc định"
              >
                Mặc định
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Địa chỉ máy chủ FastAPI (mặc định: <code className="font-mono">http://127.0.0.1:8000</code>).
            </p>
          </div>

          {/* Cảnh báo môi trường Preview HTTPS vs Localhost */}
          {isCurrentMixed && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Lưu ý về môi trường AI Studio Preview:</span>
              </div>
              <p className="leading-relaxed">
                Ứng dụng Preview đang chạy trên máy chủ đám mây <strong>HTTPS</strong>. Các trình duyệt hiện đại (Chrome/Edge/Firefox) áp dụng chính sách <em>Mixed Content &amp; Private Network Access</em>, tự động chặn yêu cầu từ trang web HTTPS xuống máy local <code className="font-mono bg-amber-500/10 px-1 rounded">http://127.0.0.1:8000</code>.
              </p>
              <div className="pt-1 border-t border-amber-500/20 font-medium">
                👉 <strong>Cách kiểm thử kết nối:</strong>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5 opacity-90">
                  <li><strong>Cách 1:</strong> Chạy frontend và backend trên cùng máy local (<code className="font-mono">npm run dev</code> tại port 3000 kết nối tới 127.0.0.1:8000).</li>
                  <li><strong>Cách 2:</strong> Mở tunnel HTTPS cho FastAPI bằng ngrok: <code className="font-mono">ngrok http 8000</code>, sau đó dán URL HTTPS vào ô trên.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Test connection action */}
          <div>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !urlInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang kiểm tra kết nối...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Kiểm tra kết nối thực tế (GET /api/health)</span>
                </>
              )}
            </button>
          </div>

          {/* Test result status feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {testResult.success ? 'Kết nối thành công tới FastAPI backend!' : 'Chưa thể kết nối'}
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-90 mt-0.5">
                    {testResult.message}
                  </p>
                </div>
              </div>

              {/* Chi tiết phản hồi thực tế từ backend */}
              {testResult.details && (
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1">
                  <span className="font-mono font-semibold block">
                    Response GET /api/health:
                  </span>
                  <pre className="p-2 rounded bg-black/5 dark:bg-black/30 font-mono text-[10px] overflow-x-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
