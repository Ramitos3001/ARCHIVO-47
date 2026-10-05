// FASE 11 · Documentos: se abren, se amplían, se leen y se marcan
import { escapar } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { abrirVisor } from '../../components/visor.js';
import { botonTablero } from '../tablero.js';
import { vacio, numero2, fecha, hora, textoDocumento, marcas, porFecha } from '../comun.js';

const GIROS = [-1.5, 1, -.6, 1.8, -1.2];
const marcados = (exp) => marcas('documentos', exp.partida.idPartida);

const ordenados = (datos) => [...datos.documentos].sort(porFecha('fechaRegistro'));

export function render({ exp, datos }) {
  const documentos = ordenados(datos);
  if (!documentos.length) return vacio('No hay documentos en el expediente.');
  const marca = marcados(exp);
  return `
    <p class="hoja__entradilla">Informes, registros y escritos incorporados al expediente.</p>
    <div class="legajo">
      ${documentos.map((d, i) => `
        <button type="button" class="documento-mini${marca.tiene(d.idDocumento) ? ' documento-mini--marcado' : ''}"
                data-documento="${i}" style="--giro: ${GIROS[i % GIROS.length]}deg">
          <span class="documento-mini__numero">Documento Nº ${numero2(i + 1)}</span>
          <span class="documento-mini__titulo">${escapar(d.titulo)}</span>
          <span class="documento-mini__fecha">${fecha(d.fechaRegistro)} · ${hora(d.fechaRegistro)}</span>
          <span class="documento-mini__lineas" aria-hidden="true"></span>
          <span class="documento-mini__marca nota-mano" aria-hidden="true">¡importante!</span>
        </button>`).join('')}
    </div>`;
}

export function montar(hoja, contexto) {
  const documentos = ordenados(contexto.datos);
  hoja.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-documento]');
    if (boton) abrir(contexto, documentos, Number(boton.dataset.documento), hoja);
  });
}

function abrir({ exp }, documentos, i, hoja) {
  const d = documentos[i];
  const marca = marcados(exp);
  const raiz = abrirVisor(`
    <header class="visor__encabezado">
      <span>Archivo 47 · Expediente Nº ${exp.numero}</span><span>Documento Nº ${numero2(i + 1)}</span>
    </header>
    <h2 class="visor__titulo">${escapar(d.titulo)}</h2>
    <p class="visor__fecha">Registrado el ${fecha(d.fechaRegistro)} a las ${hora(d.fechaRegistro)}</p>
    <div class="documento__texto" data-texto>${textoDocumento(d.contenido)}</div>
    <div class="visor__acciones">
      <button type="button" class="boton-tinta boton-tinta--suave" data-ampliar aria-pressed="false">+ Ampliar texto</button>
      <button type="button" class="boton-tinta boton-tinta--rojo" data-marcar aria-pressed="${marca.tiene(d.idDocumento)}">
        ${marca.tiene(d.idDocumento) ? 'Quitar marca' : 'Marcar como importante'}
      </button>
      ${botonTablero(`d${d.idDocumento}`)}
    </div>`,
  { clase: 'visor--documento', etiqueta: d.titulo });

  raiz.querySelector('[data-ampliar]').addEventListener('click', (e) => {
    const ampliado = raiz.querySelector('[data-texto]').classList.toggle('documento__texto--ampliado');
    e.currentTarget.textContent = ampliado ? '− Reducir texto' : '+ Ampliar texto';
    e.currentTarget.setAttribute('aria-pressed', String(ampliado));
    reproducir('click');
  });
  raiz.querySelector('[data-marcar]').addEventListener('click', (e) => {
    const ahora = marcados(exp).alternar(d.idDocumento);
    e.currentTarget.textContent = ahora ? 'Quitar marca' : 'Marcar como importante';
    e.currentTarget.setAttribute('aria-pressed', String(ahora));
    hoja.querySelector(`[data-documento="${i}"]`)?.classList.toggle('documento-mini--marcado', ahora);
    reproducir(ahora ? 'sello' : 'click');
  });
}
