"use client";
import { useEffect, useState } from "react";
import AddReadingModal from "@components/AddReadingModal";
import ReadingList from "@components/ReadingList";
import Forecast from "@components/Forecast";
import { getReadings, getLastReading, addReadingsBatch, clearAllReadings } from "@lib/storage";
import type { Reading } from "@lib/storage";
import { dayjs } from "@lib/date";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    setReadings(getReadings());
  }, []);

  const refresh = () => setReadings(getReadings());

  const simulateDailyReadings = () => {
    const perDayStr = window.prompt("Quantos registros por dia?", "6");
    if (!perDayStr) return;
    const perDay = Math.max(1, Math.min(48, parseInt(perDayStr, 10) || 6));
    const daysStr = window.prompt("Quantos dias simular?", "7");
    if (!daysStr) return;
    const days = Math.max(1, Math.min(60, parseInt(daysStr, 10) || 7));
    const avgStr = window.prompt("Média de consumo diária (L)?", "800");
    if (!avgStr) return;
    const avg = Math.max(50, Math.min(5000, parseFloat(avgStr) || 800));
    const last = getLastReading();
    const totals: number[] = Array.from({ length: days }, () => {
      const noise = 0.15;
      const factor = 1 + (Math.random() * 2 - 1) * noise;
      return Math.max(1, avg * factor);
    });
    const totalSim = totals.reduce((a, b) => a + b, 0);
    let base = Math.max(0, (last?.reading ?? 0) - totalSim);
    const records: Reading[] = [];
    for (let d = days - 1; d >= 0; d--) {
      const day = dayjs().subtract(d, "day").startOf("day");
      const start = day.hour(8).minute(0).second(0);
      const end = day.hour(19).minute(0).second(0);
      const times = Array.from({ length: perDay }, () => start.valueOf() + Math.random() * (end.valueOf() - start.valueOf()));
      times.sort((a, b) => a - b);
      const weights = Array.from({ length: perDay }, () => Math.random());
      const sumW = weights.reduce((a, b) => a + b, 0) || 1;
      const dayTotal = totals[days - 1 - d];
      for (let i = 0; i < perDay; i++) {
        const inc = (weights[i] / sumW) * dayTotal;
        base += inc;
        records.push({ reading: base, timestamp: dayjs(times[i]).toISOString(), geo: undefined, simulated: true });
      }
    }
    addReadingsBatch(records);
    refresh();
  };

  const clearSimulation = () => {
    const ok = window.confirm("Remover todos os registros?");
    if (!ok) return;
    clearAllReadings();
    refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-water-blue text-white shadow-soft">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">HidrOcr</h1>
          <div className="flex gap-2">
            {/* <button className="btn btn-secondary bg-white text-water-blue hover:bg-water-light" onClick={() => setIsOpen(true)}>
              Adicionar leitura
            </button> */}
            <button className="btn bg-water-light text-white hover:bg-water-blue" onClick={simulateDailyReadings}>
              Simular consumo
            </button>
            <button className="btn bg-red-100 text-red-700 hover:bg-red-200" onClick={clearSimulation}>Limpar simulação</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6 pb-24">
        <section className="card">
          <h2 className="section-title mb-3">Previsão de consumo</h2>
          <Forecast readings={readings} />
        </section>
        <section className="card">
          <h2 className="section-title mb-3">Registros anteriores</h2>
          <ReadingList readings={readings} onAdd={() => setIsOpen(true)} onChanged={refresh} />
        </section>
      </main>
      <footer className="fixed bottom-0 inset-x-0 bg-white shadow-soft">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <button className="btn btn-primary w-full" onClick={() => setIsOpen(true)}>Adicionar leitura</button>
        </div>
      </footer>
      <AddReadingModal isOpen={isOpen} onClose={() => setIsOpen(false)} onAdded={() => { setIsOpen(false); refresh(); }} />
    </div>
  );
}
