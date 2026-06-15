"use client";

import { useState } from "react";
import { GRUPOS, PARTIDOS_POR_GRUPO, equipo } from "@/lib/data";
import {
  puntosPartidoGrupos,
  golesCompletos,
  type GruposData,
  type GolesData,
} from "@/lib/standings";

export type FilaRanking = {
  usuario: { id: number; username: string };
  total: number;
  ptsGrupos: number;
  ptsElim: number;
  marcadosGrupos: number;
  marcadosElim: number;
  grupos: GruposData;
  goles: GolesData;
};

const TOTAL_GRUPOS = 72;
const TOTAL_ELIM = 31;
const MEDALLA = ["🥇", "🥈", "🥉"];

// Texto de lo que marcó el usuario en un partido.
function marcaTexto(
  matchId: string,
  local: string,
  visitante: string,
  grupos: GruposData,
  goles: GolesData,
): string {
  const g = goles[matchId];
  const r = grupos[matchId];
  if (golesCompletos(g)) return `${g.l} - ${g.v}`;
  if (r === "LOCAL") return `gana ${equipo(local)?.name}`;
  if (r === "VISITANTE") return `gana ${equipo(visitante)?.name}`;
  if (r === "EMPATE") return "empate";
  return "—";
}

export function TablaAciertos({
  ranking,
  miId,
  real,
  marcadores,
}: {
  ranking: FilaRanking[];
  miId: number | null;
  real: GruposData;
  marcadores: Record<string, string>;
}) {
  const [abierto, setAbierto] = useState<number | null>(null);

  return (
    <div className="bg-surface rounded-xl border border-line shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[520px]">
        <thead className="bg-slate-50 text-muted">
          <tr>
            <th className="text-left px-4 py-3 font-medium w-12">#</th>
            <th className="text-left px-4 py-3 font-medium">Participante</th>
            <th className="px-3 py-3 font-medium">Grupos</th>
            <th className="px-3 py-3 font-medium">Eliminatorias</th>
            <th className="px-4 py-3 font-bold text-right">Total pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {ranking.map((r, i) => {
            const soyYo = miId === r.usuario.id;
            const open = abierto === r.usuario.id;
            return (
              <FilaUsuario
                key={r.usuario.id}
                r={r}
                pos={i}
                soyYo={soyYo}
                open={open}
                onToggle={() =>
                  setAbierto(open ? null : r.usuario.id)
                }
                real={real}
                marcadores={marcadores}
              />
            );
          })}
          {ranking.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted">
                Aún no hay participantes registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FilaUsuario({
  r,
  pos,
  soyYo,
  open,
  onToggle,
  real,
  marcadores,
}: {
  r: FilaRanking;
  pos: number;
  soyYo: boolean;
  open: boolean;
  onToggle: () => void;
  real: GruposData;
  marcadores: Record<string, string>;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition hover:bg-slate-50 ${
          soyYo ? "bg-green-50" : ""
        }`}
      >
        <td className="px-4 py-3">
          <span className="font-semibold">{MEDALLA[pos] ?? pos + 1}</span>
        </td>
        <td className="px-4 py-3 font-medium">
          <span className="text-grass mr-1">{open ? "▾" : "▸"}</span>
          {r.usuario.username}
          {soyYo && <span className="ml-1 text-xs text-grass">(tú)</span>}
        </td>
        <td className="px-3 py-3 text-center">
          <div className="font-semibold text-ink">
            {r.marcadosGrupos}/{TOTAL_GRUPOS}
          </div>
          <div className="text-xs text-grass">{r.ptsGrupos} pts</div>
        </td>
        <td className="px-3 py-3 text-center">
          <div className="font-semibold text-ink">
            {r.marcadosElim}/{TOTAL_ELIM}
          </div>
          <div className="text-xs text-grass">{r.ptsElim} pts</div>
        </td>
        <td className="px-4 py-3 text-right font-bold text-pitch text-lg">
          {r.total}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={5} className="bg-slate-50 px-3 sm:px-4 py-3">
            <p className="text-sm font-semibold text-ink mb-2">
              Lo que marcó <b>{r.usuario.username}</b> en fase de grupos
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GRUPOS.map((g) => (
                <div
                  key={g.id}
                  className="bg-white rounded-lg border border-line overflow-hidden"
                >
                  <div className="bg-pitch/90 text-white text-xs font-semibold px-2.5 py-1">
                    Grupo {g.id}
                  </div>
                  <ul className="divide-y divide-line">
                    {PARTIDOS_POR_GRUPO[g.id].map((p) => {
                      const marca = marcaTexto(
                        p.id,
                        p.local,
                        p.visitante,
                        r.grupos,
                        r.goles,
                      );
                      const sinMarcar = marca === "—";
                      const rReal = real[p.id];
                      const pts = puntosPartidoGrupos(
                        r.grupos[p.id],
                        r.goles[p.id],
                        rReal,
                        marcadores[p.id],
                      );
                      return (
                        <li
                          key={p.id}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs ${
                            rReal
                              ? pts.pts > 0
                                ? "bg-green-100"
                                : "bg-red-100"
                              : ""
                          }`}
                        >
                          <span className="min-w-0 truncate">
                            {equipo(p.local)?.flag} {equipo(p.local)?.code}{" "}
                            <span className="text-muted">vs</span>{" "}
                            {equipo(p.visitante)?.code}{" "}
                            {equipo(p.visitante)?.flag}
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={
                                sinMarcar
                                  ? "text-slate-300 italic"
                                  : "font-semibold text-slate-700"
                              }
                            >
                              {marca}
                            </span>
                            {rReal && (
                              <span
                                className={`font-bold rounded px-1 ${
                                  pts.pts > 0
                                    ? "bg-green-600 text-white"
                                    : "bg-red-500 text-white"
                                }`}
                              >
                                {pts.pts > 0 ? `+${pts.pts}` : "0"}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
