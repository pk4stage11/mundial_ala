"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cerrarSesion, usuarioActual } from "@/lib/auth";
import {
  savePrediccion,
  eliminarUsuario as dbEliminarUsuario,
} from "@/lib/db";
import type { EliminatoriasData, GruposData } from "@/lib/standings";

export async function logout() {
  await cerrarSesion();
  redirect("/login");
}

// ---- Predicción del usuario -------------------------------------------------
export async function guardarGrupos(grupos: GruposData) {
  const u = await usuarioActual();
  if (!u) return { ok: false, error: "Sesión expirada." };
  await savePrediccion(u.id, { grupos });
  revalidatePath("/eliminatorias");
  revalidatePath("/tabla");
  return { ok: true };
}

export async function guardarEliminatorias(data: {
  terceros: string[];
  eliminatorias: EliminatoriasData;
}) {
  const u = await usuarioActual();
  if (!u) return { ok: false, error: "Sesión expirada." };
  await savePrediccion(u.id, {
    terceros: data.terceros,
    eliminatorias: data.eliminatorias,
  });
  revalidatePath("/tabla");
  return { ok: true };
}

// ---- Panel de usuarios (solo admin) -----------------------------------------
export async function eliminarUsuario(id: number) {
  const u = await usuarioActual();
  if (!u?.es_admin) return { ok: false, error: "Solo el administrador." };
  if (u.id === id) return { ok: false, error: "No puedes eliminarte a ti mismo." };
  await dbEliminarUsuario(id);
  revalidatePath("/admin");
  revalidatePath("/tabla");
  return { ok: true };
}
