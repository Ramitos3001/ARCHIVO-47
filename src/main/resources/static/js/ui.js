// Utilidades de interfaz compartidas por todas las pantallas
import { reproducir } from './sound.js';

export const movimientoReducido = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Al volver con "Atrás" el navegador puede restaurar la página tal como quedó
// (pantalla apagada o fundida a negro): se recarga para empezar limpia.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) location.reload();
});

export const esperar = (ms) =>
  new Promise((resolver) => setTimeout(resolver, movimientoReducido() ? 0 : ms));

// Escribe texto letra a letra, como una terminal o máquina de escribir.
// `saltar` permite terminar de golpe (p. ej. si el jugador pulsa una tecla).
export async function escribir(elemento, texto, { velocidad = 26, sonido = true, saltar = () => false } = {}) {
  if (movimientoReducido() || saltar()) {
    elemento.textContent = texto;
    return;
  }
  elemento.textContent = '';
  let i = 0;
  for (const letra of texto) {
    if (saltar()) {
      elemento.textContent = texto;
      return;
    }
    elemento.textContent += letra;
    if (sonido && letra.trim() && i++ % 2 === 0) reproducir('tecla');
    await esperar(velocidad + Math.random() * velocidad * 0.6);
  }
}

// Sale de la pantalla y navega. 'apagar' = monitor de tubo, 'fundido' = se apaga la lámpara
export function salirHacia(url, efecto = 'apagar') {
  if (movimientoReducido()) {
    location.href = url;
    return;
  }
  document.body.classList.add(efecto === 'fundido' ? 'pantalla-fundiendose' : 'pantalla-apagandose');
  setTimeout(() => { location.href = url; }, efecto === 'fundido' ? 520 : 620);
}

// Tira de papel con un mensaje breve
export function avisar(texto, tipo = '') {
  const aviso = document.createElement('div');
  aviso.className = 'aviso' + (tipo ? ` aviso--${tipo}` : '');
  aviso.setAttribute('role', tipo === 'alerta' ? 'alert' : 'status');
  aviso.textContent = texto;
  document.body.append(aviso);
  reproducir('papel');
  setTimeout(() => aviso.classList.add('aviso--sale'), 3800);
  setTimeout(() => aviso.remove(), 4300);
}

// Reinicia una animación CSS de una clase (temblor, estampar...)
export function animar(elemento, clase) {
  elemento.classList.remove(clase);
  void elemento.offsetWidth;
  elemento.classList.add(clase);
}

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapar = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);

// Fechas LocalDateTime del backend ("2026-10-02T14:20:11")
export function formatearFecha(iso) {
  if (!iso) return '—';
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return '—';
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(f.getDate())}.${dos(f.getMonth() + 1)}.${f.getFullYear()}`;
}

export function formatearHora(fecha = new Date()) {
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:${dos(fecha.getSeconds())}`;
}

export function duracionInvestigacion(inicio, fin) {
  if (!inicio || !fin) return '—';
  const minutos = Math.max(0, Math.round((new Date(fin) - new Date(inicio)) / 60000));
  if (minutos < 60) return `${minutos} MIN`;
  const horas = Math.floor(minutos / 60);
  if (horas < 48) return `${horas} H ${minutos % 60} MIN`;
  return `${Math.floor(horas / 24)} DÍAS`;
}
