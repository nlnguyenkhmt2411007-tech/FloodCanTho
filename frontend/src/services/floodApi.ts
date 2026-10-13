/**
 * FloodCanTho - Dịch vụ giao tiếp API với Backend Python FastAPI
 * 
 * Quản lý kết nối chuẩn xác với backend FastAPI thực tế:
 * - GET  /api/health
 * - POST /api/predict (với body: { latitude, longitude, return_period_years })
 * 
 * Tuyệt đối không tạo kết quả ngập giả mạo.
 * Phân biệt rõ lỗi kết nối do môi trường Preview (Mixed Content) với lỗi API.
 */

import {
  FloodPredictionRequest,
  FloodPredictionResponse,
  BackendHealthResponse,
} from '../types/flood';

const STORAGE_KEY_API_URL = 'floodcantho_backend_api_url';
export const DEFAULT_API_URL = 'https://floodcantho.onrender.com';;

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_API_URL;
  return localStorage.getItem(STORAGE_KEY_API_URL) || DEFAULT_API_URL;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_API_URL, url.trim().replace(/\/+$/, ''));
  }
}

export interface ApiResponse<T> {
  success: boolean;
  connected: boolean;
  data: T | null;
  errorMessage?: string;
  isMixedContentBlocked?: boolean;
  statusCode?: number;
}

/**
 * Kiểm tra xem có đang chạy trong môi trường HTTPS (Cloud Run Preview)
 * và gọi tới endpoint HTTP không bảo mật (localhost) hay không
 */
export function isMixedContentScenario(baseUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.protocol === 'https:' &&
    (baseUrl.startsWith('http://127.0.0.1') || baseUrl.startsWith('http://localhost'))
  );
}

/**
 * Kiểm tra kết nối tới Backend FastAPI (GET /api/health)
 * Yêu cầu: status === "ready"
 */
export async function checkBackendHealth(): Promise<{
  connected: boolean;
  message: string;
  statusDetails?: BackendHealthResponse | null;
  isMixedContentBlocked?: boolean;
}> {
  const baseUrl = getApiBaseUrl();
  const mixedContent = isMixedContentScenario(baseUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: BackendHealthResponse = await res.json();
      const isReady = data && (data.status === 'ready' || data.status === 'success' || data.status === 'ok');
      return {
        connected: isReady,
        message: isReady
          ? 'Đã kết nối thành công tới FastAPI backend (status: ready).'
          : `Máy chủ phản hồi trạng thái: ${data?.status || 'chưa sẵn sàng'}`,
        statusDetails: data,
        isMixedContentBlocked: false,
      };
    } else {
      return {
        connected: false,
        message: `Máy chủ phản hồi mã lỗi HTTP ${res.status}: ${res.statusText}`,
        isMixedContentBlocked: false,
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (mixedContent) {
      return {
        connected: false,
        isMixedContentBlocked: true,
        message:
          'Trình duyệt chặn kết nối từ trang Preview HTTPS xuống HTTP 127.0.0.1:8000 do chính sách Mixed Content & Private Network Access của trình duyệt.',
      };
    }

    return {
      connected: false,
      isMixedContentBlocked: false,
      message:
        err.name === 'AbortError'
          ? 'Quá thời gian kết nối tới backend (Timeout sau 3.5s)'
          : `Chưa thể kết nối tới ${baseUrl}. Vui lòng kiểm tra máy chủ FastAPI đã khởi động chưa (uvicorn main:app --port 8000) và cấu hình CORS.`,
    };
  }
}

/**
 * Gửi yêu cầu trích xuất độ sâu ngập tới Backend FastAPI (POST /api/predict)
 * Chỉ gửi: latitude, longitude, return_period_years
 */
export async function requestFloodPrediction(
  req: FloodPredictionRequest
): Promise<ApiResponse<FloodPredictionResponse>> {
  const baseUrl = getApiBaseUrl();
  const mixedContent = isMixedContentScenario(baseUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${baseUrl}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        latitude: req.latitude,
        longitude: req.longitude,
        return_period_years: req.return_period_years,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        connected: true,
        data: null,
        statusCode: res.status,
        errorMessage: `Backend báo lỗi HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data: FloodPredictionResponse = await res.json();
    return {
      success: true,
      connected: true,
      data,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      connected: false,
      data: null,
      isMixedContentBlocked: mixedContent,
      errorMessage: mixedContent
        ? 'Trình duyệt chặn kết nối HTTPS -> HTTP localhost (Mixed Content)'
        : err.name === 'AbortError'
        ? 'Hết thời gian chờ phản hồi từ máy chủ backend'
        : `Chưa kết nối dữ liệu thực (Không thể kết nối đến backend tại ${baseUrl})`,
    };
  }
}
