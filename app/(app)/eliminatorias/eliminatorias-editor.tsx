"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { GRUPOS, equipo } from "@/lib/data";
import {
  tercerosRanking,
  todosLosGruposCompletos,
  grupoCompleto,
  primeros,
  segundos,
  type EliminatoriasData,
  type GruposData,
} from "@/lib/standings";
import {
  resolverBracket,
  roundDe,
  ORDEN_PARTIDOS_BRACKET,
  type RoundKey,
} from "@/lib/bracket";
import { TransferControl } from "@/components/transfer-control";
import { BracketView } from "@/components/bracket-view";

type Guardar = (data: {
  terceros: string[];
  eliminatorias: EliminatoriasData;
}) => Promise<{ ok: boolean; error?: string }>;

type PorRonda = Record<RoundKey, string[]>;

const VACIO: PorRonda = {
  pasanOctavos: [],
  pasanCuartos: [],
  pasanSemis: [],
  pasanFinal: [],
  campeon: [],
};

export function EliminatoriasEditor({
  grupos,
  inicialTerceros,
  inicialElim,
  guardar,
}: {
  grupos: GruposData;
  inicialTerceros: string[];
  inicialElim: EliminatoriasData;
  guardar: Guardar;
}) {
  const completos = todosLosGruposCompletos(grupos);

  const rankingTerceros = useMemo(() => tercerosRanking(grupos), [grupos]);
  const codigosTerceros = useMemo(
    () => rankingTerceros.map((t) => t.code),
    [rankingTerceros],
  );
  const pri = useMemo(() => primeros(grupos), [grupos]);
  const seg = useMemo(() => segundos(grupos), [grupos]);

  const [terceros, setTerceros] = useState<string[]>(
    inicialTerceros.filter((c) => codigosTerceros.includes(c)).slice(0, 8),
  );
  const [porRonda, setPorRonda] = useState<PorRonda>({
    ...VACIO,
    ...inicialElim,
  });
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "error">(
    "idle",
  );
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resuelto = useMemo(
    () => resolverBracket(grupos, terceros, porRonda),
    [grupos, terceros, porRonda],
  );

  function persistir(t: string[], pr: PorRonda) {
    setEstado("guardando");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const res = await guardar({ terceros: t, eliminatorias: pr });
        setEstado(res.ok ? "ok" : "error");
      });
    }, 500);
  }

  function cambiarTerceros(next: string[]) {
    const t = next.filter((c) => codigosTerceros.includes(c)).slice(0, 8);
    const r = resolverBracket(grupos, t, porRonda);
    setTerceros(t);
    setPorRonda(r.porRonda);
    persistir(t, r.porRonda);
  }

  function aplicar(candidato: PorRonda) {
    const r = resolverBracket(grupos, terceros, candidato);
    setPorRonda(r.porRonda);
    persistir(terceros, r.porRonda);
  }

  function pick(matchId: number, team: string) {
    const round = roundDe(matchId);
    const [a, b] = resuelto.participantes[matchId];
    // si tocas al que ya ganaba, se quita (toggle)
    if (resuelto.ganador[matchId] === team) {
      aplicar({ ...porRonda, [round]: (porRonda[round] ?? []).filter((c) => c !== team) });
      return;
    }
    // fija el ganador de ESTE partido: quita ambos participantes del set y mete el elegido
    const limpio = (porRonda[round] ?? []).filter((c) => c !== a && c !== b);
    aplicar({ ...porRonda, [round]: [...limpio, team] });
  }

  function quitar(matchId: number) {
    const round = roundDe(matchId);
    const w = resuelto.ganador[matchId];
    if (!w) return;
    aplicar({ ...porRonda, [round]: (porRonda[round] ?? []).filter((c) => c !== w) });
  }

  // llaves con ambos equipos definidos pero sin ganador elegido
  const pendientes = ORDEN_PARTIDOS_BRACKET.filter((mid) => {
    const [a, b] = resuelto.participantes[mid];
    return a && b && !resuelto.ganador[mid];
  }).length;

  if (!completos) {
    const faltan = GRUPOS.filter((g) => !grupoCompleto(g.id, grupos)).map(
      (g) => g.id,
    );
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center max-w-2xl mx-auto">
        <div className="text-4xl mb-2">⚽</div>
        <h2 className="font-bold text-ink text-lg">
          Primero completa la fase de grupos
        </h2>
        <p className="text-muted text-sm mt-1">
          Te faltan resultados en los grupos: <b>{faltan.join(", ")}</b>. Cuando
          termines, aquí se llenará el cuadro con tus 1°, 2° y mejores terceros.
        </p>
        <Link
          href="/grupos"
          className="inline-block mt-4 bg-grass text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-700"
        >
          Ir a la fase de grupos
        </Link>
      </div>
    );
  }

  const totalElegidos = pri.length + seg.length + terceros.length;

  return (
    <div className="space-y-5 pb-20">
      {/* Paso 1: mejores terceros */}
      <section className="bg-surface rounded-xl border border-line shadow-sm p-4">
        <h2 className="font-bold text-ink flex items-center gap-2">
          <span className="bg-gold/20 text-amber-700 rounded-full w-6 h-6 inline-flex items-center justify-center text-sm">
            1
          </span>
          Elige los 8 mejores terceros
          <span className="text-muted font-normal text-sm">
            ({terceros.length}/8)
          </span>
        </h2>
        <p className="text-muted text-sm mt-1 mb-3">
          De los 12 terceros de grupo, 8 clasifican a dieciseisavos. Con tus 1°,
          2° y estos terceros se llenan los casilleros del cuadro de abajo.
        </p>
        <TransferControl
          source={codigosTerceros}
          selected={terceros}
          max={8}
          onChange={cambiarTerceros}
          etiquetaDisponibles="Terceros de grupo"
          etiquetaSeleccion="Mejores terceros (pasan)"
        />
      </section>

      {/* Paso 2: el cuadro */}
      <section>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h2 className="font-bold text-ink flex items-center gap-2">
            <span className="bg-grass/20 text-green-700 rounded-full w-6 h-6 inline-flex items-center justify-center text-sm">
              2
            </span>
            El cuadro ({totalElegidos}/32 clasificados)
          </h2>
          <p className="text-xs text-muted">
            Toca el equipo que gana cada llave para que avance. Para deshacer,
            toca de nuevo al elegido o usa la <b className="text-lose">✕</b>.
          </p>
        </div>

        {(totalElegidos < 32 || pendientes > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800 mb-2">
            {totalElegidos < 32 ? (
              <>Faltan {32 - totalElegidos} terceros para completar los 32 de dieciseisavos.</>
            ) : (
              <>
                Te faltan <b>{pendientes}</b> llave{pendientes === 1 ? "" : "s"} por
                elegir hasta llegar al campeón.
              </>
            )}
          </div>
        )}
        {totalElegidos === 32 && pendientes === 0 && resuelto.ganador[104] && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800 mb-2">
            ¡Cuadro completo! Tu campeón está elegido. ✓
          </div>
        )}

        <BracketView resuelto={resuelto} onPick={pick} onClear={quitar} />
      </section>

      {/* Barra de estado fija */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-line px-4 py-2.5 flex items-center justify-between z-10">
        <span className="text-sm text-muted">
          {resuelto.ganador[104]
            ? `Tu campeón: ${equipo(resuelto.ganador[104])?.flag} ${
                equipo(resuelto.ganador[104])?.name
              }`
            : "Completa el cuadro hasta el campeón"}
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
