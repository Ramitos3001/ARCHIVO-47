// FASE 10 · Fotografías: registro fotográfico de evidencias y lugares.
// Fotos pegadas con cinta; se amplían y se pueden marcar como relevantes.
import { escapar } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { abrirVisor, activarLupa } from '../../components/visor.js';
import { ilustracionEvidencia, escenaDe } from '../ilustraciones.js';
import { botonTablero } from '../tablero.js';
import { vacio, numero2, numero3, personasEn, marcas } from '../comun.js';

const GIROS = [-3, 2.5, -1.5, 3.5, -2.5, 1.2];

// No hay fotografías en la BD: se fotografía cada evidencia visible y cada lugar
function fotografias(datos) {
  return [
    ...datos.ubicaciones.map((u) => ({
      clave: `u${u.idUbicacion}`,
      titulo: u.nombre,
      imagen: (clase) => escenaDe(u, clase),
      descripcion: u.descripcion,
      lugar: u.direccion,
      texto: `${u.nombre} ${u.descripcion}`
    })),
    ...datos.evidencias.map((e) => ({
      clave: `e${e.idEvidencia}`,
      titulo: `Evidencia #${numero3(e.idEvidencia)} · ${e.nombre}`,
      imagen: (clase) => ilustracionEvidencia(e, clase),
      descripcion: e.descripcion,
      lugar: null,
      texto: `${e.nombre} ${e.descripcion}`
    }))
  ];
}

const relevantes = (exp) => marcas('relevantes', exp.partida.idPartida);

function pintarMarca(figura, relevante) {
  figura.classList.toggle('foto--relevante', relevante);
  const boton = figura.querySelector('[data-marcar]');
  boton.setAttribute('aria-pressed', String(relevante));
  boton.textContent = relevante ? '◉ Relevante' : '○ Marcar';
}

export function render({ exp, datos }) {
  const fotos = fotografias(datos);
  if (!fotos.length) return vacio('No hay fotografías en el expediente.');
  const marcadas = relevantes(exp);
  return `
    <p class="hoja__entradilla">Registro fotográfico. Amplía una foto para estudiarla; marca las que creas relevantes.</p>
    <div class="album">
      ${fotos.map((f, i) => {
        const relevante = marcadas.tiene(f.clave);
        return `
          <figure class="foto${relevante ? ' foto--relevante' : ''}" style="--giro: ${GIROS[i % GIROS.length]}deg" data-clave="${f.clave}">
            <span class="cinta foto__cinta" aria-hidden="true"></span>
            <button type="button" class="foto__imagen" data-foto="${i}" aria-label="Ampliar fotografía ${numero2(i + 1)}: ${escapar(f.titulo)}">
              ${f.imagen()}
              <span class="foto__circulo" aria-hidden="true"></span>
            </button>
            <figcaption class="foto__pie">
              <span class="nota-mano">${escapar(f.titulo)}</span>
              <span class="foto__numero">Foto ${numero2(i + 1)}</span>
            </figcaption>
            <button type="button" class="foto__marcar" data-marcar="${f.clave}" aria-pressed="${relevante}">${relevante ? '◉ Relevante' : '○ Marcar'}</button>
          </figure>`;
      }).join('')}
    </div>`;
}

export function montar(hoja, contexto) {
  const fotos = fotografias(contexto.datos);
  hoja.addEventListener('click', (e) => {
    const marcar = e.target.closest('[data-marcar]');
    if (marcar) {
      const ahora = relevantes(contexto.exp).alternar(marcar.dataset.marcar);
      pintarMarca(marcar.closest('.foto'), ahora);
      reproducir(ahora ? 'sello' : 'click');
      return;
    }
    const abrir = e.target.closest('[data-foto]');
    if (abrir) ampliar(contexto, fotos, Number(abrir.dataset.foto), hoja);
  });
}

function ampliar({ exp, datos }, fotos, i, hoja) {
  const f = fotos[i];
  const personas = personasEn(f.texto, datos.sospechosos);
  const marcadas = relevantes(exp);
  const raiz = abrirVisor(`
    <header class="visor__encabezado">
      <span>Archivo 47 · Registro fotográfico</span><span>Foto ${numero2(i + 1)}</span>
    </header>
    <div class="examen examen--foto">
      <div class="lupa lupa--foto" title="Clic para ampliar">${f.imagen()}</div>
      <button type="button" class="boton-tinta boton-tinta--suave examen__lupa" data-lupa aria-pressed="false">+ Ampliar</button>
    </div>
    <h2 class="visor__titulo">${escapar(f.titulo)}</h2>
    <dl class="ficha-datos">
      ${f.lugar ? `<dt>Ubicación</dt><dd>${escapar(f.lugar)}</dd>` : ''}
      <dt>Personas relacionadas</dt><dd>${personas.length ? personas.map((p) => escapar(p.nombre)).join(', ') : 'NO CONSTA'}</dd>
    </dl>
    <p class="visor__rotulo">Descripción</p>
    <p class="visor__texto">${escapar(f.descripcion || 'Sin descripción.')}</p>
    <div class="visor__acciones">
      <button type="button" class="boton-tinta boton-tinta--rojo" data-relevante aria-pressed="${marcadas.tiene(f.clave)}">
        ${marcadas.tiene(f.clave) ? 'Quitar de relevantes' : 'Marcar como relevante'}
      </button>
      ${botonTablero(f.clave)}
    </div>`,
  { clase: 'visor--foto', etiqueta: `Fotografía ${f.titulo}` });

  activarLupa(raiz);
  raiz.querySelector('[data-relevante]').addEventListener('click', (e) => {
    const ahora = relevantes(exp).alternar(f.clave);
    e.currentTarget.textContent = ahora ? 'Quitar de relevantes' : 'Marcar como relevante';
    e.currentTarget.setAttribute('aria-pressed', String(ahora));
    const figura = hoja.querySelector(`.foto[data-clave="${f.clave}"]`);
    if (figura) pintarMarca(figura, ahora);
    reproducir(ahora ? 'sello' : 'click');
  });
}
