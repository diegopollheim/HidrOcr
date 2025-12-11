"use client";
import { useState } from "react";
import { getReadings, updateReading, deleteReading } from "@lib/storage";
import { formatCubicMetersFromLiters, formatLiters } from "@lib/units";

type Reading = {
  reading: number;
  timestamp: string;
  geo?: { lat: number; lng: number } | undefined;
};

export default function ReadingList({ readings, onAdd, onChanged }: { readings: Reading[]; onAdd: () => void; onChanged: () => void }) {
  const sorted = [...readings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const getIndex = (timestamp: string) => getReadings().findIndex((x) => x.timestamp === timestamp);

  const startEdit = (r: Reading) => {
    setEditing(r.timestamp);
    setValue(String(r.reading));
    setError(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setValue("");
    setError(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    const idx = getIndex(editing);
    if (idx < 0) return;
    const arr = getReadings();
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Informe uma leitura válida");
      return;
    }
    const prev = arr[idx - 1];
    const next = arr[idx + 1];
    if (prev && num <= prev.reading) {
      setError("A leitura deve ser maior que a anterior");
      return;
    }
    if (next && num > next.reading) {
      setError("A leitura não pode ultrapassar a próxima");
      return;
    }
    updateReading(idx, num);
    cancelEdit();
    onChanged();
  };

  const remove = (r: Reading) => {
    const idx = getIndex(r.timestamp);
    if (idx < 0) return;
    const ok = window.confirm("Excluir este registro?");
    if (!ok) return;
    deleteReading(idx);
    if (editing === r.timestamp) cancelEdit();
    onChanged();
  };

  return (
    <div className="space-y-3">
      {sorted.length === 0 && (
        <div className="text-slate-600">Nenhum registro ainda. Clique em "Adicionar leitura".</div>
      )}
      {sorted.map((r, idx) => (
        <div key={idx} className="card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-water-blue">{formatCubicMetersFromLiters(r.reading)}</div>
              <div className="text-sm text-slate-600">{new Date(r.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              {r.geo && (
                <div className="text-xs text-slate-500">Lat: {r.geo.lat.toFixed(6)} | Lng: {r.geo.lng.toFixed(6)}</div>
              )}
              <div className="text-xs text-slate-500">{formatLiters(r.reading)}</div>
            </div>
            <div className="flex gap-2">
              <button aria-label="Editar" title="Editar" className="btn bg-slate-100" onClick={() => startEdit(r)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-slate-700">
                  <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.5" />
                  <path strokeWidth="1.5" d="M8 16l8-8" />
                </svg>
              </button>
              <button aria-label="Excluir" title="Excluir" className="btn bg-red-100 text-red-700" onClick={() => remove(r)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                  <path strokeWidth="1.5" d="M4 7h16" />
                  <path strokeWidth="1.5" d="M10 7V5h4v2" />
                  <path strokeWidth="1.5" d="M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7" />
                </svg>
              </button>
            </div>
          </div>
          {editing === r.timestamp && (
            <div className="mt-3 flex items-center gap-2">
              <input type="number" min={0} className="input" value={value} onChange={(e) => setValue(e.target.value)} />
              <button className="btn btn-primary" onClick={saveEdit}>Salvar</button>
              <button className="btn bg-slate-100" onClick={cancelEdit}>Cancelar</button>
            </div>
          )}
          {error && editing === r.timestamp && (
            <div className="mt-2 rounded-xl bg-red-50 border border-red-300 text-red-700 p-3">{error}</div>
          )}
        </div>
      ))}
      
    </div>
  );
}
