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

  let user: { id: number; password: string } | null = null;
  try {
    const { data, error } = await supabaseAdmin()
      .from("mundial_usuario")
      .select("id, password")
      .eq("username", username)
      .maybeSingle();
    if (error) throw error;
    user = data;
  } catch {
    return {
      error: "No se pudo conectar con el servidor. Intenta de nuevo en un momento.",
    };
  }

  // No existe la cuenta → hay que registrarse primero.
  if (!user) {
    return {
      error: `La cuenta "${username}" no existe. Primero crea una cuenta en la pestaña "Crear cuenta".`,
    };
  }
  // Existe pero la contraseña no coincide.
  if (!verifyPassword(password, user.password)) {
    return { error: "Contraseña incorrecta. Vuelve a intentarlo." };
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

  let nuevoId: number;
  try {
    const sb = supabaseAdmin();

    const { data: existe, error: e1 } = await sb
      .from("mundial_usuario")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (e1) throw e1;
    if (existe) {
      return { error: "Ese usuario ya existe. Elige otro o entra con tu cuenta." };
    }

    // El primer usuario registrado es admin (puede ver el panel de usuarios).
    const { count, error: e2 } = await sb
      .from("mundial_usuario")
      .select("id", { count: "exact", head: true });
    if (e2) throw e2;
    const esAdmin = (count ?? 0) === 0;

    const { data: nuevo, error: e3 } = await sb
      .from("mundial_usuario")
      .insert({ username, password: hashPassword(password), es_admin: esAdmin })
      .select("id")
      .single();
    if (e3 || !nuevo) throw e3 ?? new Error("insert");
    nuevoId = nuevo.id;
  } catch {
    return {
      error: "No se pudo crear la cuenta (problema de conexión). Intenta de nuevo.",
    };
  }

  await crearSesion(nuevoId);
  redirect("/grupos");
}
