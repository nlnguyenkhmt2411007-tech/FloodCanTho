import React from 'react';
import {
  Waves,
  MapPin,
  Cpu,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Layers,
  Activity,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { ActiveTab } from './Header';
import { ScientificNotice } from './ScientificNotice';

interface HomeOverviewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-10 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider">
            <Waves className="w-3.5 h-3.5" />
            <span>Nghiên cứu học thuật CTUT · Khoa học Máy tính</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Hệ thống hỗ trợ đánh giá nguy cơ ngập lụt tại Cần Thơ bằng Machine Learning
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            FloodCanTho kết hợp mô hình học máy phân loại đa lớp (Random Forest) với dữ liệu mô phỏng thủy văn 
            theo 6 kịch bản chu kỳ lặp lại (2 – 100 năm), hỗ trợ trực quan hóa nguy cơ ngập tại khu vực nghiên cứu thí điểm thuộc quận Ninh Kiều và Bình Thủy.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('map')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Mở bản đồ tương tác
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('ml')}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              Xem phân tích thuật toán ML
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Scientific Limitations Banner */}
      <ScientificNotice compact={false} />

      {/* 3 Core System Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('map')}
          className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-2xl p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center justify-between">
            <span>Bản đồ ngập lụt</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tra cứu vị trí và tọa độ tương tác trên nền OpenStreetMap trong phạm vi bounding box nghiên cứu Cần Thơ, xem độ sâu mô phỏng và phân loại rủi ro.
          </p>
        </div>

        <div
          onClick={() => onNavigate('ml')}
          className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-2xl p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center justify-between">
            <span>Phân tích Học máy (ML)</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tìm hiểu vector không gian đặc trưng X (triều sông Hậu, mưa, DEM, bề mặt), mô hình Random Forest, quy trình gán nhãn 3 lớp và nguyên tắc minh bạch dữ liệu.
          </p>
        </div>

        <div
          onClick={() => onNavigate('api')}
          className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-2xl p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Terminal className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center justify-between">
            <span>Sẵn sàng kết nối FastAPI</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Cung cấp đầy đủ code mẫu Python, tài liệu API schema chuẩn hóa và cơ chế xử lý ngoại lệ an toàn khi chưa có backend máy chủ thực tế.
          </p>
        </div>
      </div>

      {/* Research Background Highlights */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Thông tin tổng quan về Đề tài &amp; Phạm vi dữ liệu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Phạm vi Bounding Box thử nghiệm (WGS84):
            </span>
            <ul className="space-y-1 font-mono text-slate-600 dark:text-slate-400">
              <li>• Kinh độ Tây (West): 105.737369</li>
              <li>• Kinh độ Đông (East): 105.763636</li>
              <li>• Vĩ độ Nam (South): 10.032220</li>
              <li>• Vĩ độ Bắc (North): 10.060782</li>
            </ul>
            <p className="text-slate-500 text-[11px] mt-1">
              Bao quát khu vực nội ô trung tâm Cần Thơ (An Hòa, An Thới, Cái Khế, cơ sở CTUT).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Ngưỡng đánh giá rủi ro thử nghiệm:
            </span>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li>• <strong>Y = 0 (Không ngập):</strong> Độ sâu &lt; 0,05 m</li>
              <li>• <strong>Y = 1 (Ngập nhẹ):</strong> Độ sâu từ 0,05 m đến 0,30 m</li>
              <li>• <strong>Y = 2 (Ngập nặng):</strong> Độ sâu ≥ 0,30 m (ngưỡng đề tài)</li>
            </ul>
            <p className="text-slate-500 text-[11px] mt-1">
              Mô hình học máy dự báo phân loại 3 mức nguy cơ dựa trên các điều kiện khí tượng thủy văn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
