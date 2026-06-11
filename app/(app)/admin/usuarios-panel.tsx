"use client";

import { useState, useTransition } from "react";
import { eliminarUsuario } from "../actions";
import type { UsuarioAdmin } from "@/lib/db";

export function UsuariosPanel({
  usuarios,
  miId,
}: {
  usuarios: UsuarioAdmin[];
  miId: number;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function fmtFecha(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  function eliminar(u: UsuarioAdmin) {
    if (!confirm(`¿Eliminar al usuario "${u.username}"? Se borrará su predicción.`))
      return;
    startTransition(async () => {
      const r = await eliminarUsuario(u.id);
      setMsg(r.ok ? `Usuario "${u.username}" eliminado.` : r.error ?? "Error");
    });
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Registrados" valor={usuarios.length} />
        <Stat
          label="Con campeón elegido"
          valor={usuarios.filter((u) => u.tieneCampeon).length}
        />
        <Stat
          label="Sin empezar"
          valor={usuarios.filter((u) => u.partidosLlenos === 0).length}
        />
      </div>

      {msg && (
        <p className="text-sm bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-3 py-2 mb-3">
          {msg}
        </p>
      )}

      <div className="bg-surface rounded-xl border border-line shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 text-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Usuario</th>
              <th className="text-left px-3 py-3 font-medium">Registro</th>
              <th className="px-3 py-3 font-medium" title="Partidos de grupos llenados">
                Grupos
              </th>
              <th className="px-3 py-3 font-medium">Campeón</th>
              <th className="px-3 py-3 font-medium text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {usuarios.map((u) => (
              <tr key={u.id} className={u.id === miId ? "bg-green-50" : ""}>
                <td className="px-4 py-3 font-medium">
                  {u.username}
                  {u.id === miId && (
                    <span className="ml-1 text-xs text-grass">(tú)</span>
                  )}
                </td>
                <td className="px-3 py-3 text-muted">{fmtFecha(u.created_at)}</td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={
                      u.partidosLlenos === 72
                        ? "text-win font-semibold"
                        : u.partidosLlenos === 0
                          ? "text-muted"
                          : "text-draw"
                    }
                  >
                    {u.partidosLlenos}/72
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {u.tieneCampeon ? "🏆" : "—"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end">
                    {u.id !== miId ? (
                      <button
                        onClick={() => eliminar(u)}
                        disabled={pending}
                        className="text-xs rounded-md bg-red-50 text-lose border border-red-200 px-2 py-1 hover:bg-red-100 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    ) : (
                      <span className="text-xs text-muted">dueño</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Aún no hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="bg-surface rounded-xl border border-line p-3 text-center">
      <div className="text-2xl font-bold text-pitch">{valor}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
