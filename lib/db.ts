import "server-only";
import { supabaseAdmin } from "./supabase";
import { PREDICCION_VACIA, type Prediccion } from "./standings";

function normaliza(row: {
  grupos?: unknown;
  grupos_cerrados?: unknown;
  terceros?: unknown;
  eliminatorias?: unknown;
} | null): Prediccion {
  if (!row) return structuredClone(PREDICCION_VACIA);
  return {
    grupos: (row.grupos as Prediccion["grupos"]) ?? {},
    gruposCerrados: (row.grupos_cerrados as string[]) ?? [],
    terceros: (row.terceros as string[]) ?? [],
    eliminatorias: (row.eliminatorias as Prediccion["eliminatorias"]) ?? {},
  };
}

export async function getPrediccion(usuarioId: number): Promise<Prediccion> {
  const { data } = await supabaseAdmin()
    .from("mundial_prediccion")
    .select("grupos, grupos_cerrados, terceros, eliminatorias")
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  return normaliza(data);
}

export async function savePrediccion(
  usuarioId: number,
  patch: Partial<Prediccion>,
) {
  const actual = await getPrediccion(usuarioId);
  const next: Prediccion = { ...actual, ...patch };
  const { error } = await supabaseAdmin()
    .from("mundial_prediccion")
    .upsert(
      {
        usuario_id: usuarioId,
        grupos: next.grupos,
        grupos_cerrados: next.gruposCerrados,
        terceros: next.terceros,
        eliminatorias: next.eliminatorias,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "usuario_id" },
    );
  if (error) throw new Error(error.message);
}

export async function getResultadoOficial(): Promise<Prediccion> {
  const { data } = await supabaseAdmin()
    .from("mundial_resultado")
    .select("grupos, terceros, eliminatorias")
    .eq("id", 1)
    .maybeSingle();
  return normaliza(data);
}

export async function saveResultadoOficial(patch: Partial<Prediccion>) {
  const actual = await getResultadoOficial();
  const next: Prediccion = { ...actual, ...patch };
  const { error } = await supabaseAdmin()
    .from("mundial_resultado")
    .upsert(
      {
        id: 1,
        grupos: next.grupos,
        terceros: next.terceros,
        eliminatorias: next.eliminatorias,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  if (error) throw new Error(error.message);
}

// Marcadores reales (scoreline) por id de partido, ej. { "A-0": "2-1" }.
export type Marcadores = Record<string, string>;

export async function getMarcadoresReales(): Promise<Marcadores> {
  const { data } = await supabaseAdmin()
    .from("mundial_resultado")
    .select("marcadores")
    .eq("id", 1)
    .maybeSingle();
  return ((data?.marcadores as Marcadores) ?? {}) as Marcadores;
}

export async function saveMarcadoresReales(marcadores: Marcadores) {
  const { error } = await supabaseAdmin()
    .from("mundial_resultado")
    .update({ marcadores, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

export type UsuarioAdmin = {
  id: number;
  username: string;
  es_admin: boolean;
  created_at: string;
  tienePrediccion: boolean;
  partidosLlenos: number;
  tieneCampeon: boolean;
};

export async function getUsuariosAdmin(): Promise<UsuarioAdmin[]> {
  const sb = supabaseAdmin();
  const { data: usuarios } = await sb
    .from("mundial_usuario")
    .select("id, username, es_admin, created_at")
    .order("created_at");
  const { data: preds } = await sb
    .from("mundial_prediccion")
    .select("usuario_id, grupos, eliminatorias");

  const mapa = new Map<number, { grupos: Prediccion["grupos"]; campeon: boolean }>();
  (preds ?? []).forEach((p) => {
    const g = (p.grupos as Prediccion["grupos"]) ?? {};
    const elim = (p.eliminatorias as Prediccion["eliminatorias"]) ?? {};
    mapa.set(p.usuario_id as number, {
      grupos: g,
      campeon: (elim.campeon ?? []).length > 0,
    });
  });

  return (usuarios ?? []).map((u) => {
    const info = mapa.get(u.id);
    return {
      id: u.id,
      username: u.username,
      es_admin: u.es_admin,
      created_at: u.created_at,
      tienePrediccion: !!info,
      partidosLlenos: info ? Object.values(info.grupos).filter(Boolean).length : 0,
      tieneCampeon: info?.campeon ?? false,
    };
  });
}

export async function eliminarUsuario(id: number) {
  const { error } = await supabaseAdmin()
    .from("mundial_usuario")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setAdmin(id: number, es_admin: boolean) {
  const { error } = await supabaseAdmin()
    .from("mundial_usuario")
    .update({ es_admin })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export type PrediccionConUsuario = {
  usuario: { id: number; username: string; es_admin: boolean };
  prediccion: Prediccion;
};

export async function getTodasLasPredicciones(): Promise<PrediccionConUsuario[]> {
  const sb = supabaseAdmin();
  const { data: usuarios } = await sb
    .from("mundial_usuario")
    .select("id, username, es_admin")
    .order("id");
  const { data: preds } = await sb
    .from("mundial_prediccion")
    .select("usuario_id, grupos, terceros, eliminatorias");

  const mapa = new Map<number, Prediccion>();
  (preds ?? []).forEach((p) => mapa.set(p.usuario_id as number, normaliza(p)));

  return (usuarios ?? []).map((u) => ({
    usuario: u,
    prediccion: mapa.get(u.id) ?? structuredClone(PREDICCION_VACIA),
  }));
}
