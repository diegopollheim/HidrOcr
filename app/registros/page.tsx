"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getReadings } from "@lib/storage";
import type { Reading } from "@lib/storage";
import { formatCubicMetersFromLiters, formatLiters } from "@lib/units";
import { dayjs } from "@lib/date";

type Tab = "lista" | "grafico";

function useWeekRange(offset: number) {
  const start = useMemo(() => {
    const today = dayjs();
    const dow = today.day(); // 0..6 (domingo..sábado)
    const mondayDiff = dow === 0 ? -6 : 1 - dow;
    return today.add(mondayDiff, "day").startOf("day").add(offset * 7, "day");
  }, [offset]);
  const end = useMemo(() => start.add(7, "day"), [start]);
  return { start, end };
}

function filterByRange(readings: Reading[], start: any, end: any) {
  return readings.filter((r) => {
    const d = dayjs(r.timestamp);
    return (d.isAfter(start) || d.isSame(start)) && (d.isBefore(end));
  });
}

function LineChart({ data }: { data: { x: number; y: number; label: string }[] }) {
  const width = 600;
  const height = 200;
  const padding = 24;
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (x: number) => padding + ((x - minX) / Math.max(1, maxX - minX)) * (width - padding * 2);
  const scaleY = (y: number) => height - padding - ((y - minY) / Math.max(1, maxY - minY)) * (height - padding * 2);
  const points = data.map((d) => `${scaleX(d.x)},${scaleY(d.y)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="bg-white rounded-xl border">
        <polyline points={points} fill="none" stroke="#2b6cb0" strokeWidth={2} />
        {data.map((d, i) => (
          <circle key={i} cx={scaleX(d.x)} cy={scaleY(d.y)} r={3} fill="#2b6cb0" />
        ))}
        {data.map((d, i) => (
          <text key={`x-${i}`} x={scaleX(d.x)} y={height - 6} textAnchor="middle" className="text-[10px] fill-slate-600">
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = useState<Tab>("lista");
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    setReadings(getReadings());
  }, []);

  const { start, end } = useWeekRange(weekOffset);
  const filtered = useMemo(() => {
    const sorted = [...readings].sort((a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf());
    return filterByRange(sorted, start, end);
  }, [readings, start, end]);

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => start.add(i, "day"));

  const chartData = useMemo(() => {
    const asc = [...filtered].sort((a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf());
    return asc.map((r) => ({
      x: dayjs(r.timestamp).valueOf(),
      y: r.reading,
      label: dayjs(r.timestamp).format("DD/MM"),
    }));
  }, [filtered]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-water-blue text-white shadow-soft">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-white">← Voltar</Link>
          <h1 className="text-xl font-bold">Registros</h1>
          <div className="flex gap-2">
            <button className={`btn ${tab === "lista" ? "bg-white text-water-blue" : "bg-water-light text-white"}`} onClick={() => setTab("lista")}>Lista</button>
            <button className={`btn ${tab === "grafico" ? "bg-white text-water-blue" : "bg-water-light text-white"}`} onClick={() => setTab("grafico")}>Gráfico</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6 pb-24">
        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title">Semana</div>
            <div className="flex items-center gap-2">
              <button className="btn bg-slate-100" aria-label="Semana anterior" onClick={() => setWeekOffset((o) => o - 1)}>◀</button>
              <div className="text-sm">{start.format("DD/MM")} - {end.subtract(1, "day").format("DD/MM")}</div>
              <button className="btn bg-slate-100" aria-label="Próxima semana" onClick={() => setWeekOffset((o) => o + 1)}>▶</button>
            </div>
          </div>

          {tab === "lista" && (
            <div className="space-y-3">
              {filtered.length === 0 && <div className="text-slate-600">Nenhum registro nesta semana.</div>}
              {filtered.map((r, idx) => (
                <div key={idx} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold text-water-blue">{formatCubicMetersFromLiters(r.reading)}</div>
                      <div className="text-xs text-slate-500">{formatLiters(r.reading)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600">{dayjs(r.timestamp).format("DD/MM/YYYY, HH:mm")}</div>
                      <div className="text-xs text-slate-500">{dayjs(r.timestamp).fromNow()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "grafico" && (
            <div className="space-y-4">
              <LineChart data={chartData} />
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((d, i) => (
                  <div key={i} className="rounded-xl border bg-white p-2 text-center">
                    <div className="text-xs text-slate-500">{d.format("dd")}</div>
                    <div className="text-sm">{d.format("DD")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

