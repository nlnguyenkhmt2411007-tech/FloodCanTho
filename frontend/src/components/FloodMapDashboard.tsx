import React, { useState, useEffect, useCallback } from 'react';
import {
  Coordinates,
  ReturnPeriod,
  FloodPredictionResponse,
} from '../types/flood';
import { MapView } from './MapView';
import { ScenarioSelector } from './ScenarioSelector';
import { LocationInspector } from './LocationInspector';
import { MapLegend } from './MapLegend';
import { ScientificNotice } from './ScientificNotice';
import {
  requestFloodPrediction,
  isMixedContentScenario,
  getApiBaseUrl,
} from '../services/floodApi';

interface FloodMapDashboardProps {
  isBackendConnected: boolean;
  onOpenSettings: () => void;
  onConnectionChange: (connected: boolean) => void;
}

export const FloodMapDashboard: React.FC<FloodMapDashboardProps> = ({
  isBackendConnected,
  onOpenSettings,
  onConnectionChange,
}) => {
  // Default coordinates centered in Can Tho study area (Nút giao Mậu Thân - Nguyễn Văn Cừ)
  const [coordinates, setCoordinates] = useState<Coordinates>({
    lat: 10.0461,
    lng: 105.7538,
  });

  // Default scenario: 100 years return period (khớp với request kiểm thử mẫu của user)
  const [selectedPeriod, setSelectedPeriod] = useState<ReturnPeriod>(100);

  const [predictionData, setPredictionData] =
    useState<FloodPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const baseUrl = getApiBaseUrl();
  const isMixedContent = isMixedContentScenario(baseUrl);

  // Hàm truy vấn dự đoán từ API FastAPI thực tế
  const fetchPrediction = useCallback(
    async (coords: Coordinates, period: ReturnPeriod) => {
      // Nếu chưa kết nối backend, không tự ý tạo kết quả ngập giả
      if (!isBackendConnected) {
        setPredictionData(null);
        return;
      }

      setIsLoading(true);

      const res = await requestFloodPrediction({
        latitude: coords.lat,
        longitude: coords.lng,
        return_period_years: period,
      });

      if (res.success && res.data) {
        setPredictionData(res.data);
      } else {
        if (!res.connected) {
          onConnectionChange(false);
        }
        setPredictionData(null);
      }

      setIsLoading(false);
    },
    [isBackendConnected, onConnectionChange]
  );

  // Khi tọa độ, chu kỳ lặp lại hoặc trạng thái kết nối thay đổi -> Tự động gọi API nếu đã kết nối
  useEffect(() => {
    fetchPrediction(coordinates, selectedPeriod);
  }, [coordinates, selectedPeriod, isBackendConnected, fetchPrediction]);

  const handleSelectCoordinates = (newCoords: Coordinates) => {
    setCoordinates(newCoords);
  };

  const handleSelectPeriod = (newPeriod: ReturnPeriod) => {
    setSelectedPeriod(newPeriod);
  };

  // Xác định mã mức độ rủi ro (0, 1, 2) cho marker bản đồ dựa trên kết quả API thật
  let mapRiskLevel: 0 | 1 | 2 | null = null;
  if (predictionData && predictionData.depth_m !== null) {
    if (predictionData.depth_m >= 0.3) {
      mapRiskLevel = 2; // đỏ
    } else if (predictionData.depth_m > 0.05) {
      mapRiskLevel = 1; // vàng
    } else {
      mapRiskLevel = 0; // xanh lá
    }
  }

  return (
    <div className="space-y-5 py-3">
      {/* Top Banner Notice */}
      <ScientificNotice compact={true} />

      {/* Main Grid: Map & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive Map & Legend (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          <MapView
            selectedCoordinates={coordinates}
            onSelectCoordinates={handleSelectCoordinates}
            selectedPeriod={selectedPeriod}
            riskLevel={mapRiskLevel}
            simulatedDepth={predictionData ? predictionData.depth_m : null}
          />

          <MapLegend />
        </div>

        {/* Right Column: Controls & Location Inspector (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          <ScenarioSelector
            selectedPeriod={selectedPeriod}
            onSelectPeriod={handleSelectPeriod}
          />

          <LocationInspector
            coordinates={coordinates}
            period={selectedPeriod}
            predictionData={predictionData}
            isBackendConnected={isBackendConnected}
            isLoading={isLoading}
            onRefreshPrediction={() => fetchPrediction(coordinates, selectedPeriod)}
            onSelectLandmark={handleSelectCoordinates}
            onOpenSettings={onOpenSettings}
            isMixedContentBlocked={isMixedContent}
          />
        </div>
      </div>
    </div>
  );
};
