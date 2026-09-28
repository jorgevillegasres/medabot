# Medalab 2045

Plataforma de clase para el curso _Legislación y Ética en el Manejo de Datos_ (UAO). Los estudiantes diseñan un robot, forjan la medalla que contiene su conciencia jugando en **Ciudad 2045**, y enfrentan sus robots en una **Arena** en vivo con votación desde el celular.

- Especificación: [`PLAN.md`](PLAN.md) · Reglas para agentes: [`CLAUDE.md`](CLAUDE.md)
- Guía para el profesor: [`docs/guia-docente.md`](docs/guia-docente.md)
- Contenido (dilemas y escenarios): [`docs/contenido.md`](docs/contenido.md)

## Estructura

```
apps/web            Vite + React 18 + TypeScript (la app)
packages/content    Dilemas, escenarios y catálogos en JSON, extraídos del MVP
packages/engine     Motor de perfil y predicción (idéntico al MVP, con pruebas de paridad)
packages/ui         Robot y medalla en SVG, exportación PNG/SVG
supabase/           Migraciones, pruebas de permisos (RLS) y datos de ejemplo
reference/          MVP original (fuente del contenido; no se edita)
```

## Requisitos

- Node.js 20 o superior y pnpm (`npm i -g pnpm`).
- Opcional: un proyecto de [Supabase](https://supabase.com) para curso, galería y Arena. Sin él, la app funciona en modo local (forja y «Mis medallas» en el navegador).

## Instalar y correr

```bash
pnpm i
pnpm dev            # http://localhost:5173
```

Variables de entorno (copiar `.env.example` a `apps/web/.env.local`):

| Variable                        | Valor                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL del proyecto (Settings → API)                                                                                                                       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave _publishable_ (`sb_publishable_…`). Es pública por diseño: la seguridad la imponen las políticas RLS. **Nunca** uses la `service_role` en la app. |

## Pruebas

```bash
pnpm test                 # unitarias (contenido, motor, UI, lógica del juego)
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm e2e                  # Playwright (forja, juego, paridad, galería, Arena, impresión)
pnpm content:extract      # regenera el contenido desde reference/ (y --check lo verifica)
```

Algunas pruebas E2E necesitan Supabase configurado:

- `gallery.spec.ts`: acceso anónimo activo y el curso demo `DEMO-2045` (`supabase/seed.sql`).
- `arena.spec.ts`: además, una sesión de profesor guardada: `pnpm --filter @medalab/web e2e:profesor`, escribir el correo en la ventana que se abre y pegar **en esa ventana** el enlace recibido.

Después de correrlas contra un proyecto real, borra los datos de prueba:

```sql
delete from public.robots where name like 'E2E %';
delete from public.course_members where author like '%(e2e)';
```

## Supabase

1. Crear el proyecto y aplicar, en orden, `supabase/migrations/0001_init.sql`, `0002_hardening.sql` y `0003_arena.sql` (SQL Editor o CLI).
2. Opcional: comprobar permisos con `supabase/tests/rls.sql` y `rls_arena.sql` (corren en una transacción con `rollback`; no dejan datos).
3. **Authentication → Sign In / Providers**: activar **Anonymous sign-ins** (los estudiantes entran sin cuenta).
4. **Authentication → URL Configuration**: _Site URL_ = dominio público; _Redirect URLs_ = `https://<dominio>/**` y `http://localhost:5173/**`.
5. **Correo**: el servicio incluido de Supabase envía muy pocos correos por hora (el profesor puede quedarse sin enlace de acceso). Para uso real, configura un SMTP propio en **Authentication → Emails → SMTP Settings** (p. ej. Resend o Brevo, ambos con plan gratuito).
6. Datos de ejemplo: con un profesor ya registrado, ejecutar `supabase/seed.sql` (crea el curso `DEMO-2045` con 4 robots).

## Despliegue en Vercel

El repositorio incluye [`vercel.json`](vercel.json) (instala con pnpm, compila `apps/web` y redirige todas las rutas a `index.html`).

1. Importar el repositorio en Vercel (_Add New → Project_), con la raíz del repo como _Root Directory_.
2. En _Environment Variables_, agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Desplegar. Luego, en Supabase, agregar el dominio de Vercel (o el propio, p. ej. `medalab.asesorialegalvigo.online`) a _Site URL_ y _Redirect URLs_ (paso 4 de arriba).
4. Dominio propio: _Project → Settings → Domains_ en Vercel y el registro DNS que indique.
