// FASE 8 · Sospechosos: fichas de investigación con sellos y relaciones
import { escapar } from '../../ui.js';
import { abrirVisor } from '../../components/visor.js';
import { retrato } from '../ilustraciones.js';
import { botonTablero } from '../tablero.js';
import {
  vacio, numero2, numero3, hora, recortar, relacionesDe, partirDeclaracion, duracionLlamada
} from '../comun.js';

const GIROS = [-2, 1.5, -1, 2.2, -1.6, .8];

export function render({ datos }) {
  if (!datos.sospechosos.length) return vacio('No hay sospechosos registrados en este expediente.');
  return `
    <p class="hoja__entradilla">Personas bajo investigación. Saca una ficha para consultarla.</p>
    <div class="fichero">
      ${datos.sospechosos.map((s, i) => `
        <button type="button" class="ficha-mini" data-sospechoso="${i}" style="--giro: ${GIROS[i % GIROS.length]}deg">
          <span class="ficha-mini__foto">${retrato(i)}</span>
          <span class="ficha-mini__numero">Ficha Nº ${numero2(i + 1)}</span>
          <span class="ficha-mini__nombre">${escapar(s.nombre)}</span>
          <span class="ficha-mini__relacion nota-mano">${escapar(s.relacionConCaso || 'relación sin anotar')}</span>
          <span class="sello sello--pequeno ficha-mini__sello">Sospechoso</span>
        </button>`).join('')}
    </div>`;
}

export function montar(hoja, contexto) {
  hoja.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-sospechoso]');
    if (boton) abrirFicha(contexto, Number(boton.dataset.sospechoso));
  });
}

function bloqueRelacion(titulo, elementos, pintar) {
  if (!elementos.length) return '';
  return `
    <div class="relaciones__grupo">
      <p class="relaciones__titulo">${titulo} <span>(${elementos.length})</span></p>
      <ul class="relaciones__lista">${elementos.map((x) => `<li>${pintar(x)}</li>`).join('')}</ul>
    </div>`;
}

function relacionesHTML(rel, datos) {
  const html = [
    bloqueRelacion('Mensajes', rel.mensajes, (m) =>
      `${hora(m.fecha)} · ${escapar(m.remitente)} → ${escapar(m.destinatario)}: «${escapar(recortar(m.contenido, 70))}»`),
    bloqueRelacion('Llamadas', rel.llamadas, (l) =>
      `${hora(l.fecha)} · ${escapar(l.origen)} → ${escapar(l.destino)} · ${duracionLlamada(l.duracion) || 'perdida'}`),
    bloqueRelacion('Declaraciones', rel.declaraciones, (d) => {
      const n = datos.declaraciones.indexOf(d) + 1;
      return `Declaración Nº ${numero2(n)} · ${escapar(partirDeclaracion(d.contenido).persona || 'persona no consta')}`;
    }),
    bloqueRelacion('Documentos', rel.documentos, (d) => escapar(d.titulo)),
    bloqueRelacion('Evidencias', rel.evidencias, (e) => `#${numero3(e.idEvidencia)} ${escapar(e.nombre)}`),
    bloqueRelacion('Ubicaciones', rel.ubicaciones, (u) => escapar(u.nombre))
  ].join('');
  return html || '<p class="visor__texto visor__texto--tenue">Sin relaciones registradas en el expediente.</p>';
}

function abrirFicha({ exp, datos }, i) {
  const s = datos.sospechosos[i];
  abrirVisor(`
    <header class="visor__encabezado">
      <span>Archivo 47 · Expediente Nº ${exp.numero}</span><span>Ficha Nº ${numero2(i + 1)}</span>
    </header>
    <span class="sello sello--confidencial sello--estampar visor__sello" style="--retardo: .3s">Confidencial</span>
    <h2 class="visor__titulo">Ficha de investigación</h2>
    <div class="ficha-sospechoso">
      <figure class="ficha-sospechoso__foto">
        <span class="clip ficha-sospechoso__clip"></span>
        ${retrato(i)}
      </figure>
      <dl class="ficha-datos">
        <dt>Nombre</dt><dd>${escapar(s.nombre)}</dd>
        <dt>Relación con el caso</dt><dd>${escapar(s.relacionConCaso || 'NO CONSTA')}</dd>
        <dt>Estado</dt><dd>SOSPECHOSO</dd>
      </dl>
    </div>
    <p class="visor__rotulo">Descripción</p>
    <p class="visor__texto">${escapar(s.descripcion || 'Sin descripción.')}</p>
    <p class="visor__rotulo">Observaciones</p>
    <p class="visor__texto">${escapar(s.perfil || 'Sin observaciones.')}</p>
    <p class="visor__rotulo">Relaciones en el expediente</p>
    <div class="relaciones">${relacionesHTML(relacionesDe(s, datos), datos)}</div>
    <div class="visor__acciones visor__acciones--pie">
      <span class="sello sello--abierto sello--estampar visor__sello-pie" style="--retardo: .6s">Bajo investigación</span>
      ${botonTablero(`s${s.idSospechoso}`)}
    </div>`,
  { clase: 'visor--ficha', etiqueta: `Ficha de ${s.nombre}` });
}
