# Fase H · Rediseño visual: robots estilo A e interfaz «papel refinado»

Fecha: 2026-09-28 · Estado: aprobado por el profesor

## Por qué

Tras ver el pitch con capturas, el profesor juzgó el diseño «terrible» y los robots «feos». Problemas concretos observados en las capturas a 375 px:

- La cabecera ocupa dos líneas (el menú se parte).
- En el Taller, los botones de piezas se salen de sus tarjetas («Antena de rada…», «Ruedas» cortados).
- El robot son rectángulos planos: sin volumen, sin personalidad.

Decisiones del profesor (brainstorming del 2026-09-28):

1. Alcance: **robots + pantallas**. La medalla no cambia.
2. Robots: **estilo A · Medabot anime** (sombra plana en dos tonos, brillos, contorno de tinta, proporciones heroicas).
3. Interfaz: **dirección 1 · Papel refinado** (misma identidad de papel, tinta, amarillo y rojo; más ordenada).

## Excepción a CLAUDE.md

CLAUDE.md pide «portar el sistema del MVP» y `packages/ui/src/svg.ts` es un port fiel de `robotSVG()`, verificado por una prueba que exige texto SVG idéntico. Por decisión del profesor, **el dibujo del robot deja de ser una copia del MVP**. Se mantiene todo lo demás:

- La medalla (`medalSvg`) sigue idéntica al MVP y su prueba se conserva.
- El motor, el contenido, los catálogos y las fórmulas no se tocan.
- Los tokens de color de `tokens.css` se conservan (se pueden añadir tokens nuevos, no cambiar los existentes).
- No se introducen Tailwind, MUI ni librerías de componentes.

CLAUDE.md se actualiza con una línea que registra la excepción.

## 1. Robots estilo A

### Contrato

`robotSvg(r: RobotLook): string` conserva su firma, el `viewBox="0 0 200 200"`, `role="img"` y `aria-label="Robot <nombre escapado>"`. Todos los consumidores (Taller, formulario clásico, mapa a 40 px, Ceremonia, Resultado, Galería, Mis medallas, proyector, votación, Arena) reciben el nuevo arte sin cambios.

Se conserva la seguridad actual: el nombre pasa por `esc()`, el color por `safeColor()` (si no es `#hex` válido se usa `CATALOGS.colors[0]`), y las partes fuera de rango caen en la opción 0.

### Dibujo

Contorno de tinta `#1B1B2F`, 3 px, uniones redondeadas. Cada pieza pintada con el color del robot lleva:

- **Tono base**: el color elegido.
- **Sombra**: una forma plana en el lado derecho de la pieza con el color oscurecido (≈ 25 % hacia negro), calculada por una función `shade(hex, amount)` que acepta `#rgb` y `#rrggbb` (y por tanto los robots importados del MVP).
- **Brillo**: un trazo claro (color aclarado ≈ 55 % hacia blanco) en el lado iluminado.

Metal fijo: acero claro `#C9CED4`, acero oscuro `#9AA3AD`. Acentos: amarillo `#F5C518` (núcleo del pecho, visor), rojo `#D8382E` (luz de antena), verde `#2FB39A` solo cuando el robot no es verde (ojos).

Piezas (12), todas redibujadas en el estilo del boceto A aprobado:

| Parte | 0 | 1 | 2 |
|---|---|---|---|
| Cabeza | Cuerno kabuto: casco con cuerno en V y visor | Domo con visor: domo redondo, visor oscuro con línea amarilla, aletas laterales | Antena de radar: cabeza cuadrada, antena con luz roja, dos ojos |
| Brazo derecho (izquierda del dibujo) | Cañón | Pinza | Mano articulada |
| Brazo izquierdo (derecha del dibujo) | Escudo (con emblema) | Pinza | Mano articulada |
| Piernas | Bípedas: muslo de acero, rodilla, espinilla, pie | Orugas | Ruedas |

Torso común: pecho con sombra, núcleo amarillo, cintura de acero y hombreras. El orden de pintado garantiza que brazos y cabeza queden por encima del torso y las piernas por debajo.

Legibilidad: a 40 × 40 px (marcador del mapa) la silueta debe distinguir cabeza, torso y brazos. Se verifica con una captura del mapa.

### Miniaturas de piezas

Nueva función `partSvg(part: PartKey, option: number, color?: string): string` en `packages/ui` que dibuja **solo esa pieza**, recortada y centrada en su propio `viewBox`, reutilizando el mismo código de dibujo que `robotSvg` (una sola fuente para cada pieza). Se usa en el selector de piezas del Taller y del formulario clásico.

## 2. Interfaz «papel refinado»

Se trabaja sobre `apps/web/src/styles/{base,components,game}.css` y los componentes existentes. Reglas generales:

- **Escala tipográfica** fija en `tokens.css` (tokens nuevos: `--fs-xs … --fs-2xl`) y **espaciado** (`--sp-1 … --sp-6`). Los estilos existentes pasan a usar esos tokens.
- Tarjetas, botones y campos con el mismo radio, grosor de borde y sombra desplazada en todas las pantallas.
- A 375 px nada se desborda horizontalmente (se verifica con una prueba E2E que compara `scrollWidth` con `clientWidth` en cada pantalla del estudiante).

### Cabecera

- En pantallas < 720 px: logo a la izquierda y botón «Menú» (con `aria-expanded` y `aria-controls`) a la derecha, en una sola línea. El menú se despliega bajo la cabecera como lista vertical; se cierra al elegir una opción, al pulsar Escape o al cambiar de ruta.
- En pantallas ≥ 720 px: igual que hoy (enlaces en línea).
- Los enlaces conservan sus nombres accesibles.

### Taller (y formulario clásico)

- `PartsPicker` pasa a **pestañas**: Cabeza · Brazos · Piernas (patrón ARIA `tablist`/`tab`/`tabpanel`, flechas izquierda/derecha para moverse entre pestañas). «Brazos» muestra los dos grupos (Brazo derecho, Brazo izquierdo), cada uno con su título.
- Cada opción es una **ficha con la miniatura de la pieza** (`partSvg`) y su nombre debajo, en una cuadrícula de 3 columnas. La ficha elegida: fondo amarillo claro, borde grueso y una marca verde. Los botones conservan `aria-pressed` y su nombre accesible (el nombre de la opción), dentro de un `role="group"` con el nombre de la parte.
- Los botes de pintura se quedan como están, con el aro de selección actual.
- En el formulario clásico se usa el mismo componente.

### Barra de progreso de la forja

En el modo juego, bajo la cabecera de cada acto: «Acto N de 4 · Nombre» y una barra de 4 segmentos (los actos hechos en rojo, el actual en amarillo). Reemplaza visualmente al sello «Acto N · …» sin quitar el encabezado `h2` (se conserva como texto accesible).

### Resto de pantallas del estudiante

Inicio, Entrar al curso, Yunque, Ciudad (HUD y panel de lugar), Encuentro, Ceremonia, Resultado, Galería, Ficha del robot, Mis medallas y Votar: se aplican la escala, el espaciado y los componentes unificados. Además:

- HUD de la Ciudad: el nombre del robot no se trunca a «Cent…»; si no cabe, pasa a una segunda línea.
- Galería y Mis medallas: las tarjetas de robot muestran el robot sobre un fondo de «escenario» (papel 2 con piso), igual que el Taller.

### Fuera de alcance

- Disposición del panel del profesor, la Arena y el proyector (heredan los estilos, no se rediseñan).
- La medalla y la hoja de impresión.
- Animaciones nuevas (las existentes se conservan; siguen usando solo `transform` y `opacity`).

## 3. Pruebas y verificación

- `packages/ui/src/svg.test.ts`: la prueba «robot idéntico al MVP» se reemplaza por:
  - las 81 combinaciones × 7 colores producen un SVG que empieza con `<svg viewBox="0 0 200 200"` y parsea como XML (vía `DOMParser` en jsdom o una comprobación de etiquetas balanceadas);
  - el nombre con `& < > " '` sale escapado;
  - un color inválido o malicioso no aparece en la salida;
  - cada una de las 3 opciones de cada parte produce un SVG distinto;
  - `shade()` con `#rgb`, `#rrggbb` y valores límite.
  - `partSvg` devuelve un SVG por cada parte × opción.
- La prueba de la medalla idéntica al MVP se conserva sin cambios.
- E2E: se actualizan los helpers que eligen piezas (ahora hay que abrir la pestaña). Nueva prueba de desborde horizontal a 375 px. Todas las pruebas existentes deben pasar (`forge`, `parity`, `game`, `print`).
- Capturas antes/después de cada pantalla del estudiante a 375 px y 1280 px en el scratchpad, para revisión del profesor.

## Criterio de hecho

Pruebas unitarias y E2E en verde, lint/typecheck/format sin errores, capturas revisadas y commit `feat(faseH): …` en la rama `fase-h-rediseno`, luego merge a master.
