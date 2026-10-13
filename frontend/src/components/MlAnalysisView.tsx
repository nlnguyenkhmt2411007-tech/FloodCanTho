import React from 'react';
import {
  Cpu,
  Database,
  BarChart2,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

export const MlAnalysisView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Cpu className="w-4 h-4" />
          <span>Khoa học máy tính · Đồ án 1 CTUT</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Kiến trúc Mô hình Machine Learning & Phương pháp luận
        </h1>
        <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed max-w-3xl">
          Giải pháp học máy có giám sát (Supervised Multi-class Classification) hướng dữ liệu, 
          hỗ trợ phân loại và ước lượng nguy cơ ngập lụt tại khu vực đô thị Cần Thơ từ các biến đặc trưng thủy văn, khí tượng và địa hình.
        </p>
      </div>

      {/* 1. Mathematical Formulation */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Mô hình hóa bài toán & Không gian đặc trưng
          </h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Bài toán được định nghĩa là một bài toán phân loại đa lớp có giám sát (Supervised Multi-class Classification). 
          Mô hình học máy thực hiện ánh xạ từ không gian vector đặc trưng đa nguồn <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-blue-600">X</code> sang nhãn nguy cơ ngập <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-blue-600">Y</code>:
        </p>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-sm sm:text-base text-center text-slate-800 dark:text-slate-100 overflow-x-auto">
          f(X) → Y &nbsp; với &nbsp; X = {'{'} x<sub>waterlevel</sub>, x<sub>rainfall</sub>, x<sub>topo</sub>, x<sub>surface</sub>, x<sub>time</sub>, x<sub>location</sub> {'}'}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="font-mono text-xs font-bold text-blue-600 block mb-1">
              x<sub>waterlevel</sub> (Mực nước triều)
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Biến động bán nhật triều sông Hậu đo tại trạm thủy văn Cần Thơ. Là nguyên nhân cốt lõi gây ngập nội ô ngay cả khi không có mưa.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="font-mono text-xs font-bold text-blue-600 block mb-1">
              x<sub>rainfall</sub> (Lượng mưa)
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Cường độ và phân bố lượng mưa (mm/h). Tác nhân kích thích ngắn hạn, khi cộng hưởng với đỉnh triều sẽ làm gia tăng nhanh chóng ngập tràn bờ.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="font-mono text-xs font-bold text-blue-600 block mb-1">
              x<sub>topo</sub> (Cao độ địa hình)
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Trích xuất từ mô hình số độ cao kỹ thuật số (DEM/GeoTIFF) giúp nhận diện các vùng trũng thấp tích tụ nước tự nhiên.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="font-mono text-xs font-bold text-blue-600 block mb-1">
              x<sub>surface</sub> (Bề mặt đô thị)
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Đặc trưng phủ bề mặt và chỉ số đô thị hóa bê tông hóa, phản ánh khả năng thấm hút nước tự nhiên và áp lực lên cống rãnh.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="font-mono text-xs font-bold text-blue-600 block mb-1">
              x<sub>time</sub> (Thời gian & Mùa vụ)
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Giờ trong ngày, tháng trong năm và chu kỳ con nước (rằm, mồng một âm lịch) hỗ trợ nhận diện tính quy luật của triều cường.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="font-mono text-xs font-bold text-blue-600 block mb-1">
              x<sub>location</sub> (Tọa độ không gian)
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tọa độ địa lý (Latitude, Longitude) tại điểm quan sát giúp mô hình ghi nhận sự phân hóa về độ nhạy ngập giữa các khu vực địa hình khác nhau.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Target Labeling & Hydrological Thresholds */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Quy trình gán nhãn mục tiêu Y ∈ {'{'}0, 1, 2{'}'}
          </h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Biến mục tiêu Y được thiết lập tự động thông qua việc đối soát mực nước thực tế/mô phỏng với 03 ngưỡng thủy văn tham chiếu:
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Nhãn 0: Không ngập (No Flood)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Mực nước dưới ngưỡng vùng trũng (Water Level &lt; Low Lying Level), hệ thống thoát nước vận hành bình thường, bề mặt khô ráo (&lt; 0,05 m).
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
              Y = 0
            </span>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Nhãn 1: Ngập nhẹ (Minor Flood)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Mực nước vượt ngưỡng trũng và tiệm cận mức báo động (Low Lying Level ≤ Water Level &lt; Alarm Level), đọng nước cục bộ với độ sâu thấp (0,05 m – 0,30 m), xe vẫn di chuyển được.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 self-start sm:self-auto">
              Y = 1
            </span>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  Nhãn 2: Ngập nặng (Major Flood)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Mực nước vượt quá mức báo động và vượt ngưỡng tràn bờ (Water Level ≥ Alarm/Flood Level), độ sâu ngập ≥ 0,30 m, gây tê liệt giao thông và ngập diện rộng.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-800 self-start sm:self-auto">
              Y = 2
            </span>
          </div>
        </div>
      </section>

      {/* 3. ML Algorithms Survey */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Khảo sát thuật toán & Mô hình Rừng Ngẫu Nhiên (Random Forest)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
              Hồi quy Logistic
            </h3>
            <span className="text-[11px] text-blue-600 font-semibold block mb-2">Mô hình cơ sở (Baseline)</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mô hình tuyến tính cơ sở nhằm ước lượng xác suất thuộc về từng lớp nguy cơ ngập dựa trên tổ hợp tuyến tính của các biến đầu vào, đóng vai trò mốc so sánh hiệu năng.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
              Cây quyết định (Decision Tree)
            </h3>
            <span className="text-[11px] text-blue-600 font-semibold block mb-2">Phi tuyến tính trực quan</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Phân chia không gian đặc trưng dựa trên các quy tắc điều kiện phân cấp từ các biến đầu vào như lượng mưa, cao độ địa hình và mực nước. Dễ diễn giải nhưng dễ bị quá khớp (overfitting).
            </p>
          </div>

          <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/30 dark:bg-blue-950/20">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center justify-between">
              <span>Random Forest</span>
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">Lựa chọn chính</span>
            </h3>
            <span className="text-[11px] text-blue-600 font-semibold block mb-2">Bagging Ensemble</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mô hình học tập kết hợp dựa trên kỹ thuật Bagging, xây dựng nhiều cây quyết định ngẫu nhiên nhằm tăng độ ổn định, kháng nhiễu tốt và hạn chế triệt để hiện tượng quá khớp so với cây đơn lẻ.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Model Evaluation & Academic Honesty */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Bộ độ đo đánh giá & Báo cáo thực nghiệm
          </h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Đề tài thiết lập quy trình kiểm định khoa học sử dụng các chỉ số chuẩn mực trong bài toán phân loại học máy:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Độ chính xác (Accuracy)</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Tỷ lệ tổng số mẫu được phân loại chính xác trên toàn bộ tập kiểm thử.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Độ chính xác dương (Precision)</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Tỷ lệ mẫu dự đoán ngập thực sự chính xác so với tổng số dự báo mức đó.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Độ thu hồi (Recall)</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Khả năng phát hiện không bỏ sót các trường hợp ngập thực tế cần cảnh báo.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Điểm F1 (F1-score)</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Trung bình điều hòa giữa Precision và Recall khi dữ liệu mất cân bằng.</p>
          </div>
        </div>

        {/* Academic Transparency Box (NO FAKE METRICS) */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Nguyên tắc trung thực học thuật về số liệu đánh giá</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Hệ thống tuân thủ nghiêm ngặt yêu cầu không tự tạo số liệu đánh giá giả định. 
            Hiện tại, ma trận nhầm lẫn (Confusion Matrix) và bảng chỉ số chi tiết của mô hình Random Forest đang trong giai đoạn huấn luyện, 
            tối ưu siêu tham số trên tập dữ liệu đo đạc Cần Thơ. Khi bạn kết nối tới Backend FastAPI, các chỉ số thực tế từ file kết quả kiểm định 
            sẽ được đồng bộ trực tiếp lên giao diện.
          </p>
        </div>
      </section>

      {/* 5. Limitations & Safety Caution */}
      <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-3">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-base">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>Hạn chế của mô hình và khuyến cáo an toàn</span>
        </div>
        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
          <li>
            <strong>Tiếp cận hướng dữ liệu thuần túy (Data-driven):</strong> Mô hình khai phá tương quan thống kê, không giải phương trình vi phân thủy lực động lực học dòng chảy (1D/2D Saint-Venant).
          </li>
          <li>
            <strong>Phụ thuộc chất lượng dữ liệu:</strong> Độ chính xác của mô hình chịu ảnh hưởng lớn từ sai số lấy mẫu trạm đo, độ phân giải raster DEM và tình trạng thiếu dữ liệu ngập lịch sử chi tiết theo từng ngõ hẻm.
          </li>
          <li>
            <strong>Không thay thế cảnh báo nghiệp vụ:</strong> Kết quả trên hệ thống chỉ mang tính chất tham khảo học thuật, không có giá trị pháp lý hay thay thế cho các bản tin dự báo từ Đài Khí tượng Thủy văn khu vực Nam Bộ.
          </li>
        </ul>
      </section>
    </div>
  );
};
