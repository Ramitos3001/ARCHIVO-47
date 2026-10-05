// FASE 16 · Línea temporal interactiva: hechos, mensajes y llamadas en un
// mismo eje para comparar horarios. Regla superior para saltar a una hora.
import { escapar } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { vacio, fecha, hora, duracionLlamada } from '../comun.js';
import { botonTablero } from '../tablero.js';

const TIPOS = {
  hecho: 'Hecho',
  mensaje: 'Mensaje',
  llamada: 'Llamada'
};

function eventos(datos) {
  const lista = [
    ...datos.lineaTiempo.map((a) => ({ tipo: 'hecho', clave: `a${a.idAcontecimiento}`, fecha: a.fecha, titulo: a.titulo, detalle: a.descripcion })),
    ...datos.mensajes.map((m) => ({
      tipo: 'mensaje', clave: `m${m.idMensaje}`, fecha: m.fecha,
      titulo: `${m.remitente} → ${m.destinatario}`,
      detalle: `«${m.contenido}»`
    })),
    ...datos.llamadas.map((l) => ({
      tipo: 'llamada', clave: `l${l.idLlamada}`, fecha: l.fecha,
      titulo: `${l.origen} → ${l.destino} · ${duracionLlamada(l.duracion) || 'perdida'}`,
      detalle: l.transcripcion || (l.duracion ? 'Sin transcripción.' : 'La llamada no fue atendida.')
    }))
  ];
  return lista
    .map((e) => ({ ...e, ms: new Date(e.fecha).getTime() }))
    .filter((e) => !Number.isNaN(e.ms))
    .sort((a, b) => a.ms - b.ms);
}

export function render({ datos }) {
  const lista = eventos(datos);
  if (!lista.length) return vacio('No hay acontecimientos con hora registrada.');

  const inicio = lista[0].ms;
  const fin = lista[lista.length - 1].ms;
  const posicion = (ms) => (fin === inicio ? 50 : ((ms - inicio) / (fin - inicio)) * 100);
  const cuenta = (tipo) => lista.filter((e) => e.tipo === tipo).length;
  let dia = '';

  return `
    <p class="hoja__entradilla">Ordena los hechos en el tiempo. Filtra por tipo o toca una marca de la regla.</p>
    <div class="cronologia__filtros" role="group" aria-label="Mostrar en la línea temporal">
      ${Object.entries(TIPOS).filter(([tipo]) => cuenta(tipo)).map(([tipo, nombre]) => `
        <button type="button" class="filtro filtro--${tipo}" data-filtro="${tipo}" aria-pressed="true">
          ${nombre}s <span>${cuenta(tipo)}</span>
        </button>`).join('')}
    </div>
    <div class="regla">
      <span class="regla__linea" aria-hidden="true"></span>
      ${lista.map((e, i) => `
        <button type="button" class="regla__marca regla__marca--${e.tipo}" style="left: ${posicion(e.ms)}%"
                data-ir="${i}" data-tipo="${e.tipo}" title="${hora(e.fecha)} · ${escapar(e.titulo)}"
                aria-label="${hora(e.fecha)}, ${TIPOS[e.tipo]}: ${escapar(e.titulo)}"></button>`).join('')}
      <span class="regla__extremo regla__extremo--inicio">${hora(lista[0].fecha)}</span>
      <span class="regla__extremo regla__extremo--fin">${hora(lista[lista.length - 1].fecha)}</span>
    </div>
    <ol class="cronologia">
      ${lista.map((e, i) => {
        const separador = fecha(e.fecha) !== dia ? `<li class="cronologia__dia">${(dia = fecha(e.fecha))}</li>` : '';
        return `${separador}
          <li class="evento evento--${e.tipo}" data-evento="${i}" data-tipo="${e.tipo}">
            <button type="button" class="evento__cabecera" aria-expanded="false">
              <span class="evento__hora">${hora(e.fecha)}</span>
              <span class="evento__tipo">${TIPOS[e.tipo]}</span>
              <span class="evento__titulo">${escapar(e.titulo)}</span>
            </button>
            <div class="evento__detalle" hidden><p>${escapar(e.detalle)}</p>${botonTablero(e.clave)}</div>
          </li>`;
      }).join('')}
    </ol>`;
}

function desplegar(evento, abrir) {
  const cabecera = evento.querySelector('.evento__cabecera');
  evento.querySelector('.evento__detalle').hidden = !abrir;
  cabecera.setAttribute('aria-expanded', String(abrir));
}

export function montar(hoja) {
  hoja.addEventListener('click', (e) => {
    const filtro = e.target.closest('[data-filtro]');
    if (filtro) {
      const visible = filtro.getAttribute('aria-pressed') !== 'true';
      filtro.setAttribute('aria-pressed', String(visible));
      hoja.querySelectorAll(`[data-tipo="${filtro.dataset.filtro}"]`).forEach((el) => { el.hidden = !visible; });
      reproducir('click');
      return;
    }

    const marca = e.target.closest('[data-ir]');
    if (marca) {
      const evento = hoja.querySelector(`[data-evento="${marca.dataset.ir}"]`);
      desplegar(evento, true);
      evento.scrollIntoView({ block: 'center', behavior: 'smooth' });
      evento.classList.remove('evento--resaltado');
      void evento.offsetWidth;
      evento.classList.add('evento--resaltado');
      reproducir('papel');
      return;
    }

    const cabecera = e.target.closest('.evento__cabecera');
    if (cabecera) {
      desplegar(cabecera.parentElement, cabecera.getAttribute('aria-expanded') !== 'true');
      reproducir('click');
    }
  });
}
