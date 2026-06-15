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

  const TOTAL_GRUPOS = 72;
  const TOTAL_ELIM = 31; // 16 + 8 + 4 + 2 + 1 llaves de eliminatorias

  const ranking = todas
    .map((p) => {
      const a = calcularAciertos(p.prediccion, oficial, marcadores);
      const e = p.prediccion.eliminatorias;
      const marcadosGrupos = Object.values(p.prediccion.grupos).filter(
        Boolean,
      ).length;
      const marcadosElim =
        (e.pasanOctavos?.length ?? 0) +
        (e.pasanCuartos?.length ?? 0) +
        (e.pasanSemis?.length ?? 0) +
        (e.pasanFinal?.length ?? 0) +
        (e.campeon?.length ?? 0);
      const ptsElim = a.octavos + a.cuartos + a.semis + a.final + a.campeon;
      return {
        usuario: p.usuario,
        total: a.total,
        ptsGrupos: a.partidos,
        ptsElim,
        marcadosGrupos,
        marcadosElim,
      };
    })
    .sort((a, b) => b.total - a.total);

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
          puntos. Se irán sumando a medida que se jueguen los partidos.
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead className="bg-slate-50 text-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium w-12">#</th>
              <th className="text-left px-4 py-3 font-medium">Participante</th>
              <th className="px-3 py-3 font-medium" title="Partidos marcados de la fase de grupos">
                Grupos
              </th>
              <th className="px-3 py-3 font-medium" title="Llaves marcadas de eliminatorias">
                Eliminatorias
              </th>
              <th className="px-4 py-3 font-bold text-right">Total pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ranking.map((r, i) => {
              const soyYo = yo?.id === r.usuario.id;
              return (
                <tr key={r.usuario.id} className={soyYo ? "bg-green-50" : ""}>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{medalla[i] ?? i + 1}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {r.usuario.username}
                    {soyYo && (
                      <span className="ml-1 text-xs text-grass">(tú)</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="font-semibold text-ink">
                      {r.marcadosGrupos}/{TOTAL_GRUPOS}
                    </div>
                    <div className="text-xs text-grass">{r.ptsGrupos} pts</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="font-semibold text-ink">
                      {r.marcadosElim}/{TOTAL_ELIM}
                    </div>
                    <div className="text-xs text-grass">{r.ptsElim} pts</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-pitch text-lg">
                    {r.total}
                  </td>
                </tr>
              );
            })}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
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
