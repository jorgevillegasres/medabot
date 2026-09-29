# La forja apoyada en la bibliografía (Fase J)

> 2026-09-29. El profesor pidió revisar toda la bibliografía (carpeta `libros/`, 46 obras) y usarla como base del asistente paso a paso (Fase I). Se leyó en seis grupos: métodos para dilemas, fuentes de los circuitos, ética de la IA, datos y vigilancia, sesgo y justicia, y redes y Medabots. No cambia contenido, motor ni datos.

## 1. Qué cambia en la forja

Todas las preguntas nuevas viven en `apps/web/src/game/referee.ts`, cada una con el libro que la respalda. No se responden ni se guardan: el estudiante piensa y la clase discute.

| Lugar | Cambio | Respaldo |
| --- | --- | --- |
| Yunque · jerarquía | «Tu robot pone A por encima de B. ¿En qué situación debería ganar B?» y la nota de que lo de abajo no deja de importar | Harding (1985); Jones et al. (2021); Ferrarello (2023) |
| Yunque · límite | Tres preguntas: el choque con el primer principio, el robot tramposo que cumple la letra, la prueba de universalizar | Guía docente; Russell (2019); Jones et al. (2021) |
| Yunque · datos | Preguntas según lo elegido: a quién afecta cada dato, qué daño hace una filtración de datos sensibles, a quién deja por fuera, qué hace si otro pide los datos; con «Ninguno», quién controla lo que recoge | Gallop (2020); Véliz (2021); AEPD (2024); Criado Perez (2019); Steinberger (2025); Zittrain (2008) |
| Yunque · conservación | El ejemplo incluye un plan de borrado | Véliz (2021) |
| Ciudad · consigna | Si ninguna opción convence, se elige la más cercana y la otra salida se lleva a clase | Gallop (2020); Harding (1985) |
| Ciudad · decisión | Pausa «Antes de decidir»: el problema sin tomar partido, los afectados, cómo lo ve cada uno | Gallop (2020), pasos A-S-P |
| Ciudad · motivo | Una pregunta del Sr. Referí por dilema, propia de su circuito | Dignum (2020); Iansiti y Lakhani (2020); Appel (2019); Carr y Berger (2025); Swarup (2020); Petritsch (2018); Boutin et al. (2026); Ferrarello (2023) |
| Ciudad · revisión | La duda como hallazgo, lo propio que empujó una decisión, la prueba de contarlo a la familia | Gallop (2020), paso E; Ferrarello (2023) |

Se mantiene sin premios ni rachas (Vaidhyanathan, 2018; Carr, 2010) y sin mostrar números tras cada dilema (decisión de la Fase G).

## 2. Qué no cambia y queda para el profesor

Ver `docs/guia-docente.md` §8, «Decisiones de contenido pendientes»: la premisa de «Doble efecto», la justicia como principio o pregunta, las tensiones ausentes (apagado, rendición de cuentas), la procedencia de un dilema de Umbral y los casos sugeridos. Tampoco se implementan, por requerir decisión del profesor: que el robot «proteste» durante el test cuando el motivo choca con la jerarquía (contradice la decisión de la Fase G), campos de texto libre que se guarden (cambian el borrador y el código de medalla), ni cambios en la Arena.

## 3. Guía docente

§10 con la bibliografía completa en APA agrupada por tema (completa las dos fuentes pendientes: Carr y Berger, 2025, para Umbral; Swarup, 2020, para Estado), §8 con cuidados ante temas sensibles y la lectura del dato de Kohlberg como tendencia, y §11 con actividades de clase sugeridas por los libros.

## 4. Pruebas

`referee.test.ts`: ninguna pregunta muestra datos ocultos (nombres técnicos de escuela, «Kohlberg», «etapa»); cada circuito tiene preguntas; las preguntas de datos reaccionan a lo elegido. Los E2E de la forja siguen pasando, paridad incluida.
