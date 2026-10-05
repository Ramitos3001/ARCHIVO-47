// Hojas del expediente. Portada y ficha aquí; cada sección en secciones/
import { idInvestigador } from '../services/authService.js';
import { estadoDelCaso } from '../services/caseService.js';
import { escapar, escribir, formatearFecha } from '../ui.js';
import * as sospechosos from './secciones/sospechosos.js';
import * as evidencias from './secciones/evidencias.js';
import * as fotografias from './secciones/fotografias.js';
import * as documentos from './secciones/documentos.js';
import * as mensajes from './secciones/mensajes.js';
import * as llamadas from './secciones/llamadas.js';
import * as ubicaciones from './secciones/ubicaciones.js';
import * as declaraciones from './secciones/declaraciones.js';
import * as cronologia from './secciones/cronologia.js';
import * as pistas from './secciones/pistas.js';
import * as acertijos from './secciones/acertijos.js';
import * as tableroHoja from './secciones/tableroHoja.js';
import * as teoria from './secciones/teoria.js';

// ---------- Portada (concepto §11) ----------

function portada({ exp, datos }) {
  const { caso, partida, numero } = exp;
  const estado = estadoDelCaso(partida);
  const enCurso = partida.estado === 'EN_CURSO';
  return `
    <div class="portada">
      <p class="portada__marca">Archivo <b>47</b></p>
      <p class="portada__depto">Departamento de casos no resueltos</p>
      <p class="portada__numero">Expediente Nº ${numero}</p>
      <p class="portada__titulo">${escapar(caso.titulo)}</p>
      <dl class="ficha-datos portada__datos">
        <dt>Clasificación</dt><dd>CONFIDENCIAL</dd>
        <dt>Estado</dt><dd>${escapar(estado.toUpperCase())}</dd>
        <dt>Acceso</dt><dd>INVESTIGADOR AUTORIZADO</dd>
        <dt>Dificultad</dt><dd>${escapar(caso.dificultad)}</dd>
        <dt>Fecha de apertura</dt><dd>${formatearFecha(partida.fechaInicio)}</dd>
        <dt>Evidencias</dt><dd>${datos.evidencias.length}</dd>
        <dt>Sospechosos</dt><dd>${datos.sospechosos.length}</dd>
      </dl>
      <span class="sello sello--confidencial sello--grande sello--espera portada__sello-confidencial" data-sello-apertura>Confidencial</span>
      <span class="sello ${enCurso ? 'sello--abierto' : 'sello--tinta'} sello--espera portada__sello-estado" data-sello-apertura style="--retardo: .55s">${escapar(estado)}</span>
      <div class="portada__pie">
        <p>Documento reservado. Prohibida su reproducción fuera de la central.</p>
        <button type="button" class="boton-tinta boton-tinta--suave" data-accion="intro">▸ Revisar informe inicial</button>
      </div>
    </div>`;
}

// ---------- Ficha del caso (concepto §14) ----------

function ficha({ exp, datos, usuario }) {
  const { caso, partida, numero } = exp;
  const primerHecho = datos.lineaTiempo[0];
  const lugar = datos.ubicaciones[0];
  const nombres = datos.sospechosos.map((s) => escapar(s.nombre)).join(', ');
  return `
    <span class="clip ficha-caso__clip" aria-hidden="true"></span>
    <h2 class="hoja__titulo">Ficha del caso</h2>
    <dl class="ficha-datos ficha-caso__datos">
      <dt>Expediente Nº</dt><dd>${numero}</dd>
      <dt>Título</dt><dd>${escapar(caso.titulo)}</dd>
      <dt>Fecha</dt><dd>${primerHecho ? formatearFecha(primerHecho.fecha) : 'NO CONSTA'}</dd>
      <dt>Ubicación</dt><dd>${lugar ? `${escapar(lugar.nombre)} — ${escapar(lugar.direccion)}` : 'NO CONSTA'}</dd>
      <dt>Dificultad</dt><dd>${escapar(caso.dificultad)}</dd>
      <dt>Estado</dt><dd>${escapar(estadoDelCaso(partida).toUpperCase())}</dd>
      <dt>Investigador asignado</dt><dd>${idInvestigador(usuario.idUsuario)} · ${escapar(usuario.nombre)}</dd>
      <dt>Evidencias disponibles</dt><dd>${datos.evidencias.length}</dd>
      <dt>Sospechosos</dt><dd>${datos.sospechosos.length}${nombres ? ` — ${nombres}` : ''}</dd>
    </dl>
    <p class="ficha-caso__rotulo">Descripción de los hechos</p>
    <p class="ficha-caso__hechos" data-hechos data-texto="${escapar(caso.descripcion)}"></p>
    <p class="nota-mano ficha-caso__nota" aria-hidden="true">Leer todo. Dos veces.</p>
    <span class="sello sello--pequeno ficha-caso__sello">Confidencial</span>`;
}

// La descripción se mecanografía la primera vez que se ve la hoja
function escribirHechos(hoja) {
  const parrafo = hoja.querySelector('[data-hechos]');
  if (parrafo.dataset.escrito) return;
  parrafo.dataset.escrito = 'si';
  escribir(parrafo, parrafo.dataset.texto, { velocidad: 12 });
}

// ---------- Orden de las hojas del expediente (concepto §13) ----------
// Cada sección: render(contexto) → HTML de la hoja; montar(hoja, contexto) → eventos

const conTitulo = (titulo, render) => (contexto) =>
  `<h2 class="hoja__titulo">${titulo}</h2>${render(contexto)}`;

const seccion = (id, pestana, titulo, modulo) =>
  ({ id, pestana, titulo, render: conTitulo(titulo, modulo.render), montar: modulo.montar });

export const SECCIONES = [
  { id: 'portada', pestana: 'Portada', titulo: 'Portada', render: portada },
  { id: 'ficha', pestana: 'Ficha', titulo: 'Ficha del caso', render: ficha, alMostrar: escribirHechos },
  seccion('sospechosos', 'Sospechosos', 'Sospechosos', sospechosos),
  seccion('evidencias', 'Evidencias', 'Evidencias', evidencias),
  seccion('fotografias', 'Fotografías', 'Fotografías', fotografias),
  seccion('documentos', 'Documentos', 'Documentos', documentos),
  seccion('mensajes', 'Mensajes', 'Mensajes recuperados', mensajes),
  seccion('llamadas', 'Llamadas', 'Registro de llamadas', llamadas),
  seccion('ubicaciones', 'Ubicaciones', 'Ubicaciones', ubicaciones),
  seccion('declaraciones', 'Declaraciones', 'Declaraciones', declaraciones),
  seccion('linea-tiempo', 'Cronología', 'Línea temporal', cronologia),
  seccion('pistas', 'Pistas', 'Pistas', pistas),
  seccion('acertijos', 'Acertijos', 'Acertijos', acertijos),
  seccion('tablero', 'Tablero', 'Tablero de investigación', tableroHoja),
  seccion('teoria', 'Teoría', 'Teoría del caso', teoria)
];

export const folio = (indice) => String(indice + 1).padStart(2, '0');

// (Re)pinta el contenido de una hoja. Se sustituye el contenedor entero para
// que los eventos de la versión anterior no se acumulen.
export function rellenarHoja(hoja, seccion, indice, contexto) {
  const encabezado = seccion.id === 'portada' ? '' : `
    <header class="hoja__encabezado">
      <span>Archivo 47 · Expediente Nº ${contexto.exp.numero}</span>
      <span>Folio ${folio(indice)}</span>
    </header>`;
  const contenido = document.createElement('div');
  contenido.className = 'hoja__contenido';
  contenido.innerHTML = `${encabezado}${seccion.render({ ...contexto, seccion })}`;
  hoja.querySelector('.hoja__contenido').replaceWith(contenido);
  seccion.montar?.(contenido, { ...contexto, seccion });
}

export function construirHoja(seccion, indice, total, contexto) {
  const hoja = document.createElement('section');
  hoja.className = `hoja hoja--${seccion.id}`;
  hoja.dataset.seccion = seccion.id;
  hoja.setAttribute('aria-label', seccion.titulo);
  hoja.innerHTML = `
    <div class="hoja__frente papel">
      <div class="hoja__contenido"></div>
      ${indice < total - 1
        ? '<button type="button" class="hoja__esquina hoja__esquina--siguiente" data-hojear="siguiente" aria-label="Pasar página"></button>'
        : ''}
    </div>
    <div class="hoja__dorso papel" aria-hidden="true">
      <span class="hoja__marca">Archivo 47</span>
      <span class="hoja__folio-dorso">Folio ${folio(indice)} · reverso</span>
      <button type="button" class="hoja__esquina hoja__esquina--anterior" data-hojear="anterior" tabindex="-1" aria-label="Página anterior"></button>
    </div>`;
  rellenarHoja(hoja, seccion, indice, contexto);
  return hoja;
}
