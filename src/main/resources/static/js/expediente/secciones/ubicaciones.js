// FASE 14 · Ubicaciones: plano con chinchetas numeradas y ficha del lugar
import { escapar } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { escenaDe } from '../ilustraciones.js';
import { vacio, numero2, personasEn } from '../comun.js';
import { botonTablero } from '../tablero.js';

// Posiciones en el plano (% del ancho y alto); el plano es ilustrativo, no a escala
const PUNTOS = [[26, 34], [70, 26], [52, 64], [18, 74], [80, 70], [42, 18], [88, 44], [10, 46]];

const PLANO = `
  <svg viewBox="0 0 300 200" class="plano__dibujo" aria-hidden="true" preserveAspectRatio="none">
    <rect width="300" height="200" fill="#e4d8bb"/>
    <path d="M-10 150 C 60 120, 120 190, 200 150 S 290 120, 320 140" fill="none" stroke="#a9b6b0" stroke-width="12" opacity=".7"/>
    <g stroke="#c4b48f" stroke-width="7" fill="none">
      <path d="M0 60h300M0 110h300M60 0v200M150 0v200M235 0v200"/>
      <path d="M0 0l300 200" stroke-width="9"/>
    </g>
    <g stroke="#f1e9d6" stroke-width="1.2" stroke-dasharray="5 4" fill="none">
      <path d="M0 60h300M0 110h300M60 0v200M150 0v200M235 0v200M0 0l300 200"/>
    </g>
    <g fill="#d3c4a0" opacity=".8">
      <rect x="72" y="70" width="64" height="28"/><rect x="162" y="12" width="60" height="38"/>
      <rect x="12" y="120" width="36" height="22"/><rect x="246" y="120" width="44" height="60"/>
      <rect x="162" y="70" width="60" height="30"/><rect x="72" y="125" width="60" height="18"/>
    </g>
    <text x="292" y="194" text-anchor="end" font-family="monospace" font-size="7" fill="#8a7a5a">PLANO ESQUEMÁTICO · SIN ESCALA</text>
    <path d="M276 18l6 14-6-4-6 4z" fill="#5a4a32"/><text x="276" y="14" text-anchor="middle" font-family="monospace" font-size="7" fill="#5a4a32">N</text>
  </svg>`;

export function render({ datos }) {
  if (!datos.ubicaciones.length) return vacio('No hay ubicaciones registradas.');
  return `
    <p class="hoja__entradilla">Lugares del caso. Compara cada lugar con las horas de la cronología.</p>
    <div class="plano">
      ${PLANO}
      ${datos.ubicaciones.map((u, i) => {
        const [x, y] = PUNTOS[i % PUNTOS.length];
        return `<button type="button" class="plano__chincheta" style="left: ${x}%; top: ${y}%" data-ubicacion="${i}"
                        aria-label="Lugar ${i + 1}: ${escapar(u.nombre)}">${i + 1}</button>`;
      }).join('')}
    </div>
    <ol class="leyenda">
      ${datos.ubicaciones.map((u, i) => `
        <li><button type="button" class="leyenda__lugar" data-ubicacion="${i}">
          <span class="leyenda__numero">${i + 1}</span>${escapar(u.nombre)}
        </button></li>`).join('')}
    </ol>
    <div class="lugar" data-lugar aria-live="polite"></div>`;
}

export function montar(hoja, { datos }) {
  hoja.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-ubicacion]');
    if (!boton) return;
    const i = Number(boton.dataset.ubicacion);
    const u = datos.ubicaciones[i];
    hoja.querySelectorAll('[data-ubicacion]').forEach((b) => {
      b.classList.toggle('activo', Number(b.dataset.ubicacion) === i);
    });
    const personas = personasEn(`${u.nombre} ${u.descripcion}`, datos.sospechosos);
    const lugar = hoja.querySelector('[data-lugar]');
    lugar.innerHTML = `
      <div class="lugar__foto">${escenaDe(u)}</div>
      <div class="lugar__datos">
        <p class="lugar__numero">Lugar Nº ${numero2(i + 1)}</p>
        <h3 class="lugar__nombre">${escapar(u.nombre)}</h3>
        <p class="lugar__direccion">${escapar(u.direccion)}</p>
        <p class="lugar__descripcion">${escapar(u.descripcion || 'Sin descripción.')}</p>
        ${personas.length ? `<p class="lugar__personas">Personas: ${personas.map((p) => escapar(p.nombre)).join(', ')}</p>` : ''}
        ${botonTablero(`u${u.idUbicacion}`)}
      </div>`;
    lugar.classList.remove('lugar--visible');
    void lugar.offsetWidth;
    lugar.classList.add('lugar--visible');
    lugar.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    reproducir('papel');
  });
}
