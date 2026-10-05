// FASE 12 · Mensajes: conversaciones recuperadas, con estilo de chat.
// Tocar un mensaje lo subraya (marca del investigador).
import { escapar } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { vacio, fecha, hora, marcas, porFecha } from '../comun.js';
import { botonTablero } from '../tablero.js';

// El titular del teléfono es quien más participa en las conversaciones
function titular(mensajes) {
  const cuenta = new Map();
  for (const m of mensajes) {
    for (const p of [m.remitente, m.destinatario]) cuenta.set(p, (cuenta.get(p) || 0) + 1);
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// Agrupa por pareja de personas, en orden de la primera aparición
function conversaciones(mensajes) {
  const grupos = new Map();
  for (const m of [...mensajes].sort(porFecha('fecha'))) {
    const clave = [m.remitente, m.destinatario].sort().join('|');
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(m);
  }
  return [...grupos.values()];
}

export function render({ exp, datos }) {
  if (!datos.mensajes.length) return vacio('No se recuperaron mensajes.');
  const dueno = titular(datos.mensajes);
  const subrayados = marcas('mensajes', exp.partida.idPartida);
  const chats = conversaciones(datos.mensajes);

  return `
    <p class="hoja__entradilla">
      ${datos.mensajes.length} mensajes recuperados en ${chats.length} ${chats.length === 1 ? 'conversación' : 'conversaciones'}.
      Toca un mensaje para subrayarlo.
    </p>
    <div class="telefono">
      <div class="telefono__pantalla">
        <p class="telefono__cabecera">Mensajes recuperados${dueno ? ` · ${escapar(dueno)}` : ''}</p>
        ${chats.map((chat) => {
          const otro = chat[0].remitente === dueno ? chat[0].destinatario : chat[0].remitente;
          let dia = '';
          return `
            <section class="chat">
              <h3 class="chat__contacto">${escapar(otro)}</h3>
              ${chat.map((m) => {
                const separador = fecha(m.fecha) !== dia ? `<p class="chat__dia">${(dia = fecha(m.fecha))}</p>` : '';
                const propio = m.remitente === dueno;
                return `${separador}
                  <div class="burbuja-fila burbuja-fila--${propio ? 'propia' : 'ajena'}">
                    <button type="button" class="burbuja ${propio ? 'burbuja--propia' : 'burbuja--ajena'}${subrayados.tiene(m.idMensaje) ? ' burbuja--marcada' : ''}"
                            data-mensaje="${m.idMensaje}" aria-pressed="${subrayados.tiene(m.idMensaje)}">
                      <span class="burbuja__autor">${escapar(m.remitente)}</span>
                      <span class="burbuja__texto">${escapar(m.contenido)}</span>
                      <span class="burbuja__hora">${hora(m.fecha)}</span>
                    </button>
                    ${botonTablero(`m${m.idMensaje}`, { compacto: true })}
                  </div>`;
              }).join('')}
            </section>`;
        }).join('')}
      </div>
    </div>`;
}

export function montar(hoja, { exp }) {
  hoja.addEventListener('click', (e) => {
    const burbuja = e.target.closest('[data-mensaje]');
    if (!burbuja) return;
    const ahora = marcas('mensajes', exp.partida.idPartida).alternar(burbuja.dataset.mensaje);
    burbuja.classList.toggle('burbuja--marcada', ahora);
    burbuja.setAttribute('aria-pressed', String(ahora));
    reproducir('click');
  });
}
