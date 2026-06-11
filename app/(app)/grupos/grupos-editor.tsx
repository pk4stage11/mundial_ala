"use client";

import { useState, useTransition, useRef } from "react";
import {
  GRUPOS,
  PARTIDOS_POR_GRUPO,
  equipo,
  type ResultadoPartido,
} from "@/lib/data";
import { FIXTURES, kickoffMs } from "@/lib/fixtures";
import { tablaGrupo, type GruposData } from "@/lib/standings";
import { TeamLabel } from "@/components/team";

type Guardar = (g: GruposData) => Promise<{ ok: boolean; error?: string }>;
type Marcadores = Record<string, string>;

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","set","oct","nov","dic"];

function fechaCorta(id: string): string {
  const f = FIXTURES[id];
  if (!f) return "";
  const [, mo, d] = f.fecha.split("-").map(Number);
  const hora = f.hora.replace(/\s*UTC.*/, "");
  return `${d} ${MESES[mo - 1]} · ${hora}`;
}

export function GruposEditor({
  inicial,
  real,
  marcadores,
  ahoraMs,
  guardar,
}: {
  inicial: GruposData;
  real: GruposData;
  marcadores: Marcadores;
  ahoraMs: number;
  guardar: Guardar;
}) {
  const [grupos, setGrupos] = useState<GruposData>(inicial);
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "error">(
    "idle",
  );
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function bloqueado(id: string): boolean {
    const k = kickoffMs(id);
    return k !== null && ahoraMs >= k;
  }

  function setResultado(matchId: string, r: ResultadoPartido) {
    if (bloqueado(matchId)) return;
    const next = { ...grupos, [matchId]: r };
    setGrupos(next);
    setEstado("guardando");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const res = await guardar(next);
        setEstado(res.ok ? "ok" : "error");
      });
    }, 500);
  }

  const total = GRUPOS.length * 6;
  const hechos = Object.values(grupos).filter(Boolean).length;

  return (
    <div className="pb-20">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {GRUPOS.map((g) => {
          const tabla = tablaGrupo(g.id, grupos);
          return (
            <div
              key={g.id}
              className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden"
            >
              <div className="bg-pitch text-white px-4 py-2 font-semibold flex items-center justify-between">
                <span>Grupo {g.id}</span>
                <span className="text-xs text-white/70">
                  {g.equipos.map((e) => e.flag).join(" ")}
                </span>
              </div>

              {/* Partidos */}
              <div className="divide-y divide-line">
                {PARTIDOS_POR_GRUPO[g.id].map((p) => {
                  const r = grupos[p.id];
                  const rReal = real[p.id];
                  const marc = marcadores[p.id];
                  const lock = bloqueado(p.id);
                  const acierto = rReal ? r === rReal : null;
                  return (
                    <div key={p.id} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex-1 text-right text-sm truncate ${
                            r === "LOCAL" ? "font-bold text-win" : ""
                          }`}
                        >
                          {equipo(p.local)?.name}{" "}
                          <span className="text-base">
                            {equipo(p.local)?.flag}
                          </span>
                        </span>
                        <div className="flex gap-0.5 no-select">
                          {(
                            [
                              ["LOCAL", "1"],
                              ["EMPATE", "X"],
                              ["VISITANTE", "2"],
                            ] as [ResultadoPartido, string][]
                          ).map(([val, lbl]) => (
                            <button
                              key={val}
                              type="button"
                              disabled={lock}
                              onClick={() => setResultado(p.id, val)}
                              className={`w-8 h-8 rounded-md text-sm font-bold transition ${
                                r === val
                                  ? val === "EMPATE"
                                    ? "bg-draw text-white"
                                    : "bg-win text-white"
                                  : "bg-slate-100 text-muted hover:bg-slate-200"
                              } ${lock ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                        <span
                          className={`flex-1 text-left text-sm truncate ${
                            r === "VISITANTE" ? "font-bold text-win" : ""
                          }`}
                        >
                          <span className="text-base">
                            {equipo(p.visitante)?.flag}
                          </span>{" "}
                          {equipo(p.visitante)?.name}
                        </span>
                      </div>

                      {/* Fecha + resultado real */}
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="text-muted flex items-center gap-1">
                          {lock && <span title="Partido jugado, bloqueado">🔒</span>}
                          {fechaCorta(p.id)}
                        </span>
                        {rReal ? (
                          <span
                            className={`font-medium flex items-center gap-1 ${
                              acierto ? "text-win" : "text-lose"
                            }`}
                          >
                            {acierto ? "✓" : "✗"} Real:{" "}
                            {marc
                              ? marc
                              : rReal === "LOCAL"
                                ? `ganó ${equipo(p.local)?.flag}`
                                : rReal === "VISITANTE"
                                  ? `ganó ${equipo(p.visitante)?.flag}`
                                  : "empate"}
                          </span>
                        ) : lock ? (
                          <span className="text-muted italic">
                            resultado pendiente
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tabla de posiciones */}
              <div className="bg-slate-50 px-3 py-2">
                <table className="w-full text-xs">
                  <thead className="text-muted">
                    <tr>
                      <th className="text-left font-medium w-6">#</th>
                      <th className="text-left font-medium">Equipo</th>
                      <th className="font-medium w-7">PJ</th>
                      <th className="font-medium w-7">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.map((f) => (
                      <tr
                        key={f.code}
                        className={
                          f.pos <= 2
                            ? "font-semibold"
                            : f.pos === 3
                              ? "text-ink/70"
                              : "text-muted"
                        }
                      >
                        <td>
                          <span
                            className={`inline-block w-4 text-center rounded ${
                              f.pos <= 2
                                ? "text-win"
                                : f.pos === 3
                                  ? "text-draw"
                                  : ""
                            }`}
                          >
                            {f.pos}
                          </span>
                        </td>
                        <td className="py-0.5">
                          <TeamLabel code={f.code} />
                        </td>
                        <td className="text-center">{f.pj}</td>
                        <td className="text-center font-bold">{f.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de estado fija */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-line px-4 py-2.5 flex items-center justify-between z-10">
        <span className="text-sm text-muted">
          {hechos}/{total} partidos
        </span>
        <span className="text-sm font-medium">
          {estado === "guardando" && (
            <span className="text-muted">Guardando…</span>
          )}
          {estado === "ok" && <span className="text-win">Guardado ✓</span>}
          {estado === "error" && (
            <span className="text-lose">Error al guardar</span>
          )}
          {estado === "idle" && (
            <span className="text-muted">Tus cambios se guardan solos</span>
          )}
        </span>
      </div>
    </div>
  );
}
