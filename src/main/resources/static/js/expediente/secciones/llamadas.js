// FASE 13 · Llamadas: registro impreso; al seleccionar una se despliega su detalle
import { escapar, escribir } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { vacio, fecha, hora, duracionLlamada, porFecha } from '../comun.js';
import { botonTablero } from '../tablero.js';

const ordenadas = (datos) => [...datos.llamadas].sort(porFecha('fecha'));

export function render({ datos }) {
  const llamadas = ordenadas(datos);
  if (!llamadas.length) return vacio('No hay llamadas registradas.');
  let dia = '';
  return `
    <p class="hoja__entradilla">Extracto de la compañía telefónica. Selecciona una llamada para ver su detalle.</p>
    <div class="registro-llamadas">
      <div class="registro-llamadas__cabecera" aria-hidden="true">
        <span>Hora</span><span>Origen → Destino</span><span>Duración</span>
      </div>
      ${llamadas.map((l) => {
        const separador = fecha(l.fecha) !== dia ? `<p class="registro-llamadas__fecha">${(dia = fecha(l.fecha))}</p>` : '';
        const duracion = duracionLlamada(l.duracion);
        return `${separador}
          <button type="button" class="llamada${duracion ? '' : ' llamada--perdida'}" data-llamada="${l.idLlamada}" aria-expanded="false">
            <span class="llamada__hora">${hora(l.fecha)}</span>
            <span class="llamada__partes">${escapar(l.origen)} → ${escapar(l.destino)}</span>
            <span class="llamada__duracion">${duracion || 'Perdida'}</span>
          </button>
          <div class="llamada__detalle" hidden>
            <span class="llamada__rotulo">${duracion ? 'Transcripción' : 'Sin conexión'}</span>
            <p data-transcripcion="${escapar(l.transcripcion || (duracion ? 'Llamada no grabada. Sin transcripción disponible.' : 'La llamada no fue atendida.'))}"></p>
            ${botonTablero(`l${l.idLlamada}`)}
          </div>`;
      }).join('')}
    </div>`;
}

export function montar(hoja) {
  hoja.addEventListener('click', (e) => {
    const fila = e.target.closest('[data-llamada]');
    if (!fila) return;
    const detalle = fila.nextElementSibling;
    const abrir = detalle.hidden;
    detalle.hidden = !abrir;
    fila.setAttribute('aria-expanded', String(abrir));
    reproducir('click');
    const p = detalle.querySelector('[data-transcripcion]');
    if (abrir && !p.textContent) escribir(p, p.dataset.transcripcion, { velocidad: 12 });
  });
}
