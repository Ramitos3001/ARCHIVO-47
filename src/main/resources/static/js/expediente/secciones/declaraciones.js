// FASE 15 · Declaraciones: entrevistas que se comparan con otros registros.
// El juego no dice quién miente: el investigador señala las contradicciones.
import { escapar } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { abrirVisor } from '../../components/visor.js';
import { botonTablero } from '../tablero.js';
import { vacio, numero2, fecha, hora, partirDeclaracion, registrosComparables, textoDocumento, marcas } from '../comun.js';

const contradicciones = (exp) => marcas('contradicciones', exp.partida.idPartida);
const claveDe = (d) => `c${d.idDeclaracion}`;

function cuantas(exp, d) {
  return contradicciones(exp).todas().filter((k) => k.startsWith(`${claveDe(d)}|`)).length;
}

function selloContradicciones(n) {
  return n ? `<span class="sello sello--pequeno declaracion__sello">${n === 1 ? 'Contradicción señalada' : `${n} contradicciones`}</span>` : '';
}

export function render({ exp, datos }) {
  if (!datos.declaraciones.length) return vacio('No hay declaraciones registradas.');
  return `
    <p class="hoja__entradilla">Transcripción de entrevistas. Compara cada declaración con el resto del expediente.</p>
    ${datos.declaraciones.map((d, i) => {
      const { persona, texto } = partirDeclaracion(d.contenido);
      return `
        <article class="declaracion" data-clave="${claveDe(d)}">
          <header class="declaracion__cabecera">Declaración Nº ${numero2(i + 1)}</header>
          <dl class="ficha-datos declaracion__datos">
            <dt>Persona</dt><dd>${escapar(persona || 'NO CONSTA')}</dd>
            <dt>Fecha</dt><dd>${fecha(d.fecha)}</dd>
            <dt>Hora</dt><dd>${hora(d.fecha)}</dd>
            ${d.credibilidad ? `<dt>Valoración</dt><dd>${escapar(d.credibilidad)}</dd>` : ''}
          </dl>
          <blockquote class="declaracion__texto">«${escapar(texto)}»</blockquote>
          <div class="declaracion__pie">
            <button type="button" class="boton-tinta boton-tinta--suave" data-comparar="${i}">Comparar ⇄</button>
            ${botonTablero(claveDe(d))}
            <span data-sellos>${selloContradicciones(cuantas(exp, d))}</span>
          </div>
        </article>`;
    }).join('')}`;
}

export function montar(hoja, contexto) {
  hoja.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-comparar]');
    if (boton) comparar(contexto, Number(boton.dataset.comparar), hoja);
  });
}

function opciones(registros, propia) {
  const grupos = new Map();
  registros.filter((r) => r.clave !== propia).forEach((r) => {
    if (!grupos.has(r.grupo)) grupos.set(r.grupo, []);
    grupos.get(r.grupo).push(r);
  });
  return [...grupos.entries()].map(([grupo, lista]) => `
    <optgroup label="${escapar(grupo)}">
      ${lista.map((r) => `<option value="${r.clave}">${escapar(r.etiqueta)}</option>`).join('')}
    </optgroup>`).join('');
}

function comparar({ exp, datos }, i, hoja) {
  const d = datos.declaraciones[i];
  const { persona, texto } = partirDeclaracion(d.contenido);
  const registros = registrosComparables(datos);
  const propia = claveDe(d);

  const raiz = abrirVisor(`
    <header class="visor__encabezado">
      <span>Archivo 47 · Expediente Nº ${exp.numero}</span><span>Comparación</span>
    </header>
    <h2 class="visor__titulo">Comparar declaración</h2>
    <div class="comparacion">
      <article class="comparacion__lado">
        <p class="visor__rotulo">Declaración Nº ${numero2(i + 1)} · ${escapar(persona || 'persona no consta')}</p>
        <p class="comparacion__fecha">${fecha(d.fecha)} · ${hora(d.fecha)}</p>
        <blockquote class="declaracion__texto">«${escapar(texto)}»</blockquote>
      </article>
      <article class="comparacion__lado">
        <label class="visor__rotulo" for="compararCon">Comparar con</label>
        <select id="compararCon" class="comparacion__selector" data-otro>
          <option value="">Elige un registro del expediente…</option>
          ${opciones(registros, propia)}
        </select>
        <div class="comparacion__registro" data-registro aria-live="polite">
          <p class="nota-mano">Busca algo que confirme… o que no encaje.</p>
        </div>
      </article>
    </div>
    <div class="visor__acciones">
      <button type="button" class="boton-tinta boton-tinta--rojo" data-contradiccion disabled>Señalar contradicción</button>
    </div>
    <div class="comparacion__sello" data-sello></div>`,
  { clase: 'visor--comparacion', etiqueta: 'Comparar declaración' });

  const selector = raiz.querySelector('[data-otro]');
  const boton = raiz.querySelector('[data-contradiccion]');
  const sello = raiz.querySelector('[data-sello]');
  const parActual = () => `${propia}|${selector.value}`;

  const pintarEstado = () => {
    const marcada = selector.value && contradicciones(exp).tiene(parActual());
    boton.disabled = !selector.value;
    boton.textContent = marcada ? 'Retirar contradicción' : 'Señalar contradicción';
    boton.setAttribute('aria-pressed', String(!!marcada));
    sello.innerHTML = marcada
      ? '<span class="sello sello--grande sello--estampar">Contradicción señalada</span>'
      : '';
  };

  selector.addEventListener('change', () => {
    const r = registros.find((x) => x.clave === selector.value);
    raiz.querySelector('[data-registro]').innerHTML = r ? `
      <p class="comparacion__titulo">${escapar(r.titulo)}</p>
      <p class="comparacion__texto">${r.documento ? textoDocumento(r.texto) : escapar(r.texto)}</p>` : '';
    reproducir('papel');
    pintarEstado();
  });

  boton.addEventListener('click', () => {
    const ahora = contradicciones(exp).alternar(parActual());
    pintarEstado();
    reproducir(ahora ? 'sello' : 'click');
    const tarjeta = hoja.querySelector(`.declaracion[data-clave="${propia}"] [data-sellos]`);
    if (tarjeta) tarjeta.innerHTML = selloContradicciones(cuantas(exp, d));
  });
}
