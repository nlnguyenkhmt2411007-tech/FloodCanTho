import React from 'react';
import { Waves, MapPin, Cpu, BookOpen, Terminal, Settings2 } from 'lucide-react';
import NPLogo from "./NPLogo";

export type ActiveTab = 'map' | 'ml' | 'about' | 'api' | 'overview';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isBackendConnected: boolean;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isBackendConnected,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('overview')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 shrink-0 transition-transform duration-300 group-hover:scale-105">
            <NPLogo size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                FloodCanTho
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                CTUT Demo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] sm:max-w-none">
              Đánh giá nguy cơ ngập lụt bằng Machine Learning
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'overview'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            Trang chủ
          </button>

          <button
            onClick={() => onSelectTab('map')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'map'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <MapPin className="w-4 h-4" />
            Bản đồ ngập
          </button>

          <button
            onClick={() => onSelectTab('ml')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ml'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <Cpu className="w-4 h-4" />
            Phân tích ML
          </button>

          <button
            onClick={() => onSelectTab('about')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'about'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            Giới thiệu
          </button>

          <button
            onClick={() => onSelectTab('api')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'api'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <Terminal className="w-4 h-4" />
            Tích hợp FastAPI
          </button>
        </nav>

        {/* Right action: Backend connection toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${isBackendConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            title="Nhấp để cấu hình và kiểm tra kết nối FastAPI"
          >
            <span
              className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
            />
            <span className="hidden sm:inline">
              {isBackendConnected ? 'FastAPI: Đã kết nối' : 'Chưa kết nối API'}
            </span>
            <span className="sm:hidden">
              {isBackendConnected ? 'API OK' : 'API Off'}
            </span>
            <Settings2 className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center overflow-x-auto border-t border-slate-200 dark:border-slate-800 px-2 py-1 scrollbar-none">
        <button
          onClick={() => onSelectTab('overview')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === 'overview' ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
        >
          Trang chủ
        </button>
        <button
          onClick={() => onSelectTab('map')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === 'map' ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
        >
          Bản đồ ngập
        </button>
        <button
          onClick={() => onSelectTab('ml')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === 'ml' ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
        >
          Phân tích ML
        </button>
        <button
          onClick={() => onSelectTab('about')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === 'about' ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
        >
          Giới thiệu
        </button>
        <button
          onClick={() => onSelectTab('api')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === 'api' ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
        >
          API Backend
        </button>
      </div>
    </header>
  );
};
