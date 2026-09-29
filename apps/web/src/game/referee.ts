// Preguntas de reflexión del Sr. Referí (spec 2026-09-29-bibliografia §3).
// No se responden ni se guardan: son para pensar y para la discusión en clase.
// Cada pregunta indica el libro que la respalda (bibliografía en docs/guia-docente.md §10).
// El profesor puede editarlas aquí sin tocar el contenido ni el motor.
import type { CircuitKey } from '@medalab/content';

/** Yunque · jerarquía: el principio de abajo no deja de importar (Harding 1985; Jones et al. 2021; Ferrarello 2023). */
export const rankQuestion = (top: string, second: string) =>
  `Tu robot pone ${top} por encima de ${second}. ¿En qué situación debería ganar ${second}?`;

export const RANK_NOTE =
  'Ordenar no significa que lo de abajo no importe: cada duelo que ganas deja algo perdido.';

/** Yunque · límite infranqueable. */
export const limitQuestions = (top: string) => [
  // Guía docente §3.
  `Tu primer principio es ${top}. Si tu límite choca con él, ¿qué gana?`,
  // Russell 2019: el robot que cumple la letra de una prohibición y viola su espíritu.
  '¿Cómo lo burlaría un robot tramposo que cumple la letra pero no la intención?',
  // Jones et al. 2021: la prueba de universalizar.
  '¿Aceptarías que todos los robots tuvieran este mismo límite?',
];

/** Datos que la bibliografía trata como sensibles (Véliz 2021; AEPD 2024). */
const SENSITIVE = ['Rostros', 'Voz y conversaciones', 'Salud'];

/** Yunque · datos que recoge: una ética de datos, no solo una casilla. */
export function dataQuestions(data: string[]): string[] {
  if (data.includes('Ninguno'))
    // Zittrain 2008: sensores de uso general que se pueden reutilizar para vigilar.
    return [
      'Si el fabricante pudiera cambiar a distancia lo que tu robot recoge, ¿cómo lo sabrías?',
    ];
  const qs = [
    // Gallop 2020 (paso S de ASPIRE); Véliz 2021 (la privacidad es colectiva).
    '¿A quién afecta cada dato: a su dueño, a quien pasa cerca, a la ciudad?',
  ];
  const sensitive = data.filter((d) => SENSITIVE.includes(d));
  if (sensitive.length)
    // Véliz 2021 (los datos personales son un activo tóxico); AEPD 2024 (categorías especiales).
    qs.push(
      `${sensitive.join(' y ')}: si se filtran mañana, ¿qué daño causan? Eso ya no se recoge.`,
    );
  // Criado Perez 2019; Rudder 2014: quien no aparece en los datos no existe para el sistema.
  qs.push('¿A quién deja por fuera tu robot? Piensa en quien no aparece en sus datos.');
  // Steinberger 2025 (desvío de finalidad); Pasquale 2015 (corredores de datos).
  qs.push('Si una empresa, la policía o una aseguradora pide esos datos, ¿qué hace tu robot?');
  return qs;
}

/** Ciudad · antes de decidir: pausa con los primeros pasos de ASPIRE (Gallop 2020). */
export const PAUSE_QUESTIONS = [
  '¿Cuál es el problema, dicho sin tomar partido?',
  '¿Quién sale afectado, además de tu robot?',
  '¿Cómo lo ve cada uno?',
];

/** Ciudad · después del motivo: una pregunta por dilema, según su circuito. */
const CIRCUIT_QUESTIONS: Record<CircuitKey, string[]> = {
  core: [
    // Dignum 2020 (Oxford Handbook, cap. 11): quien delega en una máquina sigue respondiendo.
    'Si esta decisión sale mal, ¿quién responde: tu robot, su dueño o quien lo fabricó?',
    // Iansiti y Lakhani 2020: la escala amplifica el daño.
    '¿Y si hubiera un millón de robots decidiendo igual que el tuyo?',
    // Diakopoulos 2020 (Oxford Handbook, cap. 10); Pasquale 2015.
    '¿Tu robot podría explicarle esta decisión a quien afectó, y no solo a su dueño?',
    // Russell 2019: la lealtad falla si ignora a los terceros.
    '¿Quién pagó el costo de esta decisión sin haber tenido voz?',
    // Jones et al. 2021: cambiar un factor y ver si la postura se sostiene.
    'Cambia un solo dato de la escena: ¿tu robot decidiría lo mismo?',
    // Gallop 2020: la prueba del noticiero.
    '¿Tu robot defendería esta decisión en el noticiero de las seis?',
  ],
  // Appel 2019: hallazgos incidentales y deber de advertir.
  cuerpo: [
    '¿A quién le pertenece un dato que nadie buscó?',
    'Lo que tu robot sabe por su función, ¿lo obliga a decirlo?',
  ],
  // Carr y Berger 2025, cap. 10: aclarar, validar, alinear, acompañar, individualizar.
  umbral: [
    '¿Tu robot le preguntó a la persona qué quería saber, o decidió por ella?',
    '¿Cuál es la intención de tu robot y cuál es solo un efecto?',
  ],
  // Swarup 2020.
  estado: [
    '¿Tu robot dejó por escrito su desacuerdo?',
    'Si nada de esto es ilegal, ¿qué lo haría estar mal?',
    '¿Qué costo acepta pagar tu robot por esta decisión?',
  ],
  // Petritsch 2018: el espectro que va de la práctica cuestionable al fraude.
  ciencia: [
    '¿Dónde queda esta decisión, entre la práctica cuestionable y el fraude?',
    'Si todos lo hacen, ¿deja de ser engaño?',
  ],
  // Boutin, Woodcock y Soltanzadeh 2026.
  guerra: [
    '¿El humano decidió, o solo firmó lo que la máquina sugirió?',
    'Ante la duda, ¿qué se presume: que es civil o que es objetivo?',
    'Si la máquina falla, ¿quién responde?',
  ],
  // Ferrarello 2023: lo trágico y la sabiduría práctica; Gilligan 1982.
  vinculos: [
    'Si un buen amigo tomara esta decisión, ¿qué le dirías?',
    '¿Qué se pierde, aunque tu robot haya elegido bien?',
  ],
};

/** Pregunta del Sr. Referí para el dilema en la posición `n` de su circuito. */
export function circuitQuestion(circuit: CircuitKey, n: number): string {
  const qs = CIRCUIT_QUESTIONS[circuit];
  return qs[n % qs.length];
}

/** Ciudad · revisión final: la E de ASPIRE (Gallop 2020) y los ejercicios de Ferrarello 2023. */
export const REVIEW_QUESTIONS = [
  '¿En qué encuentro dudaste más? Esa duda es el hallazgo.',
  '¿Algo de tu propia historia empujó alguna decisión?',
  '¿Le contarías estas decisiones a tu familia?',
];
