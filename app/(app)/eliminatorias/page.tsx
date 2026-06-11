import { usuarioActual } from "@/lib/auth";
import { getPrediccion } from "@/lib/db";
import { EliminatoriasEditor } from "./eliminatorias-editor";
import { guardarEliminatorias } from "../actions";

export const dynamic = "force-dynamic";

export default async function EliminatoriasPage() {
  const u = await usuarioActual();
  const pred = u ? await getPrediccion(u.id) : null;

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Eliminatorias</h1>
        <p className="text-muted text-sm mt-1">
          Arrastra (o toca) los equipos que crees que pasan en cada ronda. Salen
          de los clasificados de tu fase de grupos.
        </p>
      </header>
      <EliminatoriasEditor
        grupos={pred?.grupos ?? {}}
        inicialTerceros={pred?.terceros ?? []}
        inicialElim={pred?.eliminatorias ?? {}}
        guardar={guardarEliminatorias}
      />
    </div>
  );
}
