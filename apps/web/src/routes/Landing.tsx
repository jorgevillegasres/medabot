import { Link } from 'react-router-dom';
import { CIRCUITS, TYPES, TYPE_CIRCUIT, type CircuitKey } from '@medalab/content';
import { MedalSvg } from '@medalab/ui';

const HERO_MEDAL = {
  name: 'Metabee',
  serial: 'KBT-11220',
  color: '#F5C518',
  profile: { S: 78, O: 28, H: 70, P: 45, A: 92, L: 85 },
  compat: 81,
};

export function Landing() {
  const circuits = (Object.keys(CIRCUITS) as CircuitKey[]).filter((k) => k !== 'core');
  return (
    <section className="view">
      <div className="hero">
        <div>
          <h1>
            El cuerpo se compra en la tienda.
            <br />
            La medalla, no.
          </h1>
          <p>
            Año 2045. La robótica ya resolvió el cuerpo: cabeza, brazos y piernas se fabrican en
            serie y se cambian en cualquier taller. Lo que nadie ha resuelto es la <b>medalla</b>:
            la pieza que se instala en la espalda del robot y que contiene su conciencia, su
            carácter y su forma de decidir cuando dos cosas buenas chocan.
          </p>
          <p>
            En este laboratorio tú eres ingeniero de conciencia. Diseñas un robot con un propósito,
            forjas su medalla y la sometes a un test moral. Después, en la Arena, tu robot
            enfrentará escenarios que nunca vio, y tendrás que defender por qué decidió lo que
            decidió.
          </p>
          <div className="lore">
            <p>
              Regla del laboratorio: la medalla evoluciona con la experiencia, y un robot rinde al
              máximo solo cuando su medalla es compatible con su tipo. Una conciencia mal puesta en
              un cuerpo equivocado es un robot que falla.
            </p>
          </div>
          <div className="row">
            <Link className="btn" to="/forja/1">
              Forjar mi medalla
            </Link>
            <Link className="btn alt" to="/medallas">
              Mis medallas
            </Link>
          </div>
        </div>
        <div className="medal">
          <MedalSvg robot={HERO_MEDAL} />
        </div>
      </div>

      <div className="sheet" style={{ marginTop: 34 }}>
        <span className="stamp">Cómo funciona</span>
        <div className="grid g3">
          <div>
            <h3>1. Diseña el cuerpo</h3>
            <p>
              Elige tipo, propósito y las cuatro medapartes. Aquí no hay respuestas correctas: solo
              decisiones de diseño.
            </p>
          </div>
          <div>
            <h3>2. Forja la medalla</h3>
            <p>
              Ordena seis principios en conflicto, fija el límite que tu robot jamás cruzará y
              declara qué datos recoge.
            </p>
          </div>
          <div>
            <h3>3. Pasa el test</h3>
            <p>
              Seis pruebas del laboratorio más un circuito que depende del tipo de tu robot: Cuerpo,
              Umbral, Estado, Ciencia, Guerra o Vínculos. El resultado no es una nota: es un perfil,
              y a veces contradice lo que declaraste.
            </p>
          </div>
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          Al terminar obtienes un código de medalla. Envíaselo al profesor: él lo importa en la
          galería del curso y tu robot queda listo para la Arena.
        </p>
      </div>

      <div className="sheet" style={{ marginTop: 22 }}>
        <span className="stamp">Circuitos</span>
        <p>
          El test tiene una parte común y una parte que depende de para qué existe tu robot. Un
          Custodio no enfrenta lo mismo que un Guardián. Cada circuito está construido sobre dilemas
          reales de una disciplina distinta.
        </p>
        <div className="grid g3">
          {circuits.map((k) => (
            <div key={k}>
              <h3>{CIRCUITS[k].n}</h3>
              <p className="hint">
                {CIRCUITS[k].d}
                <br />
                <b>Tipos:</b>{' '}
                {TYPES.filter((t) => TYPE_CIRCUIT[t.c] === k)
                  .map((t) => t.n)
                  .join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
