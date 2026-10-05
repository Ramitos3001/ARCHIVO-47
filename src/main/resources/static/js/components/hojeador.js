// Sistema reutilizable de pasar páginas con CSS 3D (estilos en css/hojeador.css).
//
// Estructura esperada dentro del contenedor:
//   <section class="hoja">
//     <div class="hoja__frente">…</div>
//     <div class="hoja__dorso">…</div>
//   </section>
// Las hojas ya pasadas quedan giradas -180° sobre el borde izquierdo (la pila
// de la izquierda); la hoja actual es la primera sin girar. Cualquier elemento
// con data-hojear="siguiente|anterior" dentro del contenedor pasa la página.
import { reproducir } from '../sound.js';
import { movimientoReducido } from '../ui.js';

const DURACION = 820;
const DURACION_RAPIDA = 380; // al saltar varias hojas con un separador

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

const esCampoDeTexto = (el) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export class Hojeador {
  constructor(contenedor, { alCambiar = () => {} } = {}) {
    this.contenedor = contenedor;
    this.alCambiar = alCambiar;
    this.hojas = [...contenedor.querySelectorAll(':scope > .hoja')];
    this.actual = 0;
    this.ocupado = false;
    this.habilitado = false;
    this.giros = 0;

    contenedor.classList.add('hojeador');
    this.ordenar();
    this.escucharClics();
    this.escucharGestos();
    this.escucharTeclado();
  }

  get total() {
    return this.hojas.length;
  }

  get hojaActual() {
    return this.hojas[this.actual];
  }

  habilitar(estado = true) {
    this.habilitado = estado;
  }

  siguiente() {
    return this.irA(this.actual + 1);
  }

  anterior() {
    return this.irA(this.actual - 1);
  }

  async irA(destino) {
    destino = Math.max(0, Math.min(this.total - 1, destino));
    if (!this.habilitado || this.ocupado || destino === this.actual) return;
    this.ocupado = true;

    const varias = Math.abs(destino - this.actual) > 1;
    const duracion = movimientoReducido() ? 0 : varias ? DURACION_RAPIDA : DURACION;
    this.contenedor.style.setProperty('--duracion-giro', `${duracion}ms`);

    // Al saltar varias hojas, cada giro empieza antes de que termine el anterior
    while (this.actual !== destino) {
      const adelante = destino > this.actual;
      const hoja = this.hojas[adelante ? this.actual : this.actual - 1];
      this.actual += adelante ? 1 : -1;
      this.voltear(hoja, adelante, duracion);
      if (this.actual !== destino) await pausa(duracion * 0.4);
    }
    await pausa(duracion);

    this.ordenar();
    this.ocupado = false;
    this.alCambiar(this.actual, this.hojaActual);
  }

  // Inserta una hoja nueva (p. ej. información desbloqueada) sin perder la página actual
  agregarHoja(hoja, posicion = this.total) {
    const referencia = this.hojas[posicion] || null;
    this.contenedor.insertBefore(hoja, referencia);
    this.hojas.splice(posicion, 0, hoja);
    if (posicion < this.actual) this.actual++;
    this.ordenar();
  }

  voltear(hoja, adelante, duracion) {
    // La hoja que se mueve pasa por encima de ambas pilas
    hoja.style.zIndex = String(this.total * 3 + ++this.giros);
    hoja.classList.add('hoja--girando');
    hoja.classList.toggle('hoja--volteada', adelante);
    reproducir('papel');
    setTimeout(() => {
      hoja.classList.remove('hoja--girando');
      this.ordenar();
    }, duracion);
  }

  // Pila derecha: la actual arriba. Pila izquierda: la última pasada arriba.
  ordenar() {
    const n = this.total;
    this.hojas.forEach((hoja, i) => {
      const volteada = i < this.actual;
      if (!hoja.classList.contains('hoja--girando')) {
        hoja.classList.toggle('hoja--volteada', volteada);
        hoja.style.zIndex = String(volteada ? n + i : n - i);
      }
      hoja.setAttribute('aria-hidden', String(i !== this.actual));
      // La anterior sigue activa para poder tocar su esquina en el reverso
      hoja.inert = i !== this.actual && i !== this.actual - 1;
    });
  }

  escucharClics() {
    this.contenedor.addEventListener('click', (e) => {
      const control = e.target.closest('[data-hojear]');
      if (!control || !this.contenedor.contains(control)) return;
      if (control.dataset.hojear === 'siguiente') this.siguiente();
      else this.anterior();
    });
  }

  // Deslizar con el dedo en pantallas táctiles
  escucharGestos() {
    let inicio = null;
    this.contenedor.addEventListener('pointerdown', (e) => {
      inicio = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY };
    });
    this.contenedor.addEventListener('pointerup', (e) => {
      if (!inicio) return;
      const dx = e.clientX - inicio.x;
      const dy = e.clientY - inicio.y;
      inicio = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) this.siguiente();
        else this.anterior();
      }
    });
  }

  escucharTeclado() {
    document.addEventListener('keydown', (e) => {
      if (!this.habilitado || e.altKey || e.ctrlKey || e.metaKey) return;
      if (esCampoDeTexto(e.target) || document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        this.siguiente();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.anterior();
      }
    });
  }
}
