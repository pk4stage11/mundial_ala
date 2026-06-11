// Estructura OFICIAL del cuadro de eliminatorias del Mundial 2026
// (dieciseisavos M73–M88 → octavos M89–M96 → cuartos M97–M100 →
//  semifinales M101–M102 → final M104). Fuente: Wikipedia (knockout stage).

import { GRUPO_DE_EQUIPO } from "./data";
import { tablaGrupo, grupoCompleto, type GruposData } from "./standings";

// Un casillero de dieciseisavos puede ser: 1° de grupo, 2° de grupo, o un
// "mejor tercero" que sale de un conjunto de grupos posibles.
export type Seed =
  | { tipo: "pos"; grupo: string; pos: 0 | 1 }
  | { tipo: "tercero"; grupos: string[] };

const p1 = (g: string): Seed => ({ tipo: "pos", grupo: g, pos: 0 });
const p2 = (g: string): Seed => ({ tipo: "pos", grupo: g, pos: 1 });
const t = (grupos: string): Seed => ({ tipo: "tercero", grupos: grupos.split("") });

// Dieciseisavos: id de partido -> [casillero A, casillero B]
export const R32: Record<number, [Seed, Seed]> = {
  73: [p2("A"), p2("B")],
  74: [p1("E"), t("ABCDF")],
  75: [p1("F"), p2("C")],
  76: [p1("C"), p2("F")],
  77: [p1("I"), t("CDFGH")],
  78: [p2("E"), p2("I")],
  79: [p1("A"), t("CEFHI")],
  80: [p1("L"), t("EHIJK")],
  81: [p1("D"), t("BEFIJ")],
  82: [p1("G"), t("AEHIJ")],
  83: [p2("K"), p2("L")],
  84: [p1("H"), p2("J")],
  85: [p1("B"), t("EFGIJ")],
  86: [p1("J"), p2("H")],
  87: [p1("K"), t("DEIJL")],
  88: [p2("D"), p2("G")],
};

// Partidos que alimentan a cada partido posterior.
export const FEEDERS: Record<number, [number, number]> = {
  89: [74, 77],
  90: [73, 75],
  91: [76, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
  101: [97, 98],
  102: [99, 100],
  104: [101, 102],
};

// Clave de ronda (coincide con EliminatoriasData) según el id de partido.
// El ganador de un partido "llega" a la ronda indicada.
export type RoundKey =
  | "pasanOctavos"
  | "pasanCuartos"
  | "pasanSemis"
  | "pasanFinal"
  | "campeon";

export function roundDe(matchId: number): RoundKey {
  if (matchId <= 88) return "pasanOctavos";
  if (matchId <= 96) return "pasanCuartos";
  if (matchId <= 100) return "pasanSemis";
  if (matchId <= 102) return "pasanFinal";
  return "campeon";
}

// Orden de procesamiento: dieciseisavos primero, luego hacia la final.
export const ORDEN_PARTIDOS_BRACKET: number[] = [
  73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, // R32
  89, 90, 91, 92, 93, 94, 95, 96, // R16
  97, 98, 99, 100, // QF
  101, 102, // SF
  104, // Final
];

// Casilleros de terceros y los grupos admitidos en cada uno.
const SLOTS_TERCEROS: { match: number; grupos: string[] }[] = Object.entries(R32)
  .flatMap(([id, seeds]) =>
    seeds
      .filter((s) => s.tipo === "tercero")
      .map((s) => ({
        match: Number(id),
        grupos: (s as { grupos: string[] }).grupos,
      })),
  );

// Asigna los terceros elegidos a los casilleros de tercero respetando los
// grupos admitidos (emparejamiento por backtracking, como la tabla de FIFA).
export function asignarTerceros(terceros: string[]): Record<number, string | null> {
  const res: Record<number, string | null> = {};
  SLOTS_TERCEROS.forEach((s) => (res[s.match] = null));

  const items = terceros.map((code) => ({
    code,
    grupo: GRUPO_DE_EQUIPO[code],
  }));
  const usados = new Set<number>();

  function bt(i: number): boolean {
    if (i >= items.length) return true;
    for (const s of SLOTS_TERCEROS) {
      if (usados.has(s.match)) continue;
      if (!s.grupos.includes(items[i].grupo)) continue;
      usados.add(s.match);
      res[s.match] = items[i].code;
      if (bt(i + 1)) return true;
      usados.delete(s.match);
      res[s.match] = null;
    }
    return false;
  }
  bt(0);
  return res;
}

export type ResueltoBracket = {
  // participantes de cada partido (puede haber null si aún no se define)
  participantes: Record<number, [string | null, string | null]>;
  // ganador elegido de cada partido (o null)
  ganador: Record<number, string | null>;
  // equipo asignado a cada casillero de tercero
  terceros: Record<number, string | null>;
  // sets por ronda (mismo formato que EliminatoriasData)
  porRonda: Record<RoundKey, string[]>;
};

// Resuelve TODO el cuadro a partir de los grupos, los terceros elegidos y las
// elecciones de ganador por ronda. También "limpia" elecciones inválidas.
export function resolverBracket(
  grupos: GruposData,
  terceros: string[],
  porRondaIn: Partial<Record<RoundKey, string[]>>,
): ResueltoBracket {
  const terc = asignarTerceros(terceros);

  const resolveSeed = (s: Seed): string | null => {
    if (s.tipo === "pos") {
      if (!grupoCompleto(s.grupo, grupos)) return null;
      return tablaGrupo(s.grupo, grupos)[s.pos].code;
    }
    return null; // los terceros se inyectan abajo por id de partido
  };

  const participantes: Record<number, [string | null, string | null]> = {};
  const ganador: Record<number, string | null> = {};
  const porRonda: Record<RoundKey, string[]> = {
    pasanOctavos: [],
    pasanCuartos: [],
    pasanSemis: [],
    pasanFinal: [],
    campeon: [],
  };

  for (const mid of ORDEN_PARTIDOS_BRACKET) {
    let parts: [string | null, string | null];
    if (mid <= 88) {
      const [a, b] = R32[mid];
      const ra = a.tipo === "tercero" ? terc[mid] : resolveSeed(a);
      const rb = b.tipo === "tercero" ? terc[mid] : resolveSeed(b);
      parts = [ra ?? null, rb ?? null];
    } else {
      const [f0, f1] = FEEDERS[mid];
      parts = [ganador[f0], ganador[f1]];
    }
    participantes[mid] = parts;

    const set = porRondaIn[roundDe(mid)] ?? [];
    const w = parts.find((pp) => pp && set.includes(pp)) ?? null;
    ganador[mid] = w;
    if (w) porRonda[roundDe(mid)].push(w);
  }

  return { participantes, ganador, terceros: terc, porRonda };
}

// Etiqueta de un casillero vacío (1E, 2A, 3°...).
export function etiquetaSeed(s: Seed): string {
  if (s.tipo === "pos") return `${s.pos + 1}${s.grupo}`;
  return `3° ${s.grupos.join("·")}`;
}
