import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, Info } from 'lucide-react';

interface ScientificNoticeProps {
  compact?: boolean;
}

export const ScientificNotice: React.FC<ScientificNoticeProps> = ({ compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  return (
    <aside aria-label="Lưu ý khoa học và phạm vi nghiên cứu" className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wide text-xs">
                Lưu ý khoa học & Giới hạn thử nghiệm
              </span>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 font-medium">
                (Đề tài nghiên cứu học thuật CTUT)
              </span>
            </div>
            {!isExpanded && (
              <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                Dữ liệu mô phỏng theo chu kỳ lặp lại, ngưỡng 0,30m là thử nghiệm nội bộ, phạm vi giới hạn tại khu vực nghiên cứu.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-2 bg-amber-500/5 p-2 rounded-lg">
            <span className="font-bold text-amber-700 dark:text-amber-400">1.</span>
            <p>
              <strong>Bản chất kịch bản:</strong> 6 kịch bản ngập (2, 5, 10, 20, 50, 100 năm) là số liệu mô phỏng theo <em>chu kỳ lặp lại thủy văn</em>, không phải dự báo thời tiết hoặc triều cường thời gian thực.
            </p>
          </div>

          <div className="flex items-start gap-2 bg-amber-500/5 p-2 rounded-lg">
            <span className="font-bold text-amber-700 dark:text-amber-400">2.</span>
            <p>
              <strong>Ngưỡng ngập 0,30 m:</strong> Đây chỉ là <em>ngưỡng phân loại thử nghiệm</em> của đề tài sinh viên nhằm phục vụ huấn luyện máy học, không phải tiêu chuẩn cảnh báo ngập lụt quốc gia.
            </p>
          </div>

          <div className="flex items-start gap-2 bg-amber-500/5 p-2 rounded-lg">
            <span className="font-bold text-amber-700 dark:text-amber-400">3.</span>
            <p>
              <strong>Phạm vi không gian:</strong> Dữ liệu hiện chỉ bao phủ một khu vực thí điểm nhỏ thuộc quận Ninh Kiều và Bình Thủy, chưa mở rộng ra toàn bộ Thành phố Cần Thơ.
            </p>
          </div>

          <div className="flex items-start gap-2 bg-amber-500/5 p-2 rounded-lg">
            <span className="font-bold text-amber-700 dark:text-amber-400">4.</span>
            <p>
              <strong>Mục đích sử dụng:</strong> Hệ thống được xây dựng phục vụ nghiên cứu khoa học và minh họa học thuật. Mô hình chưa đủ độ tin cậy để làm căn cứ điều hành hay cảnh báo an toàn sinh mạng.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
