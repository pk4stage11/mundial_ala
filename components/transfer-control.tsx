"use client";

import { useState } from "react";
import { equipo } from "@/lib/data";

// Control de "arrastra o toca" para mover equipos de Disponibles -> Pasan.
// Funciona con drag & drop (escritorio) y con toque/click (móvil).
export function TransferControl({
  source,
  selected,
  max,
  onChange,
  etiquetaDisponibles = "Disponibles",
  etiquetaSeleccion = "Pasan",
  oficialesCorrectos,
}: {
  source: string[];
  selected: string[];
  max: number;
  onChange: (next: string[]) => void;
  etiquetaDisponibles?: string;
  etiquetaSeleccion?: string;
  // si se pasa, marca en verde los aciertos (modo lectura de resultados)
  oficialesCorrectos?: Set<string>;
}) {
  const [over, setOver] = useState<"sel" | "disp" | null>(null);
  const seleccionados = selected.filter((c) => source.includes(c));
  const disponibles = source.filter((c) => !seleccionados.includes(c));

  function agregar(code: string) {
    if (seleccionados.includes(code)) return;
    if (seleccionados.length >= max) return;
    onChange([...seleccionados, code]);
  }
  function quitar(code: string) {
    onChange(seleccionados.filter((c) => c !== code));
  }

  function onDrop(zone: "sel" | "disp", e: React.DragEvent) {
    e.preventDefault();
    setOver(null);
    const code = e.dataTransfer.getData("text/plain");
    if (!code) return;
    if (zone === "sel") agregar(code);
    else quitar(code);
  }

  const Chip = ({ code, zona }: { code: string; zona: "sel" | "disp" }) => {
    const e = equipo(code);
    if (!e) return null;
    const correcto = oficialesCorrectos?.has(code);
    return (
      <button
        type="button"
        draggable
        onDragStart={(ev) => ev.dataTransfer.setData("text/plain", code)}
        onClick={() => (zona === "disp" ? agregar(code) : quitar(code))}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm cursor-grab active:cursor-grabbing transition no-select ${
          correcto
            ? "border-win bg-green-50 text-win"
            : zona === "sel"
              ? "border-grass bg-green-50 text-ink hover:bg-red-50 hover:border-red-200"
              : "border-line bg-white text-ink hover:border-grass hover:bg-green-50"
        }`}
        title={zona === "disp" ? "Toca o arrastra para que pase" : "Toca para quitar"}
      >
        <span className="text-base leading-none">{e.flag}</span>
        <span className="truncate max-w-[8rem]">{e.name}</span>
      </button>
    );
  };

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {/* Disponibles */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver("disp");
        }}
        onDragLeave={() => setOver(null)}
        onDrop={(e) => onDrop("disp", e)}
        className={`rounded-xl border-2 border-dashed p-3 min-h-[5rem] transition ${
          over === "disp" ? "border-grass bg-green-50/50" : "border-line bg-slate-50"
        }`}
      >
        <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
          {etiquetaDisponibles} ({disponibles.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {disponibles.length === 0 && (
            <span className="text-sm text-muted italic">— vacío —</span>
          )}
          {disponibles.map((c) => (
            <Chip key={c} code={c} zona="disp" />
          ))}
        </div>
      </div>

      {/* Seleccionados / pasan */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver("sel");
        }}
        onDragLeave={() => setOver(null)}
        onDrop={(e) => onDrop("sel", e)}
        className={`rounded-xl border-2 p-3 min-h-[5rem] transition ${
          over === "sel"
            ? "border-grass bg-green-50"
            : seleccionados.length === max
              ? "border-grass bg-green-50/40"
              : "border-dashed border-grass/50 bg-white"
        }`}
      >
        <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide flex items-center justify-between">
          <span>{etiquetaSeleccion}</span>
          <span
            className={
              seleccionados.length === max ? "text-win" : "text-draw"
            }
          >
            {seleccionados.length}/{max}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {seleccionados.length === 0 && (
            <span className="text-sm text-muted italic">
              Arrastra o toca equipos aquí
            </span>
          )}
          {seleccionados.map((c) => (
            <Chip key={c} code={c} zona="sel" />
          ))}
        </div>
      </div>
    </div>
  );
}
