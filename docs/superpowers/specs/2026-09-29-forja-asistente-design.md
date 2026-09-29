# Forja paso a paso — Yunque y Ciudad como asistente (Fase I)

> Especificación del 2026-09-29, aprobada por el profesor por partes («procede en automático»). Cambia la presentación de los actos 2 y 3 de la forja jugada (Fase G). No cambia contenido, motor ni datos.

## 1. Objetivo

Que forjar la medalla sea un **ejercicio de ética**, no un formulario: una pregunta por pantalla, con avance visible, y cada pregunta planteada como una decisión entre cosas buenas que chocan. La meta pedagógica viene de la guía docente (`docs/guia-docente.md`) y su bibliografía:

| Fuente                                                   | Cómo se traduce en la forja                                                                                                                                                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beauchamp y Childress, _Principles of Biomedical Ethics_ | Los principios valen _prima facie_: solo se jerarquizan cuando chocan. La jerarquía se construye con **duelos** («si chocan, ¿cuál gana?»), no ordenando una lista en abstracto.          |
| Kohlberg, _Essays on Moral Development_                  | Lo que se decide y por qué se decide son cosas distintas. En la Ciudad, la **decisión** y el **motivo** son dos pasos separados; el motivo se elige con la decisión a la vista.            |
| Gilligan, _In a Different Voice_                         | Los dilemas se leen desde la situación concreta: cada paso muestra la escena completa antes de las opciones.                                                                              |
| Guía docente §3–§4 (preguntas guía)                      | Tarjetas de reflexión del **Sr. Referí** que no se responden ni se guardan: «Si tu límite choca con tu primer principio, ¿qué gana?», «¿Quién más podría usar esos datos?», «¿En qué encuentro dudaste más?». |
| Guía docente §4 (consigna)                               | La Ciudad empieza con la consigna «Responde como la medalla, no como tú».                                                                                                                 |

Se mantiene la decisión de la Fase G: **la reacción tras cada dilema no muestra números** (solo destella el eje dominante), para que el test no se pueda optimizar. La contradicción entre lo declarado y lo decidido se revela en la Ceremonia, como hoy.

## 2. Acto 2 · El Yunque como asistente

Cinco etapas, una pantalla a la vez. Arriba: la medalla del yunque (como hoy) y la barra «Etapa n de 5». Abajo: **Atrás** y **Siguiente**.

1. **Duelos de principios.** Pantalla: «Los dos son buenos. Si chocan, ¿cuál gana?» y dos tarjetas con el nombre y la descripción de cada principio (`AXES[k].n`, `AXES[k].d`). Tocar una tarjeta registra el duelo y pasa al siguiente. Los duelos siguen una **inserción binaria**: 8 a 11 duelos para ordenar los 6 principios, siempre con resultado coherente (sin ciclos). «Atrás» deshace el último duelo. Contador «Duelo n».
2. **Tu jerarquía.** «Así quedó tu jerarquía»: la lista ordenada (`RankList`, con flechas y arrastre para afinar) y el botón «Repetir los duelos».
3. **Límite infranqueable.** El campo de hoy (obligatorio para seguir), grabándose en el borde de la medalla. Tarjeta del Sr. Referí: «Si tu límite choca con _<primer principio>_, ¿qué gana?».
4. **Rasgo de carácter.** Selección única entre `CATALOGS.traits`.
5. **Datos que recoge.** Selección múltiple (`CATALOGS.data`, «Ninguno» excluyente) y «¿Cuánto tiempo los conserva y para qué?». Tarjeta del Sr. Referí: «¿Quién más podría usar esos datos?». Siguiente = **Salir a la ciudad**.

Al terminar los duelos se escribe `draft.rank`. El orden resultante es una jerarquía como la de las flechas, así que el motor la trata igual. Si el estudiante ya tenía jerarquía (p. ej. desde el formulario) y no ha hecho duelos, la etapa 1 empieza igual; «Siguiente» en la etapa 1 solo se habilita al terminar los duelos.

## 3. Acto 3 · La Ciudad como asistente

Se retira el mapa navegable. Arriba queda la barra de la ciudad (nombre, «Encuentros n/10», mini-medalla) y debajo un **recorrido**: 6 puntos de la Plaza y 4 del circuito del tipo, con el robot sobre el punto actual (colores de `city.ts`).

Secuencia:

1. **Consigna** (una vez): «Responde como la medalla, no como tú. Cada decisión pide también un motivo.» → Empezar.
2. Por cada uno de los 10 dilemas de `testFor(type)` (primero los 6 `core`, luego los 4 del circuito):
   - **Paso A · Decisión:** cartel con `d.t`, escena con `d.s` y las tres opciones como tarjetas. Siguiente se habilita al elegir.
   - **Paso B · Motivo:** «¿Por qué lo hace?» con la opción elegida a la vista y los 6 motivos (`REASONS`). Al elegir, destella «✦ <eje dominante>» y el sello «Resuelto». Siguiente pasa al próximo dilema.
3. Tras el 6.º dilema: pantalla **«¡Se abrió el circuito X!»** con `CIRCUITS[c].d`.
4. **Revisión:** los 10 dilemas con la opción elegida y un botón «Cambiar» en cada uno. Tarjeta del Sr. Referí: «¿En qué encuentro dudaste más? Esa duda es el hallazgo.» → **Entrar a la Corporación** (diálogo actual «¿Grabar la medalla?») → Ceremonia.

«Atrás» recorre la secuencia hacia atrás (motivo → decisión → dilema anterior). Las respuestas se pueden cambiar hasta grabar la medalla. Los botones Taller y Yunque siguen disponibles.

## 4. Arquitectura

### Lógica pura (`apps/web/src/game/`)

- `duels.ts` — `duelState(outcomes: boolean[])` → `{ pair: [AxisKey, AxisKey], n }` mientras falten duelos, o `{ rank: AxisKey[] }` al terminar. Reproduce la inserción binaria desde `AXIS_KEYS` con los resultados dados (`true` = gana el primero de la pareja). Sin estado propio.
- `wizard.ts` — `citySteps(type)` → la lista de pasos de la Ciudad (`intro`, `decide:<id>`, `reason:<id>`, `unlock`, `review`) y `firstOpenStep(draft)` para retomar en el primer paso pendiente.
- Se conservan `progress.ts`, `reaction.ts` y `city.ts`.

### Estado (`store/game.ts`)

- Se agregan `anvilStep` (0–4), `duels: boolean[]` y `cityStep` (índice en `citySteps`). Se retiran `location` y `lastVisited`. La lectura de datos viejos sigue siendo tolerante.
- `store/draft.ts` no cambia: sigue siendo la única fuente de respuestas.

### Presentación (`routes/Forge/scenes/`)

- `Anvil.tsx` pasa a asistente; nuevo `DuelStep`. Reutiliza `LimitField`, `RankList`, `Chips`.
- `City.tsx` pasa a asistente; `Encounter.tsx` se divide en los pasos A y B (sin diálogo modal). Nuevo `CityTrail.tsx`.
- Nuevo componente compartido `Referee.tsx` (tarjeta del Sr. Referí) y `WizardNav.tsx` (Atrás/Siguiente + barra).
- Se eliminan `CityMap.tsx` y las piezas de `MapArt.tsx` que ya no se usen.

## 5. Lo que no cambia

- Contenido (`packages/content`), motor, códigos de medalla y Supabase.
- La forja clásica («Ver como formulario») queda igual.
- Taller y Ceremonia quedan igual.
- Nada de escuela técnica ni etapa de Kohlberg en pantalla.

## 6. Pruebas

- **Unitarias:** `duels.ts` recupera las 720 permutaciones con un oráculo coherente, en 8–11 duelos, y deshacer reproduce el estado anterior; `wizard.ts` ordena 6 `core` + 4 del circuito para los 7 tipos y `firstOpenStep` retoma bien.
- **E2E:** partida completa jugando (duelos → ciudad paso a paso → Ceremonia); **paridad** juego ↔ formulario (mismo código); guardar y retomar a mitad de los duelos y a mitad de la ciudad; cambiar una respuesta desde la Revisión; teclado y movimiento reducido; sin desbordes a 375 px; sin datos ocultos en pantalla.

## 7. Criterios de aceptación

- Un estudiante completa la forja sin instrucciones, una pregunta a la vez, en el celular.
- El robot resultante es idéntico al del formulario con las mismas respuestas.
- Todas las pruebas pasan. Commit `feat(faseI): ...`.
