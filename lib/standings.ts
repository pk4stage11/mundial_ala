import {
  GRUPOS,
  PARTIDOS_POR_GRUPO,
  RONDAS,
  type RondaKey,
  type ResultadoPartido,
} from "./data";

// Predicción / resultado de la fase de grupos: { matchId: "LOCAL"|"EMPATE"|"VISITANTE" }
export type GruposData = Record<string, ResultadoPartido>;

export type EliminatoriasData = Partial<Record<RondaKey, string[]>>;

// Goles que predice el usuario por partido: { "A-0": { l: 2, v: 1 } }
export type Goles = { l: number | null; v: number | null };
export type GolesData = Record<string, Goles>;

// Marcadores reales por partido: { "A-0": "2-1" }
export type Marcadores = Record<string, string>;

export type Prediccion = {
  grupos: GruposData;
  gruposGoles: GolesData; // marcador exacto que apuesta el usuario
  gruposCerrados: string[]; // ids de partidos con la apuesta cerrada (no editable)
  terceros: string[]; // 8 mejores terceros elegidos
  eliminatorias: EliminatoriasData;
};

// Parsea "2-1" -> {l:2, v:1}. Devuelve null si no es un marcador válido.
export function parseMarcador(s: string | undefined): Goles | null {
  if (!s) return null;
  const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return null;
  return { l: Number(m[1]), v: Number(m[2]) };
}

export function golesCompletos(g: Goles | undefined): g is { l: number; v: number } {
  return !!g && typeof g.l === "number" && typeof g.v === "number";
}

export type Fila = {
  code: string;
  pj: number; // jugados
  g: number; // ganados
  e: number; // empatados
  p: number; // perdidos
  pts: number;
  pos: number; // 1..4 dentro del grupo
};

// Calcula la tabla de un grupo a partir de las predicciones de sus 6 partidos.
export function tablaGrupo(grupoId: string, grupos: GruposData): Fila[] {
  const g = GRUPOS.find((x) => x.id === grupoId)!;
  const stats: Record<string, Fila> = {};
  g.equipos.forEach((e) => {
    stats[e.code] = { code: e.code, pj: 0, g: 0, e: 0, p: 0, pts: 0, pos: 0 };
  });

  // head-to-head puntos para desempate
  const h2h: Record<string, number> = {};
  g.equipos.forEach((e) => (h2h[e.code] = 0));

  for (const partido of PARTIDOS_POR_GRUPO[grupoId]) {
    const r = grupos[partido.id];
    if (!r) continue;
    const L = stats[partido.local];
    const V = stats[partido.visitante];
    L.pj++;
    V.pj++;
    if (r === "LOCAL") {
      L.g++;
      L.pts += 3;
      V.p++;
      h2h[partido.local] += 3;
    } else if (r === "VISITANTE") {
      V.g++;
      V.pts += 3;
      L.p++;
      h2h[partido.visitante] += 3;
    } else {
      L.e++;
      V.e++;
      L.pts += 1;
      V.pts += 1;
      h2h[partido.local] += 1;
      h2h[partido.visitante] += 1;
    }
  }

  const indexOf = (code: string) => g.equipos.findIndex((e) => e.code === code);

  const filas = Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.g !== a.g) return b.g - a.g; // más victorias
    if (h2h[b.code] !== h2h[a.code]) return h2h[b.code] - h2h[a.code];
    return indexOf(a.code) - indexOf(b.code); // orden de bombo (cabeza de serie primero)
  });

  filas.forEach((f, i) => (f.pos = i + 1));
  return filas;
}

// ¿Están completos los 6 partidos del grupo?
export function grupoCompleto(grupoId: string, grupos: GruposData): boolean {
  return PARTIDOS_POR_GRUPO[grupoId].every((p) => !!grupos[p.id]);
}

export function todosLosGruposCompletos(grupos: GruposData): boolean {
  return GRUPOS.every((g) => grupoCompleto(g.id, grupos));
}

export function cantidadPartidosResueltos(grupos: GruposData): number {
  return Object.keys(grupos).filter((k) => grupos[k]).length;
}

// Primeros de cada grupo (12) — solo si el grupo está completo.
export function primeros(grupos: GruposData): string[] {
  return GRUPOS.filter((g) => grupoCompleto(g.id, grupos)).map(
    (g) => tablaGrupo(g.id, grupos)[0].code,
  );
}

// Segundos de cada grupo (12).
export function segundos(grupos: GruposData): string[] {
  return GRUPOS.filter((g) => grupoCompleto(g.id, grupos)).map(
    (g) => tablaGrupo(g.id, grupos)[1].code,
  );
}

// Terceros de cada grupo (12) con sus puntos, ordenados de mejor a peor.
export function tercerosRanking(
  grupos: GruposData,
): { code: string; grupo: string; pts: number; g: number }[] {
  return GRUPOS.filter((g) => grupoCompleto(g.id, grupos))
    .map((g) => {
      const fila = tablaGrupo(g.id, grupos)[2];
      return { code: fila.code, grupo: g.id, pts: fila.pts, g: fila.g };
    })
    .sort((a, b) => b.pts - a.pts || b.g - a.g);
}

// Pool de 32 equipos para dieciseisavos: 12 primeros + 12 segundos + 8 terceros elegidos.
export function pool32(grupos: GruposData, terceros: string[]): string[] {
  return [...primeros(grupos), ...segundos(grupos), ...terceros];
}

// Equipos disponibles como "fuente" para cada ronda (los que pasaron en la ronda previa).
export function fuenteRonda(
  rondaKey: RondaKey,
  pred: Prediccion,
): string[] {
  const idx = RONDAS.findIndex((r) => r.key === rondaKey);
  if (idx === 0) return pool32(pred.grupos, pred.terceros);
  const prev = RONDAS[idx - 1].key;
  return pred.eliminatorias[prev] ?? [];
}

// --- Cálculo de aciertos contra el resultado oficial -------------------------
export type PuntosPartido = { pts: number; resultadoOk: boolean; exactoOk: boolean };

// Puntos de UN partido de grupos: +1 acertar 1/X/2, +3 marcador exacto (se suman).
export function puntosPartidoGrupos(
  predResultado: ResultadoPartido | undefined,
  predGoles: Goles | undefined,
  realResultado: ResultadoPartido | undefined,
  realMarcador: string | undefined,
): PuntosPartido {
  if (!realResultado) return { pts: 0, resultadoOk: false, exactoOk: false };
  const resultadoOk = !!predResultado && predResultado === realResultado;
  const realG = parseMarcador(realMarcador);
  const exactoOk =
    !!realG &&
    golesCompletos(predGoles) &&
    predGoles.l === realG.l &&
    predGoles.v === realG.v;
  return {
    pts: (resultadoOk ? 1 : 0) + (exactoOk ? 3 : 0),
    resultadoOk,
    exactoOk,
  };
}

export type DetalleAciertos = {
  partidos: number; // puntos de fase de grupos (+1 resultado, +3 marcador exacto)
  octavos: number;
  cuartos: number;
  semis: number;
  final: number;
  campeon: number;
  total: number;
};

export function calcularAciertos(
  pred: Prediccion,
  oficial: Prediccion,
  marcadores: Marcadores = {},
): DetalleAciertos {
  // Fase de grupos: +1 por resultado 1/X/2 acertado, +3 por marcador exacto.
  let partidos = 0;
  for (const [id, r] of Object.entries(oficial.grupos)) {
    partidos += puntosPartidoGrupos(
      pred.grupos[id],
      pred.gruposGoles[id],
      r,
      marcadores[id],
    ).pts;
  }

  const inter = (a: string[] = [], b: string[] = []) => {
    const setB = new Set(b);
    return (a ?? []).filter((x) => setB.has(x)).length;
  };

  const octavos = inter(pred.eliminatorias.pasanOctavos, oficial.eliminatorias.pasanOctavos);
  const cuartos = inter(pred.eliminatorias.pasanCuartos, oficial.eliminatorias.pasanCuartos);
  const semis = inter(pred.eliminatorias.pasanSemis, oficial.eliminatorias.pasanSemis);
  const final = inter(pred.eliminatorias.pasanFinal, oficial.eliminatorias.pasanFinal);
  const campeon = inter(pred.eliminatorias.campeon, oficial.eliminatorias.campeon);

  return {
    partidos,
    octavos,
    cuartos,
    semis,
    final,
    campeon,
    total: partidos + octavos + cuartos + semis + final + campeon,
  };
}

export const PREDICCION_VACIA: Prediccion = {
  grupos: {},
  gruposGoles: {},
  gruposCerrados: [],
  terceros: [],
  eliminatorias: {},
};
