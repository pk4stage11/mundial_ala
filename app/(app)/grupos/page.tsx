import { usuarioActual } from "@/lib/auth";
import { getPrediccion, getResultadoOficial, getMarcadoresReales } from "@/lib/db";
import { GruposEditor } from "./grupos-editor";
import { guardarGrupos } from "../actions";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const u = await usuarioActual();
  const [pred, real, marcadores] = await Promise.all([
    u ? getPrediccion(u.id) : Promise.resolve(null),
    getResultadoOficial(),
    getMarcadoresReales(),
  ]);

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Fase de grupos</h1>
        <p className="text-muted text-sm mt-1">
          Marca cada partido: <b>1</b> local, <b>X</b> empate, <b>2</b>{" "}
          visitante. Pulsa el <span className="text-win font-bold">✓</span> para{" "}
          <b>cerrar la apuesta</b> (queda fija, ya no se puede cambiar). Al
          jugarse el partido verás el <b>resultado real</b> al costado.
        </p>
      </header>
      <GruposEditor
        inicial={pred?.grupos ?? {}}
        cerradosIniciales={pred?.gruposCerrados ?? []}
        real={real.grupos}
        marcadores={marcadores}
        ahoraMs={Date.now()}
        guardar={guardarGrupos}
      />
    </div>
  );
}
