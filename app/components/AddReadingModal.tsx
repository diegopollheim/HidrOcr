"use client";
import { useEffect, useRef, useState } from "react";
import { addReading, getLastReading } from "@lib/storage";
import { digitsToLiters, formatCubicMetersFromLiters, formatLiters } from "@lib/units";
import { extractReadingFromImage } from "@lib/ocrMock";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddReadingModal({ isOpen, onClose, onAdded }: Props) {
  const [mode, setMode] = useState<"none" | "manual" | "ocr">("none");
  const [manualValue, setManualValue] = useState<string>("");
  const [detectedValue, setDetectedValue] = useState<number | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | undefined>(
    undefined
  );
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<ReturnType<typeof getLastReading>>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [present, setPresent] = useState(false);
  const [show, setShow] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const digitRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const litersToDigits = (liters: number): string[] => {
    const m3Int = Math.floor(liters / 1000);
    const hundredsL = Math.floor((liters % 1000) / 100);
    const tensL = Math.floor((liters % 100) / 10);
    const m3Str = m3Int.toString().padStart(4, "0");
    return [
      m3Str[0],
      m3Str[1],
      m3Str[2],
      m3Str[3],
      String(hundredsL),
      String(tensL),
    ];
  };

  useEffect(() => {
    if (isOpen) {
      setMode("none");
      setManualValue("");
      setDetectedValue(null);
      setGeo(undefined);
      setError(null);

      const prev = getLastReading();
      setLast(prev);
      setDigits(Array(6).fill(""));
      setManualValue("");
      setImgUrl(null);
      setProcessing(false);
      setPresent(true);
      requestAnimationFrame(() => setShow(true));
      if (navigator.geolocation) {
        alert("Geolocalização disponível");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            alert("Geolocalização obtida: " + pos.coords.latitude + ", " + pos.coords.longitude);
          },
          () => {
            setGeo(undefined);
          },
          { enableHighAccuracy: true }
        );
      } else {
        alert("Geolocalização indisponível");
      }
    } else {
      setShow(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  const onFileChange = async (f: File | null) => {
    setDetectedValue(null);
    setError(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setImgUrl(url);
      setMode("ocr");
      setProcessing(true);
      try {
        const value = await extractReadingFromImage(f);
        setDetectedValue(value);
      } catch (e) {
        setError(e.message);
        setMode("none");
        setImgUrl(null);
      } finally {
        setProcessing(false);
      }
    }
  };

  const updateManualFromDigits = (arr: string[]) => {
    const liters = digitsToLiters(arr);
    setManualValue(String(liters));
    if (Number.isFinite(liters) && last && liters <= last.reading) {
      setError("A nova leitura deve ser maior que a última leitura registrada");
    } else {
      setError(null);
    }
  };

  const handleDigitChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "");
    const next = [...digits];
    next[i] = d.slice(-1) || "";
    setDigits(next);
    updateManualFromDigits(next);
    if (d && digitRefs.current[i + 1]) digitRefs.current[i + 1]?.focus();
  };

  const handleDigitKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[i] && digitRefs.current[i - 1]) {
      e.preventDefault();
      digitRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && digitRefs.current[i - 1]) {
      e.preventDefault();
      digitRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowRight" && digitRefs.current[i + 1]) {
      e.preventDefault();
      digitRefs.current[i + 1]?.focus();
    }
  };

  const allDigitsFilled = mode === "manual" && digits.every((d) => /\d/.test(d) && d.length === 1);
  const manualValid = mode === "manual" && allDigitsFilled && Number.isFinite(Number(manualValue)) && Number(manualValue) > 0;
  const ocrValid = mode === "ocr" && !processing && detectedValue !== null && Number.isFinite(detectedValue) && detectedValue > 0;
  const candidateValue = mode === "manual" ? (manualValid ? Number(manualValue) : null) : (ocrValid ? detectedValue : null);
  const canSave = candidateValue !== null && (!last || (candidateValue as number) > (last?.reading ?? 0));

  const submit = () => {
    const value = candidateValue ?? 0;
    if (!Number.isFinite(value) || value <= 0) {
      setError("Informe uma leitura válida");
      return;
    }
    if (last && value <= last.reading) {
      setError("A nova leitura deve ser maior que a última leitura registrada");
      return;
    }
    addReading(value, geo);
    onAdded();
  };

  if (!present) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 transition-opacity duration-300 ease-out ${
        show
          ? "bg-black/30 backdrop-blur-sm opacity-100"
          : "bg-black/30 backdrop-blur-sm opacity-0"
      }`}
      onTransitionEnd={() => {
        if (!show) setPresent(false);
      }}
    >
      <div
        className={`card w-full max-w-xl transform transition-all duration-300 ${
          show
            ? "opacity-100 translate-y-0 scale-100 ease-out"
            : "opacity-0 translate-y-4 scale-95 ease-in"
        }`}
      >
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-water-blue">
            Nova leitura
          </h3>
        </div>

        <div className="flex flex-col items-center gap-3">
          {mode === "manual" ? (
            <div className="w-full max-w-2xl">
              {last && (
                <div className="mb-2 text-center text-slate-600">
                  Última leitura: {litersToDigits(last.reading).join("")}
                </div>
              )}

              <div className="grid grid-cols-6 gap-2 justify-items-center">
                {digits.map((d, i) => {
                  const isRed = i >= digits.length - 2;
                  return (
                    <div
                      key={i}
                      className="w-12 h-16 rounded-md bg-black flex items-center justify-center shadow-soft"
                    >
                      <input
                        ref={(el) => (digitRefs.current[i] = el)}
                        value={d}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        inputMode="numeric"
                        maxLength={1}
                        autoFocus={i === 0}
                        className={`bg-transparent text-center w-full outline-none text-3xl font-bold ${
                          isRed ? "text-red-600" : "text-white"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-center text-sm text-slate-600">
                Valor atual:{" "}
                {formatCubicMetersFromLiters(Number(manualValue) || 0)}
              </div>
            </div>
          ) : mode === "ocr" ? (
            <div className="w-full max-w-2xl space-y-3">
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt="Prévia da captura"
                  className="w-full rounded-xl border border-water-light"
                />
              )}
              {processing ? (
                <div className="flex items-center justify-center gap-2 text-slate-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-5 h-5 animate-spin"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                  </svg>
                  <span>Processando imagem…</span>
                </div>
              ) : (
                detectedValue !== null && (
                  <div>
                    <div className="grid grid-cols-6 gap-2 justify-items-center">
                      {litersToDigits(detectedValue).map((d, i) => {
                        const isRed = i >= 4;
                        return (
                          <div
                            key={i}
                            className="w-12 h-16 rounded-md bg-black flex items-center justify-center shadow-soft"
                          >
                            <input
                              value={d}
                              readOnly
                              className={`bg-transparent text-center w-full outline-none text-3xl font-bold ${
                                isRed ? "text-red-600" : "text-white"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-center text-sm text-slate-600">
                      Leitura detectada:{" "}
                      {formatCubicMetersFromLiters(detectedValue)}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="w-full max-w-2xl grid grid-cols-2 gap-3">
              <div
                className="rounded-xl border-2 border-dashed border-water-light bg-water-gray/50 hover:bg-water-light transition p-8 text-center cursor-pointer flex flex-col items-center justify-center"
                onClick={() => cameraInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0] ?? null;
                  onFileChange(f);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-12 h-12 text-water-blue"
                >
                  <path
                    strokeWidth="1.5"
                    d="M9 7l1.5-2h3L15 7h2a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3V10a3 3 0 013-3h2z"
                  />
                  <circle cx="12" cy="13" r="4" strokeWidth="1.5" />
                </svg>
                <div className="mt-2 font-medium text-slate-700">
                  Ler pela câmera
                </div>
              </div>
              <div
                className="rounded-xl border-2 border-dashed border-water-light bg-water-gray/50 hover:bg-water-light transition p-8 text-center cursor-pointer flex flex-col items-center justify-center"
                onClick={() => { setDigits(Array(6).fill("")); setManualValue(""); setMode("manual"); }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-12 h-12 text-water-blue"
                >
                  <rect
                    x="4"
                    y="4"
                    width="6"
                    height="6"
                    rx="1.5"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="14"
                    y="4"
                    width="6"
                    height="6"
                    rx="1.5"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="4"
                    y="14"
                    width="6"
                    height="6"
                    rx="1.5"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="6"
                    height="6"
                    rx="1.5"
                    strokeWidth="1.5"
                  />
                </svg>
                <div className="mt-2 font-medium text-slate-700">
                  Digitar manualmente
                </div>
              </div>
            </div>
          )}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />

          {mode !== "ocr" && detectedValue !== null && (
            <div className="text-sm text-slate-700">
              Leitura detectada:{" "}
              <span className="font-semibold">{detectedValue}</span>
            </div>
          )}
          {geo && (
            <div className="text-sm text-slate-600">
              Lat: {geo.lat.toFixed(6)} | Lng: {geo.lng.toFixed(6)}
            </div>
          )}
          {error && (
            <div className="w-full max-w-xl rounded-xl bg-red-50 border border-red-300 text-red-700 p-3">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <button
            className="btn btn-primary w-full disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
            onClick={submit}
            disabled={!canSave}
          >
            Salvar leitura
          </button>
          <button className="btn bg-slate-100 w-full" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
