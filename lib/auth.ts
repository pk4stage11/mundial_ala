import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "./supabase";

const COOKIE = "mundial_session";

export type Usuario = {
  id: number;
  username: string;
  es_admin: boolean;
};

// --- Hash de contraseña (scrypt, sin dependencias externas) ------------------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashed = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");
  return hashed.length === original.length && timingSafeEqual(hashed, original);
}

// --- Cookie de sesión firmada ------------------------------------------------
function sign(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET no está definida");
  return createHmac("sha256", secret).update(value).digest("hex");
}

function makeToken(userId: number): string {
  const v = String(userId);
  return `${v}.${sign(v)}`;
}

function readToken(token: string | undefined): number | null {
  if (!token) return null;
  const [v, sig] = token.split(".");
  if (!v || !sig) return null;
  if (sign(v) !== sig) return null;
  const id = Number(v);
  return Number.isFinite(id) ? id : null;
}

export async function crearSesion(userId: number) {
  const store = await cookies();
  store.set(COOKIE, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 días
  });
}

export async function cerrarSesion() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function usuarioActual(): Promise<Usuario | null> {
  const store = await cookies();
  const id = readToken(store.get(COOKIE)?.value);
  if (id === null) return null;
  const { data } = await supabaseAdmin()
    .from("mundial_usuario")
    .select("id, username, es_admin")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}
