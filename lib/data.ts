// Datos estáticos del Mundial 2026 (Canadá · México · EE.UU.)
// 48 equipos · 12 grupos (A–L) · 4 equipos por grupo.

export type Equipo = {
  code: string; // identificador único de 3 letras
  name: string; // nombre en español
  flag: string; // bandera emoji
};

export type Grupo = {
  id: string; // "A".."L"
  equipos: Equipo[]; // 4 equipos, en orden de bombo (índice 0 = cabeza de serie)
};

export const GRUPOS: Grupo[] = [
  {
    id: "A",
    equipos: [
      { code: "MEX", name: "México", flag: "🇲🇽" },
      { code: "RSA", name: "Sudáfrica", flag: "🇿🇦" },
      { code: "KOR", name: "Corea del Sur", flag: "🇰🇷" },
      { code: "CZE", name: "Chequia", flag: "🇨🇿" },
    ],
  },
  {
    id: "B",
    equipos: [
      { code: "CAN", name: "Canadá", flag: "🇨🇦" },
      { code: "BIH", name: "Bosnia y Herzegovina", flag: "🇧🇦" },
      { code: "QAT", name: "Qatar", flag: "🇶🇦" },
      { code: "SUI", name: "Suiza", flag: "🇨🇭" },
    ],
  },
  {
    id: "C",
    equipos: [
      { code: "BRA", name: "Brasil", flag: "🇧🇷" },
      { code: "MAR", name: "Marruecos", flag: "🇲🇦" },
      { code: "HAI", name: "Haití", flag: "🇭🇹" },
      { code: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    ],
  },
  {
    id: "D",
    equipos: [
      { code: "USA", name: "Estados Unidos", flag: "🇺🇸" },
      { code: "PAR", name: "Paraguay", flag: "🇵🇾" },
      { code: "AUS", name: "Australia", flag: "🇦🇺" },
      { code: "TUR", name: "Turquía", flag: "🇹🇷" },
    ],
  },
  {
    id: "E",
    equipos: [
      { code: "GER", name: "Alemania", flag: "🇩🇪" },
      { code: "CUW", name: "Curazao", flag: "🇨🇼" },
      { code: "CIV", name: "Costa de Marfil", flag: "🇨🇮" },
      { code: "ECU", name: "Ecuador", flag: "🇪🇨" },
    ],
  },
  {
    id: "F",
    equipos: [
      { code: "NED", name: "Países Bajos", flag: "🇳🇱" },
      { code: "JPN", name: "Japón", flag: "🇯🇵" },
      { code: "SWE", name: "Suecia", flag: "🇸🇪" },
      { code: "TUN", name: "Túnez", flag: "🇹🇳" },
    ],
  },
  {
    id: "G",
    equipos: [
      { code: "BEL", name: "Bélgica", flag: "🇧🇪" },
      { code: "EGY", name: "Egipto", flag: "🇪🇬" },
      { code: "IRN", name: "Irán", flag: "🇮🇷" },
      { code: "NZL", name: "Nueva Zelanda", flag: "🇳🇿" },
    ],
  },
  {
    id: "H",
    equipos: [
      { code: "ESP", name: "España", flag: "🇪🇸" },
      { code: "CPV", name: "Cabo Verde", flag: "🇨🇻" },
      { code: "KSA", name: "Arabia Saudita", flag: "🇸🇦" },
      { code: "URU", name: "Uruguay", flag: "🇺🇾" },
    ],
  },
  {
    id: "I",
    equipos: [
      { code: "FRA", name: "Francia", flag: "🇫🇷" },
      { code: "SEN", name: "Senegal", flag: "🇸🇳" },
      { code: "IRQ", name: "Irak", flag: "🇮🇶" },
      { code: "NOR", name: "Noruega", flag: "🇳🇴" },
    ],
  },
  {
    id: "J",
    equipos: [
      { code: "ARG", name: "Argentina", flag: "🇦🇷" },
      { code: "ALG", name: "Argelia", flag: "🇩🇿" },
      { code: "AUT", name: "Austria", flag: "🇦🇹" },
      { code: "JOR", name: "Jordania", flag: "🇯🇴" },
    ],
  },
  {
    id: "K",
    equipos: [
      { code: "POR", name: "Portugal", flag: "🇵🇹" },
      { code: "COD", name: "RD Congo", flag: "🇨🇩" },
      { code: "UZB", name: "Uzbekistán", flag: "🇺🇿" },
      { code: "COL", name: "Colombia", flag: "🇨🇴" },
    ],
  },
  {
    id: "L",
    equipos: [
      { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { code: "CRO", name: "Croacia", flag: "🇭🇷" },
      { code: "GHA", name: "Ghana", flag: "🇬🇭" },
      { code: "PAN", name: "Panamá", flag: "🇵🇦" },
    ],
  },
];

// Mapa rápido code -> Equipo
export const EQUIPOS: Record<string, Equipo> = Object.fromEntries(
  GRUPOS.flatMap((g) => g.equipos).map((e) => [e.code, e]),
);

export function equipo(code: string | null | undefined): Equipo | null {
  if (!code) return null;
  return EQUIPOS[code] ?? null;
}

// Grupo (letra) al que pertenece un equipo.
export const GRUPO_DE_EQUIPO: Record<string, string> = Object.fromEntries(
  GRUPOS.flatMap((g) => g.equipos.map((e) => [e.code, g.id])),
);

// --- Partidos de la fase de grupos -------------------------------------------
// Round-robin de 4 equipos = 6 partidos. Orden estándar por índice dentro del grupo.
const ORDEN_PARTIDOS: [number, number][] = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

export type Partido = {
  id: string; // ej "A-0"
  grupo: string; // "A"
  local: string; // code
  visitante: string; // code
};

export const PARTIDOS: Partido[] = GRUPOS.flatMap((g) =>
  ORDEN_PARTIDOS.map(([i, j], idx) => ({
    id: `${g.id}-${idx}`,
    grupo: g.id,
    local: g.equipos[i].code,
    visitante: g.equipos[j].code,
  })),
);

export const PARTIDOS_POR_GRUPO: Record<string, Partido[]> = Object.fromEntries(
  GRUPOS.map((g) => [g.id, PARTIDOS.filter((p) => p.grupo === g.id)]),
);

// Resultado posible de un partido (predicción del usuario)
export type ResultadoPartido = "LOCAL" | "EMPATE" | "VISITANTE";

// Etapas de eliminatorias y cuántos pasan en cada corte.
export const RONDAS = [
  { key: "pasanOctavos", label: "Octavos", desde: "Dieciseisavos (32)", pasan: 16 },
  { key: "pasanCuartos", label: "Cuartos", desde: "Octavos (16)", pasan: 8 },
  { key: "pasanSemis", label: "Semifinal", desde: "Cuartos (8)", pasan: 4 },
  { key: "pasanFinal", label: "Final", desde: "Semifinal (4)", pasan: 2 },
  { key: "campeon", label: "Campeón", desde: "Final (2)", pasan: 1 },
] as const;

export type RondaKey = (typeof RONDAS)[number]["key"];
