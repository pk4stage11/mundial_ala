# 🏆 Quiniela Mundial 2026

App web para predecir el Mundial 2026 (Canadá · México · EE.UU.) y competir por aciertos entre amigos.

## Qué hace

- **Login / registro** con usuario + contraseña (el **primer** usuario registrado queda como **administrador**).
- **Fase de grupos**: los 12 grupos reales con sus partidos. Para cada partido marcas `1` (gana local), `X` (empate) o `2` (gana visitante). La tabla de cada grupo se calcula sola (puntos, 1°/2°/3°).
- **Eliminatorias** (dieciseisavos → octavos → cuartos → semifinal → final → campeón): arrastras (o tocas) los equipos que crees que pasan en cada ronda. Salen de tus clasificados de la fase de grupos: 1° y 2° de cada grupo + los 8 mejores terceros que tú elijas.
- **Tabla de aciertos**: ranking de todos los participantes según cuántos resultados acertaron contra los resultados oficiales.
- **Resultados (admin)**: el administrador carga lo que realmente pasó (mismos editores que el usuario) y con eso se calculan los aciertos.

Todo se guarda solo en Supabase a medida que vas marcando.

## Cómo correrlo

```bash
npm install        # solo la primera vez
npm run dev        # desarrollo -> http://localhost:3000
npm run build && npm start   # producción
```

Las claves de Supabase están en `.env.local`.

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · Supabase (Postgres). Autenticación propia
simple (contraseña con hash scrypt + cookie de sesión firmada).

## Datos

Tablas en Supabase con prefijo `mundial_` (no tocan otros proyectos):
`mundial_usuario`, `mundial_prediccion` (una fila por usuario), `mundial_resultado`
(fila única con los resultados oficiales).

Los grupos y equipos están en `lib/data.ts`. El cálculo de tablas y aciertos en `lib/standings.ts`.

## Cómo se cuentan los aciertos

- **Fase de grupos**: +1 por cada partido cuyo resultado (1/X/2) coincide con el oficial.
- **Eliminatorias**: +1 por cada equipo que acertaste que llegaba a octavos, cuartos,
  semifinal, final y campeón (se compara equipo por equipo en cada ronda).
