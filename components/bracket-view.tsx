"use client";

import { equipo } from "@/lib/data";
import {
  R32,
  etiquetaSeed,
  type ResueltoBracket,
} from "@/lib/bracket";

const LEFT_R32 = [74, 77, 73, 75, 83, 84, 81, 82];
const LEFT_R16 = [89, 90, 93, 94];
const LEFT_QF = [97, 98];
const LEFT_SF = [101];
const RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87];
const RIGHT_R16 = [91, 92, 95, 96];
const RIGHT_QF = [99, 100];
const RIGHT_SF = [102];

function TeamRow({
  code,
  placeholder,
  esGanador,
  decidido,
  side,
  onClick,
}: {
  code: string | null;
  placeholder: string;
  esGanador: boolean;
  decidido: boolean;
  side: "left" | "right";
  onClick?: () => void;
}) {
  const e = equipo(code);
  const base =
    "flex items-center gap-1.5 px-2 h-7 text-xs w-full transition cursor-pointer";
  const align = side === "right" ? "flex-row-reverse text-right" : "";
  let estilo =
    "text-muted hover:bg-slate-100"; // vacío o no elegido
  if (e) {
    if (esGanador) estilo = "bg-green-100 text-green-800 font-bold";
    else if (decidido) estilo = "text-slate-400 opacity-60 hover:bg-slate-100";
    else estilo = "text-ink hover:bg-green-50";
  }

  return (
    <button
      type="button"
      onClick={e ? onClick : undefined}
      disabled={!e}
      className={`${base} ${align} ${estilo} ${!e ? "cursor-default" : ""}`}
    >
      {e ? (
        <>
          <span className="text-sm leading-none">{e.flag}</span>
          <span className="truncate">{e.name}</span>
        </>
      ) : (
        <span className="italic text-[10px] text-slate-400">{placeholder}</span>
      )}
    </button>
  );
}

function MatchCard({
  matchId,
  resuelto,
  side,
  onPick,
  onClear,
}: {
  matchId: number;
  resuelto: ResueltoBracket;
  side: "left" | "right";
  onPick: (matchId: number, team: string) => void;
  onClear: (matchId: number) => void;
}) {
  const [a, b] = resuelto.participantes[matchId];
  const win = resuelto.ganador[matchId];
  const decidido = !!win;

  // etiquetas de casillero vacío (solo dieciseisavos tienen seed legible)
  let phA = "—";
  let phB = "—";
  if (matchId <= 88) {
    phA = etiquetaSeed(R32[matchId][0]);
    phB = etiquetaSeed(R32[matchId][1]);
  }

  return (
    <div
      className={`relative bg-white border rounded-md shadow-sm overflow-hidden divide-y divide-line w-full ${
        decidido ? "border-grass" : "border-line"
      }`}
    >
      {decidido && (
        <button
          type="button"
          onClick={() => onClear(matchId)}
          title="Quitar elección"
          className={`absolute top-1/2 -translate-y-1/2 ${
            side === "right" ? "left-1" : "right-1"
          } z-10 w-4 h-4 rounded-full bg-red-100 text-lose text-[10px] leading-none flex items-center justify-center hover:bg-red-200`}
        >
          ✕
        </button>
      )}
      <TeamRow
        code={a}
        placeholder={phA}
        side={side}
        esGanador={!!a && win === a}
        decidido={decidido}
        onClick={() => a && onPick(matchId, a)}
      />
      <TeamRow
        code={b}
        placeholder={phB}
        side={side}
        esGanador={!!b && win === b}
        decidido={decidido}
        onClick={() => b && onPick(matchId, b)}
      />
    </div>
  );
}

function Col({
  matches,
  resuelto,
  side,
  width,
  onPick,
  onClear,
  titulo,
}: {
  matches: number[];
  resuelto: ResueltoBracket;
  side: "left" | "right";
  width: string;
  onPick: (matchId: number, team: string) => void;
  onClear: (matchId: number) => void;
  titulo: string;
}) {
  return (
    <div className={`flex flex-col ${width} shrink-0`}>
      <p className="text-[10px] uppercase tracking-wide text-white/50 text-center mb-1 h-3">
        {titulo}
      </p>
      <div className="flex flex-col justify-around flex-1 gap-2">
        {matches.map((m) => (
          <MatchCard
            key={m}
            matchId={m}
            resuelto={resuelto}
            side={side}
            onPick={onPick}
            onClear={onClear}
          />
        ))}
      </div>
    </div>
  );
}

export function BracketView({
  resuelto,
  onPick,
  onClear,
}: {
  resuelto: ResueltoBracket;
  onPick: (matchId: number, team: string) => void;
  onClear: (matchId: number) => void;
}) {
  const campeon = resuelto.ganador[104];
  const finalParts = resuelto.participantes[104];

  return (
    <div className="bg-gradient-to-b from-pitch to-pitch-dark rounded-2xl p-3 sm:p-5 overflow-x-auto">
      <div className="flex items-stretch gap-1.5 sm:gap-3 min-w-[1080px] min-h-[520px]">
        {/* Lado izquierdo */}
        <Col matches={LEFT_R32} resuelto={resuelto} side="left" width="w-40" onPick={onPick} onClear={onClear} titulo="Dieciseisavos" />
        <Col matches={LEFT_R16} resuelto={resuelto} side="left" width="w-36" onPick={onPick} onClear={onClear} titulo="Octavos" />
        <Col matches={LEFT_QF} resuelto={resuelto} side="left" width="w-36" onPick={onPick} onClear={onClear} titulo="Cuartos" />
        <Col matches={LEFT_SF} resuelto={resuelto} side="left" width="w-36" onPick={onPick} onClear={onClear} titulo="Semis" />

        {/* Centro: final + campeón */}
        <div className="flex flex-col items-center justify-center w-40 sm:w-48 shrink-0 px-1">
          <div className="text-3xl mb-1">🏆</div>
          <p className="text-gold font-bold text-xs uppercase tracking-wide mb-2 text-center">
            Campeón del mundo
          </p>
          <div className="w-full bg-white/95 border-2 border-gold rounded-lg shadow-lg overflow-hidden divide-y divide-line mb-2">
            <TeamRow
              code={finalParts[0]}
              placeholder="Finalista 1"
              side="left"
              esGanador={!!finalParts[0] && campeon === finalParts[0]}
              decidido={!!campeon}
              onClick={() => finalParts[0] && onPick(104, finalParts[0])}
            />
            <TeamRow
              code={finalParts[1]}
              placeholder="Finalista 2"
              side="left"
              esGanador={!!finalParts[1] && campeon === finalParts[1]}
              decidido={!!campeon}
              onClick={() => finalParts[1] && onPick(104, finalParts[1])}
            />
          </div>
          {campeon ? (
            <p className="text-center text-white font-bold text-sm">
              {equipo(campeon)?.flag} {equipo(campeon)?.name}
            </p>
          ) : (
            <p className="text-center text-white/50 text-[11px]">
              Elige al ganador de la final
            </p>
          )}
        </div>

        {/* Lado derecho */}
        <Col matches={RIGHT_SF} resuelto={resuelto} side="right" width="w-36" onPick={onPick} onClear={onClear} titulo="Semis" />
        <Col matches={RIGHT_QF} resuelto={resuelto} side="right" width="w-36" onPick={onPick} onClear={onClear} titulo="Cuartos" />
        <Col matches={RIGHT_R16} resuelto={resuelto} side="right" width="w-36" onPick={onPick} onClear={onClear} titulo="Octavos" />
        <Col matches={RIGHT_R32} resuelto={resuelto} side="right" width="w-40" onPick={onPick} onClear={onClear} titulo="Dieciseisavos" />
      </div>
    </div>
  );
}
