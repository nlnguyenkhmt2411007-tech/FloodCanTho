/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const MUSIC_URL = '/intro-song-nuoc-v3.wav';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introStarted, setIntroStarted] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [mlMapSelection, setMlMapSelection] = useState<{
    coordinates: Coordinates;
    period: ReturnPeriod;
  } | null>(null);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const userTurnedOffRef = useRef(false);
  const playAttemptRef = useRef(0);

  const playMusic = useCallback(async () => {
    if (userTurnedOffRef.current) return;
    const audio = musicRef.current;
    if (!audio) return;
    const attempt = ++playAttemptRef.current;
    try {
      await audio.play();
      if (attempt !== playAttemptRef.current || userTurnedOffRef.current) {
        audio.pause();
        return;
      }
      setMusicPlaying(true);
    } catch {
      // Trình duyệt có thể chặn autoplay có tiếng trước tương tác.
      if (attempt === playAttemptRef.current) setMusicPlaying(false);
    }
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = musicRef.current;
    if (!audio) return;
    if (!audio.paused) {
      userTurnedOffRef.current = true;
      playAttemptRef.current += 1;
      audio.pause();
      setMusicPlaying(false);
    } else {
      userTurnedOffRef.current = false;
      void playMusic();
    }
  }, [playMusic]);

  useEffect(() => {
    const audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.volume = 0.75;
    audio.preload = 'auto';
    musicRef.current = audio;

    const updatePlaying = () => setMusicPlaying(!audio.paused);
    audio.addEventListener('play', updatePlaying);
    audio.addEventListener('pause', updatePlaying);
    // Nhạc chỉ bắt đầu khi người xem nhấn "Bắt đầu trải nghiệm".

    return () => {
      playAttemptRef.current += 1;


      audio.removeEventListener('play', updatePlaying);
      audio.removeEventListener('pause', updatePlaying);
      audio.pause();
      musicRef.current = null;
    };
  }, [playMusic]);

  const openMlFromMap = (coordinates: Coordinates, period: ReturnPeriod) => {
    setMlMapSelection({ coordinates, period });
    setActiveTab('ml');
  };

  // Tự động kiểm tra lại khi backend Render khởi động chậm.
  useEffect(() => {
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const checkConnection = async () => {
      try {
        const result = await checkBackendHealth();
        if (disposed) return;
        setIsBackendConnected(result.connected);
        retryTimer = setTimeout(checkConnection, result.connected ? 60000 : 5000);
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
        <IntroScreen
          onFinish={() => {
            playAttemptRef.current += 1;
            musicRef.current?.pause();
            setMusicPlaying(false);
            setShowIntro(false);
          }}
          started={introStarted}
          onStart={() => { setIntroStarted(true); void playMusic(); }}
          soundEnabled={musicPlaying}
          onToggleSound={toggleMusic}
        />
      )}

      {!showIntro && (
        <button
          type="button"
          onClick={() => {
            playAttemptRef.current += 1;
            musicRef.current?.pause();
            if (musicRef.current) musicRef.current.currentTime = 0;
            userTurnedOffRef.current = false;
            setMusicPlaying(false);
            setIntroStarted(false);
            setShowIntro(true);
          }}
          aria-label="Xem lại Intro"
          title="Xem lại Intro"
          className="fixed bottom-6 left-5 z-[100] flex items-center gap-2 rounded-full border border-amber-300/40 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-amber-100 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <span aria-hidden="true">↻</span>
          <span>Xem lại Intro</span>
        </button>
      )}

      {!showIntro && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-pressed={musicPlaying}
          aria-label={musicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
          title={musicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
          className="fixed bottom-5 right-5 z-[9000] rounded-full border border-slate-300 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg backdrop-blur-md transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:bg-slate-800/95 dark:text-white"
        >
          {musicPlaying ? '♪ Tắt nhạc' : '♫ Bật nhạc'}
        </button>
      )}

      <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isBackendConnected={isBackendConnected}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="flex-1 w-full min-w-0 max-w-[1760px] mx-auto px-2 sm:px-4 lg:px-6 py-4">
          {activeTab === 'overview' && <HomeOverview onNavigate={setActiveTab} />}
          {activeTab === 'map' && (
            <FloodMapDashboard
              isBackendConnected={isBackendConnected}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onConnectionChange={setIsBackendConnected}
              onAnalyzeWithMl={openMlFromMap}
            />
          )}
          {activeTab === 'ml' && <MlAnalysisView mapSelection={mlMapSelection} />}
          {activeTab === 'about' && <AboutView />}
          {activeTab === 'api' && <ApiDocsView onOpenSettings={() => setIsSettingsOpen(true)} />}
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-8 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">FloodCanTho</span>{' '}
              — Đồ án 1 Khoa học Máy tính · Trường Đại học Kỹ thuật – Công nghệ Cần Thơ (CTUT)
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>TS. Lý Hồng Hải (GVHD)</span><span>·</span>
              <span>Nguyễn Lâm Nguyên</span><span>·</span><span>Nguyễn Trọng Phúc</span>
            </div>
          </div>
        </footer>

        <BackendSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onConnectionChange={setIsBackendConnected}
        />
      </div>
    </>
  );
}
