
/**
 * FloodCanTho - Dịch vụ giao tiếp API với Backend Python FastAPI
 *
 * Các API:
 * - GET  /api/health
 * - POST /api/predict
 * - GET  /api/flood-points (được sử dụng trong MapView.tsx)
 *
 * Khi chạy localhost, sử dụng backend trên máy.
 * Khi triển khai Vercel, sử dụng backend Render.
 *
 * Không tạo dữ liệu ngập giả mạo.
 */

import {
  FloodPredictionRequest,
  FloodPredictionResponse,
  BackendHealthResponse,
} from '../types/flood';

const STORAGE_KEY_API_URL = 'floodcantho_backend_api_url';

export const DEFAULT_API_URL =
  'https://floodcantho.onrender.com';

const LOCAL_API_URL =
  'http://127.0.0.1:8000';

/**
 * Lấy địa chỉ backend phù hợp với môi trường.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_API_URL;
  }

  const hostname = window.location.hostname;

  // Khi chạy frontend trên máy tính.

  // Khi chạy trên Vercel hoặc môi trường HTTPS.
  return (
    (() => {
      const savedUrl = localStorage.getItem(STORAGE_KEY_API_URL);

      if (
        !savedUrl ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(savedUrl)
      ) {
        return DEFAULT_API_URL;
      }

      return savedUrl;
    })()
  );
}

/**
 * Lưu địa chỉ backend do người dùng cấu hình.
 * Cấu hình này được dùng trên môi trường triển khai.
 */
export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      STORAGE_KEY_API_URL,
      url.trim().replace(/\/+$/, ''),
    );
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
 * Kiểm tra trường hợp trang HTTPS gọi backend HTTP localhost.
 */
export function isMixedContentScenario(
  baseUrl: string,
): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.location.protocol === 'https:' &&
    (
      baseUrl.startsWith('http://127.0.0.1') ||
      baseUrl.startsWith('http://localhost')
    )
  );
}

/**
 * Kiểm tra kết nối FastAPI.
 * GET /api/health
 */
export async function checkBackendHealth(): Promise<{
  connected: boolean;
  message: string;
  statusDetails?: BackendHealthResponse | null;
  isMixedContentBlocked?: boolean;
}> {
  const baseUrl = getApiBaseUrl();

  const mixedContent =
    isMixedContentScenario(baseUrl);

  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    15000,
  );

  try {
    const res = await fetch(
      `${baseUrl}/api/health`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data: BackendHealthResponse =
        await res.json();

      const isReady = Boolean(
        data &&
        (
          data.status === 'ready' ||
          data.status === 'success' ||
          data.status === 'ok'
        ),
      );

      return {
        connected: isReady,
        message: isReady
          ? 'Đã kết nối thành công tới FastAPI backend (status: ready).'
          : `Máy chủ phản hồi trạng thái: ${
              data?.status || 'chưa sẵn sàng'
            }`,
        statusDetails: data,
        isMixedContentBlocked: false,
      };
    }

    return {
      connected: false,
      message:
        `Máy chủ phản hồi mã lỗi HTTP ${res.status}: ${res.statusText}`,
      isMixedContentBlocked: false,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (mixedContent) {
      return {
        connected: false,
        isMixedContentBlocked: true,
        message:
          'Trình duyệt chặn kết nối từ trang HTTPS xuống backend HTTP localhost.',
      };
    }

    return {
      connected: false,
      isMixedContentBlocked: false,
      message:
        err?.name === 'AbortError'
          ? 'Quá thời gian kết nối tới backend (Timeout sau 15 giây).'
          : (
              `Chưa thể kết nối tới ${baseUrl}. ` +
              'Vui lòng kiểm tra máy chủ FastAPI và cấu hình CORS.'
            ),
    };
  }
}

/**
 * Gửi yêu cầu trích xuất độ sâu ngập mô phỏng.
 *
 * POST /api/predict
 *
 * Body:
 * {
 *   latitude,
 *   longitude,
 *   return_period_years
 * }
 */
export async function requestFloodPrediction(
  req: FloodPredictionRequest,
): Promise<ApiResponse<FloodPredictionResponse>> {
  const baseUrl = getApiBaseUrl();

  const mixedContent =
    isMixedContentScenario(baseUrl);

  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    6000,
  );

  try {
    const res = await fetch(
      `${baseUrl}/api/predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          latitude: req.latitude,
          longitude: req.longitude,
          return_period_years:
            req.return_period_years,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        connected: true,
        data: null,
        statusCode: res.status,
        errorMessage:
          `Backend báo lỗi HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data: FloodPredictionResponse =
      await res.json();

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
        ? 'Trình duyệt chặn kết nối HTTPS -> HTTP localhost (Mixed Content).'
        : err?.name === 'AbortError'
          ? 'Hết thời gian chờ phản hồi từ máy chủ backend.'
          : (
              'Chưa kết nối được backend tại ' +
              baseUrl
            ),
    };
  }
}

/**
 * Kết quả phân loại nhị phân từ Random Forest v2.
 * Nguồn dữ liệu huấn luyện: raster ngập mô phỏng.
 */
export interface MlPredictionResponse {
  status: 'success' | 'outside_coverage' | string;
  latitude: number;
  longitude: number;
  return_period_years: number;
  ml_model?: string;
  ml_probability: number | null;
  ml_prediction: 0 | 1 | null;
  depth_threshold_m?: number;
  probability_threshold?: number;
  data_source?: string;
  is_realtime_forecast?: boolean;
  message?: string;
}

export async function requestMlPrediction(
  req: FloodPredictionRequest & { model_name?: 'random_forest_v2' | 'decision_tree' | 'extra_trees' },
): Promise<ApiResponse<MlPredictionResponse>> {
  const baseUrl = getApiBaseUrl();
  const mixedContent = isMixedContentScenario(baseUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    30000,
  );

  try {
    const res = await fetch(`${baseUrl}/api/ml-predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        latitude: req.latitude,
        longitude: req.longitude,
        return_period_years: req.return_period_years,
        model_name: req.model_name ?? 'random_forest_v2',
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        success: false,
        connected: true,
        data: null,
        statusCode: res.status,
        errorMessage: `API ML phản hồi HTTP ${res.status}`,
      };
    }

    const data: MlPredictionResponse = await res.json();

    return {
      success: data.status === 'success',
      connected: true,
      data,
      errorMessage:
        data.status === 'success'
          ? undefined
          : data.message || 'Không có kết quả ML tại vị trí này.',
    };
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error && err.name === 'AbortError';

    return {
      success: false,
      connected: false,
      data: null,
      isMixedContentBlocked: mixedContent,
      errorMessage: mixedContent
        ? 'Trình duyệt chặn kết nối HTTPS tới HTTP localhost.'
        : isTimeout
          ? 'Hết thời gian chờ phản hồi ML.'
          : `Không kết nối được backend tại ${baseUrl}`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
