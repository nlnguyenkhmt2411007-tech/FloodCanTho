import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BarChart3, Map as MapIcon } from 'lucide-react';

type Counts = { green: number; yellow: number; red: number; total: number };
const STUDY_BOUNDS: L.LatLngBoundsExpression = [
  [10.032220, 105.737369],
  [10.060782, 105.763636],
];

function MiniStudyMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);
    L.rectangle(STUDY_BOUNDS, {
      color: '#2563eb', weight: 2, dashArray: '6 5', fillColor: '#2563eb', fillOpacity: 0.08,
    }).addTo(map);
    map.fitBounds(STUDY_BOUNDS, { padding: [28, 28], animate: false });
    const timer = window.setTimeout(() => map.invalidateSize(), 80);
    return () => { window.clearTimeout(timer); map.remove(); };
  }, []);
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200">
      <div ref={containerRef} className="w-full bg-slate-100" style={{ height: "180px", minHeight: "180px", maxHeight: "180px" }} aria-label="Bản đồ tổng quan phạm vi nghiên cứu" />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-md bg-white/95 px-2 py-1 text-[10px] font-medium text-blue-700 shadow-sm">
        Phạm vi nghiên cứu
      </div>
    </div>
  );
}

export function FloodLeftCards() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/data/flood_road_points_100years.geojson', { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('GeoJSON not found'); return response.json(); })
      .then((data: { features?: Array<{ properties?: Record<string, unknown> }> }) => {
        const result: Counts = { green: 0, yellow: 0, red: 0, total: 0 };
        for (const feature of data.features ?? []) {
          const p = feature.properties ?? {};
          const raw = p.depth_m ?? p.max_depth_m ?? p.flood_depth_m ?? p.depth;
          const depth = typeof raw === 'number' ? raw : (typeof raw === 'string' && raw.trim() ? Number(raw) : NaN);
          if (!Number.isFinite(depth) || depth < 0) continue;
          result.total += 1;
          if (depth < 0.05) result.green += 1;
          else if (depth < 0.30) result.yellow += 1;
          else result.red += 1;
        }
        setCounts(result);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(true);
      });
    return () => controller.abort();
  }, []);

  const rows = [
    { label: 'Không ngập', range: 'Dưới 0,05 m', count: counts?.green, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
    { label: 'Ngập nhẹ', range: '0,05 đến dưới 0,30 m', count: counts?.yellow, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-400' },
    { label: 'Ngập nặng', range: 'Từ 0,30 m', count: counts?.red, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100', dot: 'bg-rose-500' },
  ];
  return (
    <div className="mt-4 space-y-4" data-flood-left-cards="FLOOD_LEFT_CARDS_V1">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Thống kê điểm ngập</h2>
        </div>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${row.bg}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} />
                <div>
                  <div className={`text-xs font-semibold ${row.color}`}>{row.label}</div>
                  <div className="text-[10px] text-slate-500">{row.range}</div>
                </div>
              </div>
              <strong className={`text-xl tabular-nums ${row.color}`}>{error ? '—' : counts ? row.count?.toLocaleString('vi-VN') : '…'}</strong>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
          {error ? 'Không tải được dữ liệu điểm ngập mô phỏng.' : counts ? `${counts.total.toLocaleString('vi-VN')} điểm mẫu trong tệp GeoJSON của kịch bản T=100 năm.` : 'Đang đọc dữ liệu mô phỏng…'}
          {' '}Không phải quan trắc hay cảnh báo ngập thời gian thực.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Bản đồ tổng quan</h2>
        </div>
        <MiniStudyMap />
        <p className="mt-2 text-[10px] text-slate-500">Khung xanh nét đứt: phạm vi nghiên cứu tại Cần Thơ.</p>
      </section>
    </div>
  );
}


