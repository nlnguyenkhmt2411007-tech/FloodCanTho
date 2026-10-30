
import React from 'react';
import {
  MapPin,
  BookOpen,
  Settings2,
  Menu,
  X,
  ArrowUpRight,
  Waves,
  ChartNoAxesCombined,
  House,
  Code2,
} from 'lucide-react';
import NPLogo from './NPLogo';

export type ActiveTab = 'map' | 'ml' | 'about' | 'api' | 'overview';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isBackendConnected: boolean;
  onOpenSettings: () => void;
}

const navigation = [
  { id: 'overview', label: 'Tổng quan', icon: House },
  { id: 'map', label: 'Bản đồ ngập', icon: MapPin },
  { id: 'ml', label: 'Dự đoán ngập', icon: ChartNoAxesCombined },
  { id: 'about', label: 'Giới thiệu', icon: BookOpen },
  { id: 'api', label: 'Tài liệu API', icon: Code2 },
] as const;

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isBackendConnected,
  onOpenSettings,
}) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navigate = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#d9e3df] bg-[#f8f7f2]/95 shadow-[0_4px_25px_rgba(15,44,54,0.05)] backdrop-blur-xl dark:border-[#28424b] dark:bg-[#102b36]/95">
      <div className="mx-auto flex h-[76px] w-full max-w-[1760px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
        {/* BRAND */}
        <button
          type="button"
          onClick={() => navigate('overview')}
          className="group flex min-w-0 shrink-0 items-center gap-3 text-left"
          aria-label="Về trang Tổng quan FloodCanTho"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <NPLogo size={48} />
          </div>

          <div className="min-w-0">
            <div className="text-[19px] font-extrabold tracking-[-0.035em] text-[#173a45] dark:text-[#f7e9d3]">
              FloodCanTho
            </div>
            <div className="mt-0.5 hidden items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-[#8b7455] dark:text-[#d9bc91] sm:flex">
              <Waves className="h-3 w-3" />
              KHÁM PHÁ MIỀN SÔNG NƯỚC
            </div>
          </div>
        </button>

        {/* DESKTOP NAVIGATION */}
        <nav
          className="hidden items-center gap-1 rounded-full border border-[#dce4df] bg-white/70 p-1.5 shadow-sm dark:border-[#36515a] dark:bg-white/5 lg:flex"
          aria-label="Điều hướng chính"
        >
          {navigation.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                aria-current={active ? 'page' : undefined}
                className={`group relative inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 ${
                  active
                    ? 'bg-[#173a45] text-[#f9e7c7] shadow-[0_5px_16px_rgba(16,47,59,0.2)] dark:bg-[#e9c995] dark:text-[#173a45]'
                    : 'text-[#4d646a] hover:bg-[#e8eee9] hover:text-[#173a45] dark:text-[#d3deda] dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            title="Xem trạng thái và cấu hình kết nối API"
            aria-label={
              isBackendConnected
                ? 'Hệ thống đã kết nối API, mở cài đặt'
                : 'Hệ thống chưa kết nối API, mở cài đặt'
            }
            className="flex items-center gap-2 rounded-full border border-[#dce4df] bg-white/75 px-3 py-2.5 text-xs font-semibold text-[#36565d] transition-all hover:border-[#c6ac84] hover:bg-white dark:border-[#36515a] dark:bg-white/5 dark:text-[#e4e8e5]"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="hidden xl:inline">
              {isBackendConnected ? 'Đã kết nối' : 'Chưa kết nối'}
            </span>
            <Settings2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dce4df] bg-white text-[#173a45] dark:border-[#36515a] dark:bg-white/10 dark:text-white lg:hidden"
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileOpen}
            aria-controls="fc-mobile-navigation"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE / TABLET MENU */}
      {mobileOpen && (
        <nav
          id="fc-mobile-navigation"
          aria-label="Điều hướng trên thiết bị nhỏ"
          className="border-t border-[#dce4df] bg-[#f8f7f2] px-4 pb-5 pt-3 shadow-lg dark:border-[#36515a] dark:bg-[#102b36] lg:hidden"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {navigation.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#173a45] text-[#f9e7c7] dark:bg-[#e9c995] dark:text-[#173a45]'
                      : 'bg-white text-[#36565d] hover:bg-[#e9eee9] dark:bg-white/5 dark:text-[#dce7e4] dark:hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 opacity-60" />
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
