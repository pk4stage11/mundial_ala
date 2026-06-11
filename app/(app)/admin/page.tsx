import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { getUsuariosAdmin } from "@/lib/db";
import { UsuariosPanel } from "./usuarios-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const u = await usuarioActual();
  if (!u) redirect("/login");
  if (!u.es_admin) redirect("/grupos");

  const usuarios = await getUsuariosAdmin();

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Usuarios</h1>
        <p className="text-muted text-sm mt-1">
          Controla quién entra al sistema: revisa los registrados, su avance y
          elimina o da permisos de administrador.
        </p>
      </header>
      <UsuariosPanel usuarios={usuarios} miId={u.id} />
    </div>
  );
}
