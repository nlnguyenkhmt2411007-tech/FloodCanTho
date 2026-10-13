import React from 'react';
import { Layers, Info } from 'lucide-react';
import { RISK_LEVELS } from '../types/flood';

export const MapLegend: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-blue-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Chú giải phân cấp ngập lụt
        </h4>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* Level 0: Không ngập */}
        <div className="flex items-start gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0 mt-0.5 shadow-sm" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {RISK_LEVELS[0].name}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {RISK_LEVELS[0].depthRange}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mặt đường khô ráo hoặc đọng nước không đáng kể, thoát nước tốt.
            </p>
          </div>
        </div>

        {/* Level 1: Ngập nhẹ */}
        <div className="flex items-start gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0 mt-0.5 shadow-sm" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {RISK_LEVELS[1].name}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {RISK_LEVELS[1].depthRange}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Đọng nước mép đường và vùng trũng, xe máy đi chậm, chưa gây tắc nghẽn.
            </p>
          </div>
        </div>

        {/* Level 2: Ngập nặng */}
        <div className="flex items-start gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0 mt-0.5 shadow-sm" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {RISK_LEVELS[2].name}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {RISK_LEVELS[2].depthRange}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Vượt ngưỡng thử nghiệm 0,30 m; tràn vỉa hè, xe máy chết máy, ngập diện rộng.
            </p>
          </div>
        </div>

        {/* Bounding box indicator */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-4 h-3 rounded border-2 border-dashed border-blue-600 bg-blue-50 dark:bg-blue-950/40 shrink-0" />
          <span>Khung ranh giới raster thực nghiệm Cần Thơ (Bounding Box)</span>
        </div>
      </div>
    </div>
  );
};
