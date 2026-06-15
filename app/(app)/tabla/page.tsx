import {
  getResultadoOficial,
  getTodasLasPredicciones,
  getMarcadoresReales,
} from "@/lib/db";
import { usuarioActual } from "@/lib/auth";
import { calcularAciertos, cantidadPartidosResueltos } from "@/lib/standings";
import { TablaAciertos } from "./tabla-aciertos";

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
        usuario: { id: p.usuario.id, username: p.usuario.username },
        total: a.total,
        ptsGrupos: a.partidos,
        ptsElim,
        marcadosGrupos,
        marcadosElim,
        grupos: p.prediccion.grupos,
        goles: p.prediccion.gruposGoles,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Tabla de aciertos</h1>
        <p className="text-muted text-sm mt-1">
          Ranking de participantes. <b>Toca un participante</b> para ver todo lo
          que marcó en la fase de grupos.
        </p>
      </header>

      {!hayResultados && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-900">
          Todavía no se han cargado resultados oficiales, así que todos van con 0
          puntos. Se irán sumando a medida que se jueguen los partidos.
        </div>
      )}

      <TablaAciertos
        ranking={ranking}
        miId={yo?.id ?? null}
        real={oficial.grupos}
        marcadores={marcadores}
      />

      <p className="text-xs text-muted mt-3">
        Cómo se cuentan los puntos · <b>Fase de grupos:</b> +1 por acertar el
        resultado (1/X/2) y +3 por el marcador exacto (se suman, hasta +4 por
        partido). · <b>Eliminatorias:</b> +1 por cada equipo que acertaste que
        llegaba a octavos, cuartos, semifinal, final y campeón.
      </p>
    </div>
  );
}
