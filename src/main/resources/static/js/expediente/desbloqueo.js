// Animación de desbloqueo (concepto §30): candado que se abre, registro de
// acceso y "NUEVA EVIDENCIA AGREGADA". Resuelve 'ver' o 'seguir'.
import { escapar, formatearHora, movimientoReducido } from '../ui.js';
import { reproducir } from '../sound.js';
import { numero3 } from './comun.js';

export function mostrarDesbloqueo(evidencias) {
  return new Promise((resolver) => {
    const capa = document.createElement('dialog');
    capa.className = 'desbloqueo';
    capa.setAttribute('aria-label', 'Información desbloqueada');
    capa.innerHTML = `
      <div class="desbloqueo__candado" aria-hidden="true">
        <svg viewBox="0 0 60 72">
          <path class="desbloqueo__arco" d="M15 32V20a15 15 0 0 1 30 0v12" fill="none" stroke="#c9bfa8" stroke-width="6"/>
          <rect x="7" y="32" width="46" height="36" rx="4" fill="#8b1e1e"/>
          <circle cx="30" cy="47" r="5" fill="#1c1410"/><path d="M30 50v9" stroke="#1c1410" stroke-width="4"/>
        </svg>
      </div>
      <p class="desbloqueo__titulo">Información desbloqueada</p>
      <p class="desbloqueo__registro">Registro de acceso · ${formatearHora().slice(0, 5)}</p>
      <p class="desbloqueo__nueva">${evidencias.length === 1 ? 'Nueva evidencia agregada' : `${evidencias.length} nuevas evidencias agregadas`}</p>
      <ul class="desbloqueo__lista">
        ${evidencias.map((e) => `<li>#${numero3(e.idEvidencia)} · ${escapar(e.nombre)}</li>`).join('')}
      </ul>
      <div class="desbloqueo__acciones">
        <button type="button" class="boton-terminal" data-respuesta="seguir">Seguir aquí</button>
        <button type="button" class="boton-terminal" data-respuesta="ver">Ver evidencia →</button>
      </div>`;
    document.body.append(capa);

    let respuesta = 'seguir';
    capa.addEventListener('click', (e) => {
      const boton = e.target.closest('[data-respuesta]');
      if (!boton) return;
      respuesta = boton.dataset.respuesta;
      capa.close();
    });
    capa.addEventListener('close', () => {
      capa.remove();
      resolver(respuesta);
    });

    capa.showModal();
    capa.querySelector('[data-respuesta="ver"]').focus();
    reproducir('acceso');
    setTimeout(() => reproducir('sello'), movimientoReducido() ? 0 : 900);
  });
}
