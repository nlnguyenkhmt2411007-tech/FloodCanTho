
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
  // Tọa độ mặc định trong khu vực nghiên cứu Cần Thơ
  const [coordinates, setCoordinates] = useState<Coordinates>({
    lat: 10.0461,
    lng: 105.7538,
  });

  // Kịch bản mặc định: chu kỳ lặp lại 100 năm
  const [selectedPeriod, setSelectedPeriod] = useState<ReturnPeriod>(100);

  const [predictionData, setPredictionData] =
    useState<FloodPredictionResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const baseUrl = getApiBaseUrl();
  const isMixedContent = isMixedContentScenario(baseUrl);

  // Truy vấn độ sâu ngập mô phỏng từ FastAPI
  const fetchPrediction = useCallback(
    async (coords: Coordinates, period: ReturnPeriod) => {
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

  // Tự động truy vấn khi tọa độ, chu kỳ hoặc kết nối thay đổi
  useEffect(() => {
    fetchPrediction(coordinates, selectedPeriod);
  }, [coordinates, selectedPeriod, isBackendConnected, fetchPrediction]);

  const handleSelectCoordinates = (newCoords: Coordinates) => {
    setCoordinates(newCoords);
  };

  const handleSelectPeriod = (newPeriod: ReturnPeriod) => {
    setSelectedPeriod(newPeriod);
  };

  // Phân loại độ sâu ngập theo ngưỡng thử nghiệm
  let mapRiskLevel: 0 | 1 | 2 | null = null;

  if (predictionData && predictionData.depth_m !== null) {
    if (predictionData.depth_m >= 0.3) {
      mapRiskLevel = 2;
    } else if (predictionData.depth_m > 0.05) {
      mapRiskLevel = 1;
    } else {
      mapRiskLevel = 0;
    }
  }

  return (
    <div className="space-y-5 py-3">
      {/* Thông báo giới hạn khoa học */}
      <ScientificNotice compact={true} />

      {/*
        MOBILE:
        1. Bản đồ
        2. Thông tin vị trí
        3. Chọn chu kỳ
        4. Chú giải

        DESKTOP:
        Bản đồ và chú giải bên trái.
        Chọn chu kỳ và thông tin vị trí bên phải.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Bản đồ: đầu tiên trên cả mobile và desktop */}
        <div className="order-1 lg:col-span-8 lg:col-start-1 lg:row-start-1">
          <MapView
            selectedCoordinates={coordinates}
            onSelectCoordinates={handleSelectCoordinates}
            selectedPeriod={selectedPeriod}
            riskLevel={mapRiskLevel}
            simulatedDepth={
              predictionData ? predictionData.depth_m : null
            }
          />
        </div>

        {/* Kết quả: ngay dưới bản đồ trên điện thoại */}
        <div className="order-2 lg:order-3 lg:col-span-4 lg:col-start-9 lg:row-start-2">
          <LocationInspector
            coordinates={coordinates}
            period={selectedPeriod}
            predictionData={predictionData}
            isBackendConnected={isBackendConnected}
            isLoading={isLoading}
            onRefreshPrediction={() =>
              fetchPrediction(coordinates, selectedPeriod)
            }
            onSelectLandmark={handleSelectCoordinates}
            onOpenSettings={onOpenSettings}
            isMixedContentBlocked={isMixedContent}
          />
        </div>

        {/* Bộ chọn chu kỳ */}
        <div className="order-3 lg:order-2 lg:col-span-4 lg:col-start-9 lg:row-start-1">
          <ScenarioSelector
            selectedPeriod={selectedPeriod}
            onSelectPeriod={handleSelectPeriod}
          />
        </div>

        {/* Chú giải: cuối cùng trên điện thoại */}
        <div className="order-4 lg:col-span-8 lg:col-start-1 lg:row-start-2">
          <MapLegend />
        </div>

      </div>
    </div>
  );
};
