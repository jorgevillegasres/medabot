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
- pnpm dev (apps/web)
- pnpm test (vitest: content + engine)
- pnpm e2e (playwright)
- pnpm supabase:reset (aplica migraciones y seed local)
- pnpm content:extract (regenera packages/content/*.json y docs/contenido.md desde reference/medalab-mvp.html)

## Definición de hecho

Una fase está terminada cuando: tests pasan, los criterios de aceptación de PLAN.md §9 se cumplen y hay un commit con mensaje "feat(faseN): ...".
