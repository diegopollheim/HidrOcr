"use client";
import { computeDailyAverage, estimateForDays } from "@lib/forecast";
import { formatLiters, formatCubicMetersFromLiters } from "@lib/units";

type Reading = {
  reading: number;
  timestamp: string;
  geo?: { lat: number; lng: number } | undefined;
};

export default function Forecast({ readings }: { readings: Reading[] }) {
  const avg = computeDailyAverage(readings);
  const week = estimateForDays(readings, 7);
  const month = estimateForDays(readings, 30);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="card">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-water-blue"><path strokeWidth="1.5" d="M4 12h16M12 4v16"/></svg>
          <div className="text-sm text-slate-600">Consumo médio diário</div>
        </div>
        <div className="text-2xl font-bold text-water-blue mt-1">{formatCubicMetersFromLiters(avg)}</div>
        <div className="text-xs text-slate-500">{formatLiters(avg)}/dia</div>
      </div>
      <div className="card">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-water-blue"><path strokeWidth="1.5" d="M5 12l5 5 9-9"/></svg>
          <div className="text-sm text-slate-600">Estimativa para 7 dias</div>
        </div>
        <div className="text-2xl font-bold text-water-blue mt-1">{formatCubicMetersFromLiters(week)}</div>
        <div className="text-xs text-slate-500">{formatLiters(week)}</div>
      </div>
      <div className="card">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-water-blue"><path strokeWidth="1.5" d="M3 7h18M3 12h18M3 17h18"/></svg>
          <div className="text-sm text-slate-600">Estimativa para 30 dias</div>
        </div>
        <div className="text-2xl font-bold text-water-blue mt-1">{formatCubicMetersFromLiters(month)}</div>
        <div className="text-xs text-slate-500">{formatLiters(month)}</div>
      </div>
    </div>
  );
}
