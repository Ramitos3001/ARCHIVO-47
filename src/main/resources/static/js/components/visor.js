// Visor: un documento que se saca del expediente y se pone sobre la mesa
// para leerlo, ampliarlo o examinarlo. Un único <dialog> reutilizable.
import { reproducir } from '../sound.js';

let dialogo = null;

function crear() {
  const d = document.createElement('dialog');
  d.className = 'visor';
  d.innerHTML = `
    <div class="visor__hoja papel papel--manchado">
      <button type="button" class="visor__cerrar" data-cerrar>Devolver al expediente ✕</button>
      <div class="visor__contenido"></div>
    </div>`;
  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-cerrar]')) d.close();
  });
  d.addEventListener('close', () => reproducir('papel'));
  document.body.append(d);
  return d;
}

// Muestra `html` y devuelve el contenedor para conectar sus eventos
export function abrirVisor(html, { clase = '', etiqueta = 'Documento' } = {}) {
  dialogo ??= crear();
  const hoja = dialogo.querySelector('.visor__hoja');
  hoja.className = `visor__hoja papel papel--manchado ${clase}`;
  dialogo.setAttribute('aria-label', etiqueta);
  const contenido = dialogo.querySelector('.visor__contenido');
  contenido.innerHTML = html;
  if (!dialogo.open) dialogo.showModal();
  hoja.scrollTop = 0;
  // Reinicia la animación de "sacar la hoja"
  hoja.classList.remove('visor__hoja--entrando');
  void hoja.offsetWidth;
  hoja.classList.add('visor__hoja--entrando');
  reproducir('papel');
  return contenido;
}

export const cerrarVisor = () => { if (dialogo?.open) dialogo.close(); };

// Lupa: clic (o el botón [data-lupa]) amplía la imagen hacia donde apunta el cursor
export function activarLupa(raiz) {
  const marco = raiz.querySelector('.lupa');
  const boton = raiz.querySelector('[data-lupa]');
  if (!marco) return;

  const alternar = () => {
    const activa = marco.classList.toggle('lupa--activa');
    if (boton) {
      boton.textContent = activa ? '− Reducir' : '+ Ampliar';
      boton.setAttribute('aria-pressed', String(activa));
    }
    reproducir('click');
  };
  const apuntar = (e) => {
    const r = marco.getBoundingClientRect();
    marco.style.setProperty('--ox', `${((e.clientX - r.left) / r.width) * 100}%`);
    marco.style.setProperty('--oy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  marco.addEventListener('click', (e) => { apuntar(e); alternar(); });
  marco.addEventListener('pointermove', apuntar);
  boton?.addEventListener('click', alternar);
}
