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

export type Prediccion = {
  grupos: GruposData;
  terceros: string[]; // 8 mejores terceros elegidos
  eliminatorias: EliminatoriasData;
};

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
export type DetalleAciertos = {
  partidos: number; // aciertos en resultados de fase de grupos
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
): DetalleAciertos {
  // Fase de grupos: cada partido con mismo resultado = 1 punto
  let partidos = 0;
  for (const [id, r] of Object.entries(oficial.grupos)) {
    if (r && pred.grupos[id] === r) partidos++;
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
  terceros: [],
  eliminatorias: {},
};
