"use client";
import { useEffect, useState } from "react";
import AddReadingModal from "@components/AddReadingModal";
import ReadingList from "@components/ReadingList";
import Forecast from "@components/Forecast";
import { getReadings } from "@lib/storage";
import type { Reading } from "@lib/storage";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    setReadings(getReadings());
  }, []);

  const refresh = () => setReadings(getReadings());

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-water-blue text-white shadow-soft">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">HidrOcr</h1>
          <button className="btn btn-secondary bg-white text-water-blue hover:bg-water-light" onClick={() => setIsOpen(true)}>
            Adicionar leitura
          </button>
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
