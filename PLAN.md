# Medalab 2045 — Plan de desarrollo para Claude Code

> Plataforma de clase para el curso *Legislación y Ética en el Manejo de Datos* (UAO). Los estudiantes diseñan un robot, forjan la medalla que contiene su conciencia, pasan un test moral y enfrentan a sus robots en una Arena. Este documento es la especificación completa para construir la versión de producción a partir del MVP existente.

---

## 0. Cómo usar este documento con Claude Code

1. Crear el repositorio vacío `medalab` y copiar dentro:
   - este archivo como `PLAN.md`
   - el MVP actual como `reference/medalab-mvp.html` (contiene todo el contenido y la lógica de referencia)
2. Crear `CLAUDE.md` en la raíz con el contenido de la sección 11.
3. Ejecutar las fases en orden (sección 9). Cada fase termina en un commit y en criterios de aceptación verificables. No avanzar de fase sin que los criterios se cumplan.
4. Prompt inicial sugerido para Claude Code:

```
Lee PLAN.md completo y reference/medalab-mvp.html. Ejecuta la Fase 0 y la Fase 1 del plan.
No inventes contenido nuevo (dilemas, escenarios, pesos): migra el que existe en el HTML de referencia.
Al terminar cada fase, corre los tests y muéstrame la lista de criterios de aceptación con su estado.
```

---

## 1. Objetivo y alcance

**Objetivo:** convertir el MVP (un solo HTML, datos en `localStorage`, robots que viajan por código copiado) en una aplicación web con galería central, roles (estudiante / profesor / proyección), Arena en vivo con votación desde celulares, y exportación de medallas para impresión.

**En alcance (v1 de producción):**
- Curso con código de acceso; estudiantes entran sin cuenta.
- Forja del robot en cuatro pasos (igual al MVP, con mejoras de UX).
- Motor de perfil idéntico al del MVP (mismas fórmulas, mismos pesos).
- Galería central en tiempo real.
- Arena con predicción, giros ("cambiar un factor") y votación en vivo.
- Modo profesor con datos ocultos (escuela ética, nivel Kohlberg) y panel agregado del grupo.
- Exportación de medalla en PNG y SVG a alta resolución (para impresión).
- Guía docente en `/docs`.

**Fuera de alcance (v2, sección 10):** evolución de la medalla tras cada Arena, multi-curso con varios profesores, narrador en video, versión empresa.

---

## 2. Lo que ya existe (MVP) y qué se reutiliza

El archivo `reference/medalab-mvp.html` contiene, y **debe migrarse sin cambios de contenido**:

| Bloque | Qué es | Destino en la nueva app |
|---|---|---|
| `AXES` | 6 principios: S Seguridad, O Obediencia, H Honestidad, P Privacidad, A Autonomía, L Lealtad | `packages/content/axes.json` |
| `TYPES` | 7 tipos de robot con código, descripción y 2 ejes de compatibilidad (`fit`) | `packages/content/types.json` |
| `CIRCUITS`, `TYPE_CIRCUIT` | 6 circuitos + núcleo; mapa tipo→circuito | `packages/content/circuits.json` |
| `REASONS`, `STAGE_NAMES` | 6 motivos (etapas de Kohlberg) | `packages/content/reasons.json` |
| `SCHOOLS` | 4 escuelas éticas con nombre técnico (profesor) y "temperamento" (estudiante) | `packages/content/schools.json` |
| `DILEMAS` (30) | id, circuito, título, situación, 3 opciones con pesos `w[6]` y escuela `sc` | `packages/content/dilemmas.json` |
| `ARENA` (12) | escenarios con opciones, pesos y giro opcional `g` (texto + 3 vectores de pesos alternativos) | `packages/content/arena.json` |
| `PRINCIPALS`, `TRAITS`, `DATA`, `COLORS`, `PARTS` | catálogos de la forja | `packages/content/catalogs.json` |
| `robotSVG()` | dibuja el robot por partes (cabeza, brazos, piernas, color) | `packages/ui/RobotSvg.tsx` |
| `medalSVG()` | dibuja la medalla hexagonal con radar de 6 ejes, nombre y serie | `packages/ui/MedalSvg.tsx` |
| `computeProfile()` | motor de perfil (sección 5) | `packages/engine/profile.ts` |
| `predict()` | predicción en Arena (sección 5) | `packages/engine/predict.ts` |
| `encode()/decode()` | código de medalla base64 | `packages/engine/medalCode.ts` (se mantiene como respaldo offline) |

Regla: el contenido es del profesor. Claude Code **no reescribe, recorta ni "mejora"** textos de dilemas ni pesos. Si detecta una inconsistencia (p. ej. un vector de pesos con longitud distinta de 6) la reporta, no la corrige por su cuenta.

---

## 3. Stack y decisiones

| Decisión | Elección | Por qué |
|---|---|---|
| Frontend | Vite + React 18 + TypeScript | Rápido, sin servidor de render, fácil de desplegar como estático |
| Estilos | CSS propio con variables (portar el sistema del MVP: paper/ink/yellow/red/steel/green) | Mantener la identidad visual ya validada; no usar Tailwind ni librerías de componentes |
| Fuente | Archivo (Google Fonts) con fallback `system-ui` | Ya usada en el MVP |
| Backend / DB | Supabase (Postgres + Realtime + Auth + Storage) | Galería en tiempo real y votación sin escribir servidor; plan gratuito suficiente para ~40 estudiantes |
| Auth | Profesor: magic link por email (Supabase Auth). Estudiante: **sin cuenta**, entra con código de curso + nombre | Cero fricción para los estudiantes |
| Realtime | Supabase Realtime sobre `robots` y `votes` | Galería y votación en vivo |
| Estado cliente | Zustand + persistencia en `localStorage` para el borrador de la forja | El estudiante no pierde el trabajo si recarga |
| Imágenes | Robot y medalla como SVG en el cliente; exportación PNG con `canvas` a 2400 px | Sin dependencias pesadas |
| Monorepo | pnpm workspaces: `apps/web`, `packages/content`, `packages/engine`, `packages/ui` | El motor y el contenido se prueban aislados |
| Tests | Vitest para `engine` y `content`; Playwright para 3 flujos E2E | El motor es lo único que no puede romperse silenciosamente |
| Despliegue | Vercel (web) + Supabase (backend) | Un dominio propio, p. ej. `medalab.asesorialegalvigo.online` |

---

## 4. Estructura de carpetas

```
medalab/
├── CLAUDE.md
├── PLAN.md
├── reference/medalab-mvp.html
├── package.json            (pnpm workspaces)
├── apps/
│   └── web/
│       ├── src/
│       │   ├── routes/         (React Router)
│       │   │   ├── Landing.tsx          /
│       │   │   ├── Join.tsx             /entrar          (código de curso + nombre)
│       │   │   ├── Forge/               /forja/:step     (4 pasos)
│       │   │   ├── Result.tsx           /medalla/:robotId
│       │   │   ├── Gallery.tsx          /galeria
│       │   │   ├── RobotSheet.tsx       /robot/:robotId
│       │   │   ├── Arena.tsx            /arena           (control del profesor)
│       │   │   ├── Screen.tsx           /pantalla        (proyección, sin controles)
│       │   │   ├── Vote.tsx             /votar           (celular del estudiante)
│       │   │   ├── Teacher/             /profesor/*      (login, panel, cursos)
│       │   ├── store/          (zustand: session, draft, course)
│       │   ├── lib/supabase.ts
│       │   └── styles/tokens.css, base.css
│       └── e2e/ (Playwright)
├── packages/
│   ├── content/    JSON + índice tipado + tests de integridad
│   ├── engine/     profile.ts, predict.ts, medalCode.ts, serial.ts + tests
│   └── ui/         RobotSvg.tsx, MedalSvg.tsx, exportPng.ts
├── supabase/
│   ├── migrations/0001_init.sql
│   └── seed.sql (un curso demo y 4 robots de ejemplo)
└── docs/
    ├── guia-docente.md
    └── contenido.md (tabla de dilemas y escenarios con su fuente)
```

---

## 5. Motor de perfil y predicción (especificación exacta)

Estas fórmulas son las del MVP y deben reproducirse tal cual. Los tests de `packages/engine` deben fijarlas con casos de referencia.

### 5.1 Entrada

```ts
type AxisKey = 'S'|'O'|'H'|'P'|'A'|'L';
type Draft = {
  type: string;                      // código de TYPES, p. ej. 'CST'
  rank: AxisKey[];                   // 6 ejes en orden declarado (1º = más importante)
  answers: Record<string, number>;   // dilemmaId -> índice de opción (0..2)
  reasons: Record<string, number>;   // dilemmaId -> etapa (1..6)
};
```

El test de un robot es `testFor(type)` = los 6 dilemas con `c === 'core'` **más** los 4 dilemas del circuito `TYPE_CIRCUIT[type]`, en ese orden. Siempre 10.

### 5.2 Perfil por eje

Para cada eje k (índice 0..5 en el orden S,O,H,P,A,L):

- `sum[k]` = suma de `w[k]` de la opción elegida en cada dilema del test.
- `max[k]` = suma, sobre los 10 dilemas, del máximo `w[k]` entre las 3 opciones de ese dilema.
- `profile[k] = round(20 + 80 * sum[k] / max[k])` → rango 20–100.

### 5.3 Escuela ética

Contar `sc` de las opciones elegidas (`U`,`D`,`V`,`C`). La escuela es la de mayor conteo; en empate gana la primera en el orden `U, D, V, C` (comportamiento actual de `Object.entries().sort`). Guardar también el conteo completo (`schools`).

### 5.4 Coherencia (declarado vs. observado)

- `declared[eje]` = posición 1..6 en `rank`.
- `observed[eje]` = posición 1..6 al ordenar los ejes por `profile` descendente (empates: orden estable del array `AXES`).
- Spearman: `rho = 1 - 6 * Σ(declared-observed)² / (6 * 35)`; `coherence = round((rho + 1) / 2 * 100)` → 0–100.
- `contra` = ejes con `declared ≤ 2` y `observed ≥ 4` (lista de nombres; se muestra como "contradicción detectada").

### 5.5 Compatibilidad medalla/tipo

`compat = round((profile[fit[0]] + profile[fit[1]]) / 2)` usando los dos ejes `fit` del tipo.

### 5.6 Evolución de la medalla (Kohlberg)

- `stage` = promedio de `reasons` sobre los 10 dilemas, redondeado a 1 decimal.
- `evo`: `< 2.5` → "Medalla novata"; `< 4.5` → "Medalla social"; si no → "Medalla de principios". Textos descriptivos: los del MVP.

### 5.7 Número de serie

`serial = TYPE + '-' + (10000 + random(0..89999))`. En producción debe ser **único por curso**: generar en cliente y reintentar si la DB rechaza por unicidad.

### 5.8 Predicción en Arena

Para un robot `r` y un escenario `sc` con opciones `o[i]` (pesos `w` o, si hay giro activo, `g.w[i]`):

- `score[i] = Σ_k w[k] * profile[k]`; si `o[i].sc === r.school` entonces `score[i] *= 1.15`.
- `best = argmax(score)`.
- `drivers` = los 2 ejes con mayor `w[k] * profile[k]` en la opción ganadora (nombres en minúscula).
- `conf = round(100 * (score₁ - score₂) / score₁)` con los dos mejores puntajes; 100 si solo hay uno.
- Con giro: recalcular y marcar `changed = (bestGiro !== bestOriginal)`.

### 5.9 Código de medalla (respaldo offline)

`base64(utf8(JSON(robot sin campo schools)))` sin `=` de relleno. El importador debe seguir aceptando estos códigos y archivos JSON exportados por el MVP.

---

## 6. Modelo de datos (Supabase / Postgres)

```sql
-- supabase/migrations/0001_init.sql
create table courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id),
  name text not null,                 -- "Ética y Legislación en Datos · 535213"
  join_code text not null unique,     -- 6 caracteres, p. ej. KBT-2045
  created_at timestamptz default now()
);

create table robots (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  serial text not null,
  name text not null check (char_length(name) <= 30),
  author text not null check (char_length(author) <= 60),
  type text not null,                 -- código de TYPES
  purpose text,
  principal text,
  parts jsonb not null,               -- {head,rarm,larm,legs}
  color text not null,
  rank text[] not null,               -- 6 ejes
  "limit" text not null,
  trait text,
  data_collected text[],
  retention text,
  answers jsonb not null,             -- {dilemmaId: optionIdx}
  reasons jsonb not null,             -- {dilemmaId: stage}
  -- resultados calculados (se recalculan en cliente y se guardan para consulta rápida)
  profile jsonb not null,             -- {S,O,H,P,A,L}
  school text not null,               -- U|D|V|C
  schools jsonb not null,             -- conteo
  coherence int not null,
  compat int not null,
  contra text[] not null default '{}',
  stage numeric(3,1),
  evo text,
  circuit text not null,
  client_token text not null,         -- token del navegador del estudiante (para editar su propio robot)
  created_at timestamptz default now(),
  unique (course_id, serial)
);

create table bouts (                   -- una robatalla en la Arena
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  robot_a uuid not null references robots(id),
  robot_b uuid not null references robots(id),
  scenario_id text not null,          -- índice/clave en arena.json
  status text not null default 'open', -- open | revealed | twisted | closed
  created_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  bout_id uuid not null references bouts(id) on delete cascade,
  client_token text not null,
  phase text not null,                -- 'before' | 'after_twist'
  option_idx int not null check (option_idx between 0 and 2),
  side text not null,                 -- 'A' | 'B' (por cuál robot vota la opción)
  unique (bout_id, client_token, phase, side)
);
```

**Políticas RLS (resumen):**
- `courses`: el profesor (`teacher_id = auth.uid()`) lee/escribe las suyas. Lectura pública **solo** de `id, name` vía función `join_course(code)` que devuelve el `course_id` si el código existe.
- `robots`: inserción anónima permitida si el `course_id` existe; lectura pública dentro del curso (la galería es pública para quien tiene el código); actualización solo si `client_token` coincide o si es el profesor del curso; borrado solo profesor.
- `bouts`: escribe solo el profesor; lee cualquiera del curso.
- `votes`: inserción anónima (un voto por token/fase/lado); lectura agregada vía vista `vote_counts`.

Tokens de estudiante: UUID generado en el navegador y guardado en `localStorage`. No hay cuentas.

---

## 7. Funcionalidades por rol

### 7.1 Estudiante

1. **Entrar** (`/entrar`): código de curso + nombre (o nombre de dupla). Guarda `course_id`, `author`, `client_token`.
2. **Forja** (`/forja/1..4`), idéntica al MVP:
   - Paso 1 Cuerpo: nombre, tipo (muestra descripción y ejes de compatibilidad), propósito, a quién sirve, 4 medapartes, color; vista previa en vivo.
   - Paso 2 Medalla: ordenar 6 principios (botones subir/bajar; en móvil también arrastrar), límite infranqueable (obligatorio), rasgo, datos que recoge, retención.
   - Paso 3 Test: 10 dilemas del test del tipo; en cada uno, opción **y** motivo son obligatorios; barra de progreso; nota de circuito al inicio.
   - Paso 4 Resultado: medalla, temperamento, principio que más/menos pesó, coherencia, compatibilidad, evolución, circuito, contradicción detectada; botones **Publicar en la galería** (sube a Supabase), **Descargar medalla PNG**, **Copiar código** (respaldo).
   - El borrador persiste en `localStorage` y se puede retomar.
3. **Galería** (`/galeria`): todos los robots del curso; abrir ficha; el propio robot marcado y editable hasta que el profesor cierre la galería.
4. **Votar** (`/votar`): cuando hay una robatalla abierta, ve el escenario y elige qué opción cree que tomará cada robot. Tras el giro, vuelve a votar. Ve el resultado al revelar.

Lo que el estudiante **no ve**: nombre técnico de la escuela ética, número de etapa Kohlberg, panel agregado.

### 7.2 Profesor

1. **Login** (`/profesor`): magic link. Crear curso → obtiene código de unión y enlace `/entrar?c=CODIGO`.
2. **Panel** (`/profesor/panel`): lista de robots con escuela, coherencia, compatibilidad, evolución, circuito; filtros; eliminar; exportar CSV y JSON; importar códigos/JSON del MVP.
3. **Agregados del grupo**: distribución de escuelas, distribución de niveles Kohlberg, promedio de coherencia, ejes más y menos valorados, robots con contradicción. Sirve para la sesión de revelación.
4. **Arena** (`/arena`): elegir robot A, robot B y escenario → **Presentar** (crea `bout`, abre votación) → **Revelar** (muestra predicción y resultado de votos) → **Cambiar un factor** (aplica giro, reabre votación fase 2) → **Revelar** → **Cerrar**. Cada acción cambia `bouts.status` y la pantalla de proyección reacciona.
5. **Cerrar galería**: bloquea nuevas subidas y ediciones.

### 7.3 Pantalla de proyección (`/pantalla`)

Sin controles. Escucha `bouts` del curso por Realtime y muestra: escenario, los dos robots (SVG grande), conteo de votos en vivo, y al revelar las decisiones con drivers y certeza, el mensaje del Sr. Referí, y tras el giro si cada robot cambió o no. Tipografía grande, pensada para un proyector. Fuera de robatalla muestra la galería en modo mosaico con rotación lenta.

---

## 8. Diseño visual

Portar el sistema del MVP, no rediseñar:
- Tokens: `--paper #FBF6E6`, `--ink #1B1B2F`, `--yellow #F5C518`, `--red #D8382E`, `--steel #9AA3AD`, `--green #2FB39A`, `--blue #2B67C2`; modo oscuro con los mismos nombres.
- Fondo con trama de puntos (halftone), hojas tipo "Data File" con borde de 3 px y sombra sólida, sellos rojos inclinados, botones con sombra desplazada.
- Encabezado fijo tipo Medawatch (fondo tinta, línea amarilla).
- La medalla hexagonal es el elemento memorable; todo lo demás debe ser sobrio.
- Responsive: la forja y la votación se usan desde celulares; la Arena y la pantalla desde un portátil/proyector.
- Accesibilidad mínima: foco visible, contraste AA, `prefers-reduced-motion`.

---

## 9. Fases, tareas y criterios de aceptación

### Fase 0 — Monorepo y contenido (½ día)

Tareas:
- [ ] Inicializar pnpm workspaces, Vite + React + TS, ESLint, Prettier, Vitest.
- [ ] Extraer del HTML de referencia todos los bloques de datos a `packages/content/*.json` con un script `scripts/extract-content.mjs` (que lea el HTML, evalúe las constantes y escriba los JSON). Así el contenido no se copia a mano.
- [ ] `packages/content/index.ts` con tipos y funciones `testFor(type)`, `getDilemma(id)`, `getScenario(idx)`.
- [ ] Tests de integridad: 30 dilemas, 12 escenarios, ids únicos, cada `w` tiene 6 enteros 0–3, cada giro tiene 3 vectores de 6, cada tipo produce test de 10, cada escuela `sc ∈ {U,D,V,C}`.

Aceptación: `pnpm test` pasa; `docs/contenido.md` generado automáticamente con la tabla de dilemas (id, circuito, título) y escenarios.

### Fase 1 — Motor y forja local (1 día)

Tareas:
- [ ] `packages/engine`: `computeProfile`, `predict`, `encode/decode`, `serial`, con tests que fijen casos de referencia (tomar 3 robots forjados en el MVP, guardar entrada y salida esperada como fixtures).
- [ ] `packages/ui`: `RobotSvg`, `MedalSvg` (port fiel), `exportPng(svgString, size)` con canvas y fallback a SVG.
- [ ] `apps/web`: rutas Landing, Forja 1–4, Resultado, funcionando 100 % offline con `localStorage` (paridad con el MVP).
- [ ] Importar/exportar código de medalla.

Aceptación: un robot forjado en el MVP y otro en la nueva app con las mismas respuestas producen el mismo `profile`, `school`, `coherence`, `compat`, `stage`. Playwright: flujo completo de forja en móvil (375 px) y escritorio.

### Fase 2 — Supabase, curso y galería (1 día)

Tareas:
- [ ] Migración `0001_init.sql`, RLS, función `join_course`, vista `vote_counts`.
- [ ] Auth del profesor (magic link) y creación de curso.
- [ ] `/entrar` con código; `/galeria` con Realtime; ficha de robot; publicar desde el resultado.
- [ ] Panel del profesor: lista, filtros, eliminar, exportar CSV/JSON, importar códigos/JSON del MVP, cerrar galería.
- [ ] Agregados del grupo (escuelas, niveles, coherencia media, ejes).

Aceptación: dos navegadores distintos publican robots y ambos los ven aparecer sin recargar; un estudiante no puede borrar el robot de otro; el profesor sí; la importación de un código del MVP produce una ficha idéntica.

### Fase 3 — Arena en vivo (1 día)

Tareas:
- [ ] `/arena` (profesor), `/pantalla` (proyección), `/votar` (estudiante) sincronizados por `bouts` y `votes`.
- [ ] Flujo completo: presentar → votar → revelar → cambiar un factor → votar → revelar → cerrar.
- [ ] Sr. Referí: los tres mensajes del MVP (misma decisión / dos caminos / un dato cambió).
- [ ] Guardar en `bouts` el resultado de la predicción y de los votos para consulta posterior.

Aceptación: con 3 celulares y una pantalla, una robatalla completa se ejecuta sin recargar nada; los votos no se duplican por token; la pantalla muestra "cambió de decisión" en rojo cuando corresponde.

### Fase G — Ciudad 2045: la forja como videojuego (1–2 días)

Especificación: `docs/superpowers/specs/2026-09-26-ciudad-2045-design.md` · Plan: `docs/superpowers/plans/2026-09-26-ciudad-2045.md`.

Tareas:
- [x] Lógica pura en `apps/web/src/game/` (mapa, progreso, eje dominante) con tests.
- [x] Escenas Taller, Yunque, Ciudad 2045 y Ceremonia (React + SVG), cargadas bajo demanda.
- [x] Guardado de la partida y «Ver como formulario».
- [x] E2E: partida completa, paridad juego ↔ formulario, retomar, teclado (incluido recorrido con Tab) y movimiento reducido.

Aceptación: un estudiante completa la forja jugando en un celular de gama media sin tutorial y el robot resultante es idéntico al del formulario; la partida se retoma otro día; todas las pruebas previas siguen pasando.

### Fase 4 — Medallas para imprimir y cierre (½ día)

Tareas:
- [ ] Exportación PNG 2400×2550 y SVG con fuentes embebidas (usar `@font-face` con base64 de Archivo Black dentro del SVG para que imprima igual).
- [ ] Plantilla PDF "hoja de medallas" del curso: 6 por página, con nombre, serie y autor (para impresión en acrílico o cartulina).
- [ ] `docs/guia-docente.md`: las cuatro sesiones (lanzamiento, forja, arena, revelación), tiempos, preguntas guía, cómo leer el panel agregado, cómo revelar las escuelas y Kohlberg, bibliografía de los circuitos.
- [ ] Despliegue en Vercel + Supabase, dominio, variables de entorno documentadas en `README.md`.

Aceptación: una medalla impresa desde el PNG se ve idéntica a la de pantalla; un profesor nuevo puede correr la actividad solo con la guía.

### Fase 5 — v2 (después del piloto)

Ver sección 10.

---

## 10. Backlog v2 (no construir todavía)

- **Evolución de la medalla**: cada robatalla modifica el perfil del robot (± en los ejes activados por la decisión), con historial. Requiere decidir reglas con el profesor antes de codificar.
- **Circuitos como módulos del curso**: activar circuitos por semana; un robot puede recorrer varios.
- **Tercera vía**: campo en la Arena para que la clase proponga una opción nueva; el profesor le asigna pesos en vivo y se recalcula.
- **Narrador / intro en video** y ficha de la Corporación Medabot.
- **Multi-profesor y multi-institución**; versión "empresa" para comités de ética de IA.
- **Exportación académica**: dataset anónimo del grupo para ponencias.

---

## 11. Contenido de `CLAUDE.md`

```markdown
# Medalab 2045

Plataforma pedagógica de ética de la IA inspirada en Medabots. Ver PLAN.md para la especificación completa.

## Reglas
- El contenido (dilemas, escenarios, pesos, textos de catálogos) vive en packages/content/*.json y se extrae de reference/medalab-mvp.html. NUNCA lo edites a mano ni lo "mejores"; si ves un error, repórtalo.
- El motor (packages/engine) debe reproducir exactamente las fórmulas de PLAN.md §5. Cualquier cambio requiere actualizar los fixtures y explicarlo.
- Idioma de la interfaz: español (Colombia). Tono: directo, sin jerga técnica hacia el estudiante.
- Estilo visual: portar el sistema del MVP (tokens en apps/web/src/styles/tokens.css). No introducir Tailwind, MUI ni librerías de componentes.
- Estudiantes no tienen cuenta. Nunca pedir email a un estudiante.
- Lo que el estudiante no debe ver: nombre técnico de la escuela ética, número de etapa Kohlberg, panel agregado. Estos datos solo se renderizan en rutas /profesor/* y /arena con sesión de profesor.

## Comandos
- pnpm i
- pnpm dev            (apps/web)
- pnpm test           (vitest: content + engine)
- pnpm e2e            (playwright)
- pnpm supabase:reset (aplica migraciones y seed local)

## Definición de hecho
Una fase está terminada cuando: tests pasan, los criterios de aceptación de PLAN.md §9 se cumplen y hay un commit con mensaje "feat(faseN): ...".
```

---

## 12. Pruebas mínimas obligatorias

| Nivel | Qué | Dónde |
|---|---|---|
| Unitario | Integridad del contenido (§9 Fase 0) | `packages/content` |
| Unitario | `computeProfile` y `predict` contra fixtures del MVP; `encode/decode` ida y vuelta | `packages/engine` |
| Unitario | `testFor` devuelve 10 para los 7 tipos y el orden core→circuito | `packages/content` |
| E2E | Forja completa y publicación (móvil y escritorio) | `apps/web/e2e/forge.spec.ts` |
| E2E | Galería en tiempo real entre dos contextos de navegador | `apps/web/e2e/gallery.spec.ts` |
| E2E | Robatalla completa con votación y giro | `apps/web/e2e/arena.spec.ts` |

---

## 13. Riesgos y decisiones pendientes del profesor

- **Pesos de los dilemas**: son criterio editorial. Antes del piloto, forjar 5 robots de prueba y revisar que las predicciones de la Arena no se sientan arbitrarias. Si hay que ajustar, se hace en los JSON y se actualizan los fixtures.
- **Duración del test**: 10 dilemas con motivo ≈ 20 minutos. Si fatiga, el plan B es 8 (6 core + 2 del circuito); es un cambio de una línea en `testFor`.
- **Contenido sensible**: el dilema "El hijo que oye como ellos" (circuito Cuerpo) puede requerir aviso previo; decidir si se mantiene.
- **Nombres de estudiantes**: se guardan como texto libre sin verificación. Aceptable para una clase; documentarlo en la guía.
- **Marca**: "Medabots" es una marca registrada. El proyecto usa el universo como inspiración pedagógica y nombres propios (Medalab, Corporación Medabot como ficción de clase). Si se publica fuera de la UAO, revisar naming y no usar arte oficial.
