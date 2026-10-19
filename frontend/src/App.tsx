/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { Coordinates, ReturnPeriod } from './types/flood';
import { Header, ActiveTab } from './components/Header';
import { FloodMapDashboard } from './components/FloodMapDashboard';
import { HomeOverview } from './components/HomeOverview';
import { MlAnalysisView } from './components/MlAnalysisView';
import { AboutView } from './components/AboutView';
import { ApiDocsView } from './components/ApiDocsView';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { checkBackendHealth } from './services/floodApi';
import IntroScreen from './components/IntroScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState(true);
  const [mlMapSelection, setMlMapSelection] = useState<{
    coordinates: Coordinates;
    period: ReturnPeriod;
  } | null>(null);

  const openMlFromMap = (
    coordinates: Coordinates,
    period: ReturnPeriod,
  ) => {
    setMlMapSelection({ coordinates, period });
    setActiveTab('ml');
  };

    // Tu dong kiem tra lai khi backend Render khoi dong cham.
  useEffect(() => {
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const checkConnection = async () => {
      try {
        const result = await checkBackendHealth();

        if (disposed) return;

        setIsBackendConnected(result.connected);

        retryTimer = setTimeout(
          checkConnection,
          result.connected ? 60000 : 5000,
        );
      } catch {
        if (disposed) return;

        setIsBackendConnected(false);
        retryTimer = setTimeout(checkConnection, 5000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (retryTimer) clearTimeout(retryTimer);
        void checkConnection();
      }
    };

    void checkConnection();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
  {showIntro && (
    <IntroScreen onFinish={() => setShowIntro(false)} />
  )}
    
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isBackendConnected={isBackendConnected}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1760px] mx-auto px-4 lg:px-6 py-4">
        {activeTab === 'overview' && (
          <HomeOverview onNavigate={setActiveTab} />
        )}

        {activeTab === 'map' && (
          <FloodMapDashboard
            isBackendConnected={isBackendConnected}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onConnectionChange={setIsBackendConnected}
            onAnalyzeWithMl={openMlFromMap}
          />
        )}

        {activeTab === 'ml' && (
          <MlAnalysisView mapSelection={mlMapSelection} />
        )}

        {activeTab === 'about' && (
          <AboutView />
        )}

        {activeTab === 'api' && (
          <ApiDocsView onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              FloodCanTho
            </span>{' '}
            — Đồ án 1 Khoa học Máy tính · Trường Đại học Kỹ thuật – Công nghệ Cần Thơ (CTUT)
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>TS. Lý Hồng Hải (GVHD)</span>
            <span>·</span>
            <span>Nguyễn Lâm Nguyên</span>
            <span>·</span>
            <span>Nguyễn Trọng Phúc</span>
          </div>
        </div>
      </footer>

      {/* Backend Settings & Ping Modal */}
      <BackendSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConnectionChange={setIsBackendConnected}
        />
        </div>
      </>
      );
    }

