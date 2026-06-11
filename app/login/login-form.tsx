"use client";

import { useActionState, useState } from "react";
import { ingresar, registrar, type AuthState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-line px-3 py-2.5 text-ink outline-none focus:border-grass focus:ring-2 focus:ring-grass/20";

export function LoginForm() {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const accion = modo === "login" ? ingresar : registrar;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    accion,
    {},
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-lg p-1 mb-5">
        <button
          type="button"
          onClick={() => setModo("login")}
          className={`rounded-md py-2 text-sm font-medium transition ${
            modo === "login" ? "bg-white shadow text-ink" : "text-muted"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => setModo("registro")}
          className={`rounded-md py-2 text-sm font-medium transition ${
            modo === "registro" ? "bg-white shadow text-ink" : "text-muted"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form action={formAction} className="space-y-3" key={modo}>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Usuario
          </label>
          <input
            name="username"
            autoComplete="username"
            placeholder="tu_usuario"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Contraseña
          </label>
          <input
            name="password"
            type="password"
            autoComplete={modo === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
        {modo === "registro" && (
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Repetir contraseña
            </label>
            <input
              name="password2"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
        )}

        {state.error && (
          <p className="text-sm text-lose bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-grass py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition"
        >
          {pending
            ? "Procesando…"
            : modo === "login"
              ? "Ingresar"
              : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-xs text-muted mt-4">
        {modo === "login"
          ? "¿No tienes cuenta? Crea una arriba."
          : "Crea tu usuario y contraseña para participar."}
      </p>
    </div>
  );
}
