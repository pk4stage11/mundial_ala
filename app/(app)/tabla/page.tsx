import {
  getResultadoOficial,
  getTodasLasPredicciones,
  getMarcadoresReales,
} from "@/lib/db";
import { usuarioActual } from "@/lib/auth";
import { calcularAciertos, cantidadPartidosResueltos } from "@/lib/standings";

export const dynamic = "force-dynamic";

export default async function TablaPage() {
  const [yo, oficial, marcadores, todas] = await Promise.all([
    usuarioActual(),
    getResultadoOficial(),
    getMarcadoresReales(),
    getTodasLasPredicciones(),
  ]);

  const hayResultados =
    cantidadPartidosResueltos(oficial.grupos) > 0 ||
    Object.keys(oficial.eliminatorias).length > 0;

  const ranking = todas
    .map((p) => ({
      usuario: p.usuario,
      aciertos: calcularAciertos(p.prediccion, oficial, marcadores),
    }))
    .sort((a, b) => b.aciertos.total - a.aciertos.total);

  const medalla = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Tabla de aciertos</h1>
        <p className="text-muted text-sm mt-1">
          Ranking de participantes según cuántos resultados acertaron contra los
          resultados oficiales.
        </p>
      </header>

      {!hayResultados && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-900">
          Todavía no se han cargado resultados oficiales, así que todos van con 0
          aciertos. El administrador los carga en la pestaña{" "}
          <b>Resultados (admin)</b> a medida que se juegan los partidos.
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 text-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium w-12">#</th>
              <th className="text-left px-4 py-3 font-medium">Participante</th>
              <th className="px-3 py-3 font-medium" title="Resultados de fase de grupos">
                Grupos
              </th>
              <th className="px-3 py-3 font-medium">8vos</th>
              <th className="px-3 py-3 font-medium">4tos</th>
              <th className="px-3 py-3 font-medium">Semis</th>
              <th className="px-3 py-3 font-medium">Final</th>
              <th className="px-3 py-3 font-medium" title="Campeón">
                🏆
              </th>
              <th className="px-4 py-3 font-bold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ranking.map((r, i) => {
              const soyYo = yo?.id === r.usuario.id;
              return (
                <tr
                  key={r.usuario.id}
                  className={soyYo ? "bg-green-50" : ""}
                >
                  <td className="px-4 py-3">
                    <span className="font-semibold">
                      {medalla[i] ?? i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {r.usuario.username}
                    {soyYo && (
                      <span className="ml-1 text-xs text-grass">(tú)</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-muted">
                    {r.aciertos.partidos}
                  </td>
                  <td className="px-3 py-3 text-center text-muted">
                    {r.aciertos.octavos}
                  </td>
                  <td className="px-3 py-3 text-center text-muted">
                    {r.aciertos.cuartos}
                  </td>
                  <td className="px-3 py-3 text-center text-muted">
                    {r.aciertos.semis}
                  </td>
                  <td className="px-3 py-3 text-center text-muted">
                    {r.aciertos.final}
                  </td>
                  <td className="px-3 py-3 text-center text-muted">
                    {r.aciertos.campeon}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-pitch text-base">
                    {r.aciertos.total}
                  </td>
                </tr>
              );
            })}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  Aún no hay participantes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted mt-3">
        Cómo se cuentan los puntos · <b>Fase de grupos:</b> +1 por acertar el
        resultado (1/X/2) y +3 por el marcador exacto (se suman, hasta +4 por
        partido). · <b>Eliminatorias:</b> +1 por cada equipo que acertaste que
        llegaba a octavos, cuartos, semifinal, final y campeón.
      </p>
    </div>
  );
}
