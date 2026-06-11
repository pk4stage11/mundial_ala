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

type Guardar = (data: {
  grupos: GruposData;
  gruposCerrados: string[];
}) => Promise<{ ok: boolean; error?: string }>;
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
  cerradosIniciales,
  real,
  marcadores,
  ahoraMs,
  guardar,
}: {
  inicial: GruposData;
  cerradosIniciales: string[];
  real: GruposData;
  marcadores: Marcadores;
  ahoraMs: number;
  guardar: Guardar;
}) {
  const [grupos, setGrupos] = useState<GruposData>(inicial);
  const [cerrados, setCerrados] = useState<string[]>(cerradosIniciales);
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "error">(
    "idle",
  );
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function jugado(id: string): boolean {
    const k = kickoffMs(id);
    return k !== null && ahoraMs >= k;
  }
  function bloqueado(id: string): boolean {
    return jugado(id) || cerrados.includes(id);
  }

  function persist(g: GruposData, c: string[]) {
    setEstado("guardando");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const res = await guardar({ grupos: g, gruposCerrados: c });
        setEstado(res.ok ? "ok" : "error");
      });
    }, 400);
  }

  function setResultado(matchId: string, r: ResultadoPartido) {
    if (bloqueado(matchId)) return;
    const next = { ...grupos, [matchId]: r };
    setGrupos(next);
    persist(next, cerrados);
  }

  function cerrarApuesta(matchId: string) {
    if (!grupos[matchId] || cerrados.includes(matchId) || jugado(matchId)) return;
    if (
      !confirm(
        "¿Cerrar esta apuesta? Una vez cerrada NO podrás cambiarla.",
      )
    )
      return;
    const next = [...cerrados, matchId];
    setCerrados(next);
    persist(grupos, next);
  }

  const total = GRUPOS.length * 6;
  const hechos = Object.values(grupos).filter(Boolean).length;
  const cerradas = cerrados.length;

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
              <div className="bg-pitch text-white px-3 py-2 font-semibold flex items-center justify-between">
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
                  const cerrada = cerrados.includes(p.id);
                  const lock = bloqueado(p.id);
                  const acierto = rReal ? r === rReal : null;
                  return (
                    <div key={p.id} className="px-2.5 py-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex-1 min-w-0 truncate text-right text-[13px] sm:text-sm ${
                            r === "LOCAL" ? "font-bold text-win" : ""
                          }`}
                        >
                          {equipo(p.local)?.name}{" "}
                          <span className="text-base">
                            {equipo(p.local)?.flag}
                          </span>
                        </span>

                        <div className="flex items-center gap-0.5 no-select shrink-0">
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
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-sm font-bold transition ${
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

                          {/* Check de confirmar / cerrar apuesta */}
                          <button
                            type="button"
                            onClick={() => cerrarApuesta(p.id)}
                            disabled={!r || cerrada || jugado(p.id)}
                            title={
                              cerrada
                                ? "Apuesta cerrada"
                                : !r
                                  ? "Primero elige un resultado"
                                  : "Cerrar apuesta (no podrás cambiarla)"
                            }
                            className={`ml-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-sm font-bold transition ${
                              cerrada
                                ? "bg-win text-white"
                                : r && !jugado(p.id)
                                  ? "border-2 border-win text-win hover:bg-green-50"
                                  : "border-2 border-line text-slate-300 cursor-not-allowed"
                            }`}
                          >
                            ✓
                          </button>
                        </div>

                        <span
                          className={`flex-1 min-w-0 truncate text-left text-[13px] sm:text-sm ${
                            r === "VISITANTE" ? "font-bold text-win" : ""
                          }`}
                        >
                          <span className="text-base">
                            {equipo(p.visitante)?.flag}
                          </span>{" "}
                          {equipo(p.visitante)?.name}
                        </span>
                      </div>

                      {/* Fecha + estado + resultado real */}
                      <div className="flex items-center justify-between mt-1 text-[11px] gap-2">
                        <span className="text-muted flex items-center gap-1 min-w-0 truncate">
                          {cerrada ? (
                            <span className="text-win font-medium">
                              ✓ apuesta cerrada
                            </span>
                          ) : jugado(p.id) ? (
                            <span>🔒 {fechaCorta(p.id)}</span>
                          ) : (
                            <span>{fechaCorta(p.id)}</span>
                          )}
                        </span>
                        {rReal && (
                          <span
                            className={`font-medium flex items-center gap-1 shrink-0 ${
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
                        )}
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
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-line px-3 sm:px-4 py-2.5 flex items-center justify-between z-10 gap-2">
        <span className="text-xs sm:text-sm text-muted truncate">
          {hechos}/{total} marcados · {cerradas} cerradas 🔒
        </span>
        <span className="text-xs sm:text-sm font-medium shrink-0">
          {estado === "guardando" && (
            <span className="text-muted">Guardando…</span>
          )}
          {estado === "ok" && <span className="text-win">Guardado ✓</span>}
          {estado === "error" && (
            <span className="text-lose">Error al guardar</span>
          )}
          {estado === "idle" && (
            <span className="text-muted hidden sm:inline">
              Tus cambios se guardan solos
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
