import React from 'react';
import { ReturnPeriod, SCENARIOS } from '../types/flood';
import { Calendar, HelpCircle, Waves } from 'lucide-react';

interface ScenarioSelectorProps {
  selectedPeriod: ReturnPeriod;
  onSelectPeriod: (period: ReturnPeriod) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod,
}) => {
  const currentScenario = SCENARIOS.find((s) => s.period === selectedPeriod)!;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Kịch bản chu kỳ lặp lại (Return Period)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mô phỏng thủy văn chu kỳ lặp lại T năm (không phải thời gian thực)
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-md self-start sm:self-auto border border-slate-100 dark:border-slate-800">
          Xác suất năm: <strong className="text-blue-600 dark:text-blue-400">{currentScenario.probabilityAnnual}</strong>
        </div>
      </div>

      {/* Segmented Period Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl mb-3">
        {SCENARIOS.map((sc) => {
          const isActive = selectedPeriod === sc.period;
          return (
            <button
              key={sc.period}
              type="button"
              onClick={() => onSelectPeriod(sc.period)}
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="block text-[10px] uppercase font-normal opacity-80">Chu kỳ</span>
              <span>{sc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scenario Context Description */}
      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-start gap-2">
          <Waves className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">
              {currentScenario.title}:
            </span>{' '}
            <span>{currentScenario.description}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
