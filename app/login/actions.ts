"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { crearSesion, hashPassword, verifyPassword } from "@/lib/auth";

export type AuthState = { error?: string };

function limpiar(username: string) {
  return username.trim().toLowerCase();
}

export async function ingresar(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = limpiar(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Completa usuario y contraseña." };
  }

  const { data: user } = await supabaseAdmin()
    .from("mundial_usuario")
    .select("id, password")
    .eq("username", username)
    .maybeSingle();

  if (!user || !verifyPassword(password, user.password)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await crearSesion(user.id);
  redirect("/grupos");
}

export async function registrar(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = limpiar(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (username.length < 3) {
    return { error: "El usuario debe tener al menos 3 caracteres." };
  }
  if (password.length < 4) {
    return { error: "La contraseña debe tener al menos 4 caracteres." };
  }
  if (password !== password2) {
    return { error: "Las contraseñas no coinciden." };
  }

  const sb = supabaseAdmin();

  const { data: existe } = await sb
    .from("mundial_usuario")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existe) {
    return { error: "Ese usuario ya existe, elige otro." };
  }

  // El primer usuario registrado es admin (puede cargar resultados oficiales).
  const { count } = await sb
    .from("mundial_usuario")
    .select("id", { count: "exact", head: true });
  const esAdmin = (count ?? 0) === 0;

  const { data: nuevo, error } = await sb
    .from("mundial_usuario")
    .insert({ username, password: hashPassword(password), es_admin: esAdmin })
    .select("id")
    .single();

  if (error || !nuevo) {
    return { error: "No se pudo crear el usuario. Intenta de nuevo." };
  }

  await crearSesion(nuevo.id);
  redirect("/grupos");
}
