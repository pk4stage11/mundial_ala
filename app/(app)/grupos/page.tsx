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
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Fase de grupos</h1>
        <p className="text-muted text-sm mt-1">
          Pon el <b>marcador</b> (goles) arriba y el <b>1/X/2</b> abajo. Pulsa el{" "}
          <span className="text-orange-500 font-bold">✓</span> del costado para{" "}
          <b>cerrar la apuesta</b> (queda fija). Al jugarse, verás el{" "}
          <b>resultado real</b> y tus puntos.
        </p>
      </header>

      {/* Banner informativo del puntaje */}
      <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-900 mb-1">
          ¿Cómo se ganan los puntos? 🏅
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-emerald-800">
          <span>
            <b className="text-emerald-700">+1</b> si aciertas el resultado
            (1/X/2)
          </span>
          <span>
            <b className="text-emerald-700">+3</b> si aciertas el marcador
            exacto (goles)
          </span>
          <span className="text-emerald-700/80">
            Se suman: marcador exacto = <b>+4</b> en total
          </span>
        </div>
      </div>
      <GruposEditor
        inicial={pred?.grupos ?? {}}
        golesIniciales={pred?.gruposGoles ?? {}}
        cerradosIniciales={pred?.gruposCerrados ?? []}
        real={real.grupos}
        marcadores={marcadores}
        ahoraMs={Date.now()}
        guardar={guardarGrupos}
      />
    </div>
  );
}
