/**
 * FloodCanTho - Data Types & Interfaces
 * Tương thích chính xác với backend Python FastAPI thực tế
 */

export type ReturnPeriod = 2 | 5 | 10 | 20 | 50 | 100;

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

// Bounding box nghiên cứu thử nghiệm theo đề tài
export const CAN_THO_STUDY_BOUNDS: BoundingBox = {
  west: 105.737369,
  south: 10.032220,
  east: 105.763636,
  north: 10.060782,
};

export type FloodRiskLevel = 0 | 1 | 2;

export interface RiskLevelMeta {
  level: FloodRiskLevel;
  code: 'NO_FLOOD' | 'MINOR_FLOOD' | 'MAJOR_FLOOD';
  name: string;
  description: string;
  depthRange: string;
}

export const RISK_LEVELS: Record<FloodRiskLevel, RiskLevelMeta> = {
  0: {
    level: 0,
    code: 'NO_FLOOD',
    name: 'Không ngập',
    description: 'Mực nước dưới ngưỡng vùng trũng, mặt đường khô ráo.',
    depthRange: '< 0,05 m',
  },
  1: {
    level: 1,
    code: 'MINOR_FLOOD',
    name: 'Ngập nhẹ (dưới ngưỡng 0,30 m)',
    description: 'Đọng nước cục bộ ở các điểm trũng thấp, dưới ngưỡng thử nghiệm.',
    depthRange: '0,05 m – 0,30 m',
  },
  2: {
    level: 2,
    code: 'MAJOR_FLOOD',
    name: 'Ngập vượt ngưỡng thử nghiệm (≥ 0,30 m)',
    description: 'Độ sâu vượt ngưỡng thử nghiệm 0,30 m của đề tài.',
    depthRange: '≥ 0,30 m',
  },
};

export interface ScenarioMeta {
  period: ReturnPeriod;
  label: string;
  title: string;
  probabilityAnnual: string;
  description: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    period: 2,
    label: '2 năm',
    title: 'Kịch bản chu kỳ 2 năm (T = 2)',
    probabilityAnnual: '50% mỗi năm',
    description: 'Mô phỏng thủy văn tương ứng với chu kỳ lặp lại 2 năm theo dữ liệu raster thực tế.',
  },
  {
    period: 5,
    label: '5 năm',
    title: 'Kịch bản chu kỳ 5 năm (T = 5)',
    probabilityAnnual: '20% mỗi năm',
    description: 'Mô phỏng thủy văn tương ứng với chu kỳ lặp lại 5 năm theo dữ liệu raster thực tế.',
  },
  {
    period: 10,
    label: '10 năm',
    title: 'Kịch bản chu kỳ 10 năm (T = 10)',
    probabilityAnnual: '10% mỗi năm',
    description: 'Mô phỏng thủy văn tương ứng với chu kỳ lặp lại 10 năm theo dữ liệu raster thực tế.',
  },
  {
    period: 20,
    label: '20 năm',
    title: 'Kịch bản chu kỳ 20 năm (T = 20)',
    probabilityAnnual: '5% mỗi năm',
    description: 'Mô phỏng thủy văn tương ứng với chu kỳ lặp lại 20 năm theo dữ liệu raster thực tế.',
  },
  {
    period: 50,
    label: '50 năm',
    title: 'Kịch bản chu kỳ 50 năm (T = 50)',
    probabilityAnnual: '2% mỗi năm',
    description: 'Mô phỏng thủy văn tương ứng với chu kỳ lặp lại 50 năm theo dữ liệu raster thực tế.',
  },
  {
    period: 100,
    label: '100 năm',
    title: 'Kịch bản chu kỳ 100 năm (T = 100)',
    probabilityAnnual: '1% mỗi năm',
    description: 'Mô phỏng thủy văn tương ứng với chu kỳ lặp lại 100 năm theo dữ liệu raster thực tế.',
  },
];

export interface LandmarkPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  inStudyArea: boolean;
  notes?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Payload gửi đến backend FastAPI thực tế (POST /api/predict)
 */
export interface FloodPredictionRequest {
  latitude: number;
  longitude: number;
  return_period_years: ReturnPeriod;
}

/**
 * Phản hồi kiểm tra sức khỏe backend (GET /api/health)
 */
export interface BackendHealthResponse {
  status: string; // "ready"
  raster_files?: Record<string, boolean>;
}

/**
 * Dữ liệu trả về từ backend FastAPI thực tế (POST /api/predict)
 */
export interface FloodPredictionResponse {
  status: 'success' | 'outside_coverage' | 'no_data' | string;
  latitude: number;
  longitude: number;
  return_period_years: ReturnPeriod;
  depth_m: number | null;
  flood_risk: string | null;
  depth_threshold_m?: number;
  data_source?: string;
  is_realtime_forecast?: boolean;
  message?: string;
}

export interface ApiConnectionState {
  connected: boolean;
  endpoint: string;
  lastChecked?: string;
  errorMessage?: string;
}

/**
 * Hàm hỗ trợ diễn giải nhãn flood_risk theo ngưỡng 0,30 m
 */
export function formatFloodRiskLabel(
  status: string,
  floodRisk: string | null,
  depthM: number | null
): {
  label: string;
  colorClass: string;
  badgeBg: string;
  description: string;
} {
  if (status === 'outside_coverage') {
    return {
      label: 'Ngoài phạm vi dữ liệu raster',
      colorClass: 'text-slate-600 dark:text-slate-400',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      description: 'Tọa độ nằm ngoài phạm vi ô lưới raster của khu vực thí điểm.',
    };
  }

  if (status === 'no_data') {
    return {
      label: 'Không có dữ liệu tại vị trí này',
      colorClass: 'text-slate-600 dark:text-slate-400',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      description: 'Giá trị độ sâu trong raster tại điểm này là NoData / rỗng.',
    };
  }

  // Dưới ngưỡng thử nghiệm 0,30 m
  if (floodRisk === 'below_experimental_threshold' || (depthM !== null && depthM < 0.3)) {
    if (depthM !== null && depthM <= 0.05) {
      return {
        label: 'Không ngập / Ngập không đáng kể',
        colorClass: 'text-emerald-700 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        description: 'Mực nước mô phỏng dưới ngưỡng trũng (dưới 0,30 m).',
      };
    }
    return {
      label: 'Dưới ngưỡng thử nghiệm (< 0,30 m)',
      colorClass: 'text-amber-700 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      description: 'Độ sâu ngập mô phỏng ở mức thấp, dưới ngưỡng thử nghiệm 0,30 m của đề tài.',
    };
  }

  // Vượt ngưỡng thử nghiệm 0,30 m
  if (floodRisk === 'above_experimental_threshold' || (depthM !== null && depthM >= 0.3)) {
    return {
      label: 'Vượt ngưỡng thử nghiệm (≥ 0,30 m)',
      colorClass: 'text-rose-700 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      description: 'Độ sâu ngập mô phỏng vượt ngưỡng thử nghiệm 0,30 m của đề tài.',
    };
  }

  return {
    label: floodRisk || 'Đang cập nhật',
    colorClass: 'text-blue-700 dark:text-blue-400',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    description: 'Trạng thái phản hồi từ máy chủ raster.',
  };
}
