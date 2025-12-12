"use client";
import { useState } from "react";
import { getReadings, updateReading, deleteReading } from "@lib/storage";
import { formatCubicMetersFromLiters, formatLiters } from "@lib/units";
import { dayjs } from "@lib/date";
import Link from "next/link";

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
      {sorted.slice(0, 5).map((r, idx) => (
        <div key={idx} className="card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-semibold text-water-blue">{formatCubicMetersFromLiters(r.reading)}</div>
              {r.geo && (
                <div className="text-xs text-slate-500">Lat: {r.geo.lat.toFixed(6)} | Lng: {r.geo.lng.toFixed(6)}</div>
              )}
              <div className="text-xs text-slate-500">{formatLiters(r.reading)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">{new Date(r.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              <div className="text-xs text-slate-500">{dayjs(r.timestamp).fromNow()}</div>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button aria-label="Editar" className="btn bg-slate-100" onClick={() => startEdit(r)}>Editar</button>
            <button aria-label="Excluir" className="btn bg-red-100 text-red-700" onClick={() => remove(r)}>Excluir</button>
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
      {sorted.length > 5 && (
        <div>
          <Link href="/registros" className="btn w-full">Ver mais</Link>
        </div>
      )}
      
    </div>
  );
}
