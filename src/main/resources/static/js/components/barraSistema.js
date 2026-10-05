// Barra mínima: marca, título de la pantalla, volver (opcional), sonido y cierre de sesión
import { logout } from '../services/authService.js';
import { alternarSonido, sonidoActivo, reproducir } from '../sound.js';
import { escapar, salirHacia } from '../ui.js';

export function montarBarra(contenedor, { titulo, volver = null }) {
  contenedor.classList.add('barra-sistema');
  contenedor.setAttribute('aria-label', 'Sistema');
  contenedor.innerHTML = `
    <span class="barra-sistema__marca">ARCHIVO <b>47</b></span>
    <span class="barra-sistema__titulo">// ${escapar(titulo)}</span>
    <div class="barra-sistema__acciones">
      ${volver ? `<button type="button" class="barra-sistema__boton" data-accion="volver">← ${escapar(volver.texto)}</button>` : ''}
      <button type="button" class="barra-sistema__boton" data-accion="sonido"></button>
      <button type="button" class="barra-sistema__boton" data-accion="salir">Cerrar sesión</button>
    </div>`;

  const botonSonido = contenedor.querySelector('[data-accion="sonido"]');
  const pintarSonido = () => {
    const on = sonidoActivo();
    botonSonido.textContent = on ? 'Sonido: ON' : 'Sonido: OFF';
    botonSonido.setAttribute('aria-pressed', String(on));
  };
  pintarSonido();

  botonSonido.addEventListener('click', () => {
    alternarSonido();
    pintarSonido();
  });

  contenedor.querySelector('[data-accion="volver"]')?.addEventListener('click', () => {
    reproducir('click');
    salirHacia(volver.url, 'fundido');
  });

  contenedor.querySelector('[data-accion="salir"]').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    reproducir('click');
    await logout();
    salirHacia('acceso.html');
  });
}
