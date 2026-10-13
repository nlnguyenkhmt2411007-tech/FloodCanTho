import React from 'react';
import {
  GraduationCap,
  Users,
  MapPin,
  Calendar,
  Waves,
  Building,
  Award,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header Info Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Đề tài Đồ án 1 · Ngành Khoa học Máy tính
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              Ứng dụng Machine Learning dự đoán và cảnh báo nguy cơ ngập lụt tại Thành phố Cần Thơ
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trường Đại học Kỹ thuật – Công nghệ Cần Thơ (CTUT) · Khoa Công nghệ Thông tin · Năm 2026
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 shrink-0">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>

        {/* Project Team */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Giảng viên hướng dẫn
            </span>
            <div className="font-bold text-base text-slate-900 dark:text-white">
              TS. Lý Hồng Hải
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Khoa Công nghệ Thông tin – Trường ĐH Kỹ thuật – Công nghệ Cần Thơ
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Sinh viên thực hiện
            </span>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-800 dark:text-slate-200">
                <span>Nguyễn Lâm Nguyên</span>
                <span className="text-xs font-mono text-slate-500">MSSV: KHMT2411007</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-slate-800 dark:text-slate-200">
                <span>Nguyễn Trọng Phúc</span>
                <span className="text-xs font-mono text-slate-500">MSSV: KHMT2411034</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-World Context in Can Tho */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Waves className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Bối cảnh thực tiễn tại Thành phố Cần Thơ
          </h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Cần Thơ là trung tâm kinh tế, văn hóa của vùng Đồng bằng sông Cửu Long. Tuy nhiên, tình trạng ngập lụt đô thị diễn ra ngày càng thường xuyên và phức tạp, đặc biệt tại các quận trung tâm như <strong>Ninh Kiều, Bình Thủy và Cái Răng</strong>. 
        </p>

        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs sm:text-sm text-blue-950 dark:text-blue-200 space-y-2">
          <div className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Sự kiện triều cường điển hình ghi nhận ngày 14/09/2026:</span>
          </div>
          <p className="leading-relaxed">
            Mực nước tại Trạm thủy văn Cần Thơ (sông Hậu) đạt mốc <strong>2,25 m</strong> (vượt báo động III tới <strong>0,25 m</strong>), gây ngập lụt trên diện rộng vào các khung giờ cao điểm sáng và chiều tối. Đến cuối tháng 9/2026, các cơ quan khí tượng tiếp tục phát cảnh báo triều cường dâng cao gây cản trở giao thông và hoạt động dân sinh.
          </p>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Thay vì chỉ dựa vào các mô hình thủy lực 1D/2D đòi hỏi tài nguyên máy tính đồ sộ và thông số phức tạp, đề tài tiếp cận theo hướng <strong>Học máy (Data-driven approach)</strong> để khai phá chuỗi dữ liệu quá khứ, giúp đưa ra đánh giá xu hướng nhanh chóng và dễ tiếp cận cho người dùng và cơ quan quản lý.
        </p>
      </section>

      {/* Scope and Data Sources */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Nguồn dữ liệu & Công cụ thực nghiệm
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Nguồn dữ liệu tham khảo</h3>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>NASA POWER:</strong> Dữ liệu khí tượng và cường độ bức xạ/mưa.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>NERC Environmental Information Data Centre:</strong> Dữ liệu môi trường quốc tế.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Trạm Thủy văn Cần Thơ:</strong> Chuỗi số liệu mực nước triều sông Hậu.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Raster DEM GeoTIFF:</strong> Cao độ địa hình tự nhiên khu vực nghiên cứu.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Công cụ công nghệ</h3>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Python / Scikit-learn:</strong> Huấn luyện Logistic Regression, Random Forest.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Rasterio &amp; GeoPandas:</strong> Trích xuất tọa độ và độ sâu từ ảnh GeoTIFF.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>FastAPI:</strong> Xây dựng REST API xử lý yêu cầu phân loại.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>React / TypeScript / Leaflet:</strong> Giao diện bản đồ tương tác người dùng.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
