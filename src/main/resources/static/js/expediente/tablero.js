// FASE 19 · Tablero de investigación: pared de corcho con fotos, papeles y
// notas que se mueven, e hilos rojos que los conectan.
// Se guarda en este navegador (localStorage a47.tablero.<idPartida>).
import { escapar, animar, movimientoReducido } from '../ui.js';
import { reproducir } from '../sound.js';
import { retrato, ilustracionEvidencia, escenaDe } from './ilustraciones.js';
import { numero2, numero3, hora, recortar, partirDeclaracion, duracionLlamada } from './comun.js';

let contexto = null;
let claveAlmacen = '';
let estado = { elementos: [], conexiones: [] };

let dialogo = null;
let pared = null;
let botonMesa = null;
let modoConectar = false;
let origen = null;
let zSiguiente = 10;

// ---------- Estado ----------

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(claveAlmacen) || 'null');
    if (guardado?.elementos && guardado?.conexiones) estado = guardado;
  } catch { /* tablero vacío */ }
}

function guardar() {
  try { localStorage.setItem(claveAlmacen, JSON.stringify(estado)); } catch { /* sin almacenamiento */ }
}

export const enTablero = (clave) => estado.elementos.some((e) => e.clave === clave);
export const resumenTablero = () => ({ elementos: estado.elementos.length, conexiones: estado.conexiones.length });

// ---------- Botón "Añadir al tablero" (lo usan todas las hojas) ----------

const textoBoton = (dentro) => (dentro ? '✓ En el tablero' : '+ Añadir al tablero');

export function botonTablero(clave, { compacto = false } = {}) {
  const dentro = enTablero(clave);
  return `<button type="button" class="boton-tablero${compacto ? ' boton-tablero--compacto' : ''}" data-tablero="${clave}"
            aria-pressed="${dentro}" title="${dentro ? 'Quitar del tablero' : 'Añadir al tablero'}">${compacto ? (dentro ? '✓' : '+') + ' Tablero' : textoBoton(dentro)}</button>`;
}

function sincronizarBotones(clave) {
  const dentro = enTablero(clave);
  document.querySelectorAll(`[data-tablero="${clave}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', String(dentro));
    b.title = dentro ? 'Quitar del tablero' : 'Añadir al tablero';
    b.textContent = b.classList.contains('boton-tablero--compacto') ? `${dentro ? '✓' : '+'} Tablero` : textoBoton(dentro);
  });
  pintarBotonMesa();
  contexto.refrescar?.('tablero');
}

// ---------- Qué se ve de cada elemento ----------

function describir(clave) {
  const d = contexto.datos;
  const id = Number(clave.slice(1));
  switch (clave[0]) {
    case 's': {
      const i = d.sospechosos.findIndex((s) => s.idSospechoso === id);
      if (i < 0) return null;
      const s = d.sospechosos[i];
      return { tipo: 'foto', etiqueta: s.nombre, html: `${retrato(i)}<span class="ti__pie">${escapar(s.nombre)}</span>` };
    }
    case 'e': {
      const e = d.evidencias.find((x) => x.idEvidencia === id);
      if (!e) return null;
      return {
        tipo: 'foto', etiqueta: e.nombre,
        html: `${ilustracionEvidencia(e)}<span class="ti__pie">#${numero3(e.idEvidencia)} ${escapar(e.nombre)}</span>`
      };
    }
    case 'u': {
      const u = d.ubicaciones.find((x) => x.idUbicacion === id);
      if (!u) return null;
      return { tipo: 'foto', etiqueta: u.nombre, html: `${escenaDe(u)}<span class="ti__pie">${escapar(u.nombre)}</span>` };
    }
    case 'd': {
      const doc = d.documentos.find((x) => x.idDocumento === id);
      if (!doc) return null;
      return {
        tipo: 'papel', etiqueta: doc.titulo,
        html: `<span class="ti__tipo">Documento</span><b class="ti__titulo">${escapar(doc.titulo)}</b>
               <span class="ti__texto">${escapar(recortar(doc.contenido.replace(/\[TACHADO\]/g, '█████'), 110))}</span>`
      };
    }
    case 'm': {
      const m = d.mensajes.find((x) => x.idMensaje === id);
      if (!m) return null;
      return {
        tipo: 'tira', etiqueta: `Mensaje de ${m.remitente}`,
        html: `<span class="ti__tipo">Mensaje · ${hora(m.fecha)}</span><b class="ti__titulo">${escapar(m.remitente)} → ${escapar(m.destinatario)}</b>
               <span class="ti__texto">«${escapar(recortar(m.contenido, 90))}»</span>`
      };
    }
    case 'l': {
      const l = d.llamadas.find((x) => x.idLlamada === id);
      if (!l) return null;
      return {
        tipo: 'tira', etiqueta: `Llamada de ${l.origen}`,
        html: `<span class="ti__tipo">Llamada · ${hora(l.fecha)}</span><b class="ti__titulo">${escapar(l.origen)} → ${escapar(l.destino)}</b>
               <span class="ti__texto">${duracionLlamada(l.duracion) || 'Llamada perdida'}</span>`
      };
    }
    case 'c': {
      const i = d.declaraciones.findIndex((x) => x.idDeclaracion === id);
      if (i < 0) return null;
      const { persona, texto } = partirDeclaracion(d.declaraciones[i].contenido);
      return {
        tipo: 'papel', etiqueta: `Declaración de ${persona || 'persona no consta'}`,
        html: `<span class="ti__tipo">Declaración Nº ${numero2(i + 1)}</span><b class="ti__titulo">${escapar(persona || 'Persona no consta')}</b>
               <span class="ti__texto">«${escapar(recortar(texto, 100))}»</span>`
      };
    }
    case 'a': {
      const a = d.lineaTiempo.find((x) => x.idAcontecimiento === id);
      if (!a) return null;
      return {
        tipo: 'ficha', etiqueta: a.titulo,
        html: `<span class="ti__tipo">${hora(a.fecha)}</span><b class="ti__titulo">${escapar(a.titulo)}</b>`
      };
    }
    default:
      return null;
  }
}

// ---------- Añadir y quitar ----------

function hueco() {
  // Rejilla de 5 × 3 con un poco de desorden para que no parezca alineado por máquina
  const n = estado.elementos.length;
  const col = n % 5;
  const fila = Math.floor(n / 5) % 3;
  return {
    x: Math.min(.86, .04 + col * .18 + Math.random() * .04),
    y: Math.min(.78, .06 + fila * .3 + Math.random() * .05)
  };
}

function agregar(clave, desde, extra = {}) {
  const { x, y } = hueco();
  estado.elementos.push({ clave, x, y, giro: Math.round((Math.random() * 8 - 4) * 10) / 10, ...extra });
  guardar();
  sincronizarBotones(clave);
  volar(desde);
  reproducir('papel');
  if (dialogo?.open) pintar();
}

function quitar(clave) {
  estado.elementos = estado.elementos.filter((e) => e.clave !== clave);
  estado.conexiones = estado.conexiones.filter((c) => c.a !== clave && c.b !== clave);
  guardar();
  sincronizarBotones(clave);
  reproducir('click');
  if (dialogo?.open) pintar();
}

export function alternarEnTablero(clave, desde) {
  if (enTablero(clave)) quitar(clave);
  else agregar(clave, desde);
}

// La tarjeta viaja hasta el botón del tablero
function volar(desde) {
  if (!desde || !botonMesa || movimientoReducido()) return;
  const a = desde.getBoundingClientRect();
  const b = botonMesa.getBoundingClientRect();
  const fantasma = document.createElement('div');
  fantasma.className = 'vuelo-tablero';
  fantasma.style.left = `${a.left + a.width / 2 - 22}px`;
  fantasma.style.top = `${a.top + a.height / 2 - 16}px`;
  // Dentro del diálogo abierto, si lo hay: si no, quedaría detrás de su fondo
  (document.querySelector('dialog[open]') || document.body).append(fantasma);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fantasma.style.transform =
      `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) rotate(14deg) scale(.45)`;
    fantasma.style.opacity = '.3';
  }));
  setTimeout(() => {
    fantasma.remove();
    animar(botonMesa, 'boton-mesa-tablero--recibe');
  }, 720);
}

// ---------- Botón en la mesa ----------

function pintarBotonMesa() {
  if (!botonMesa) return;
  const n = estado.elementos.length;
  botonMesa.querySelector('[data-cuenta]').textContent = n;
  botonMesa.setAttribute('aria-label', `Abrir tablero de investigación, ${n} elementos`);
}

export function mostrarBotonTablero() {
  botonMesa?.classList.add('boton-mesa-tablero--visible');
}

// ---------- Pared ----------

function elementoHTML(el) {
  const z = el.z || 1;
  const estilo = `left: ${el.x * 100}%; top: ${el.y * 100}%; --giro: ${el.giro || 0}deg; z-index: ${z}`;
  if (el.clave.startsWith('n')) {
    return `
      <div class="ti ti--nota" data-clave="${el.clave}" tabindex="0" role="group" aria-label="Nota" style="${estilo}">
        <span class="ti__chincheta" aria-hidden="true"></span>
        <textarea class="ti__nota" maxlength="220" aria-label="Texto de la nota" placeholder="Escribe una nota…">${escapar(el.texto || '')}</textarea>
        <button type="button" class="ti__quitar" data-quitar aria-label="Quitar nota">×</button>
      </div>`;
  }
  const info = describir(el.clave);
  if (!info) return '';
  return `
    <div class="ti ti--${info.tipo}" data-clave="${el.clave}" tabindex="0" role="group" aria-label="${escapar(info.etiqueta)}" style="${estilo}">
      <span class="ti__chincheta" aria-hidden="true"></span>
      <div class="ti__cuerpo">${info.html}</div>
      <button type="button" class="ti__quitar" data-quitar aria-label="Quitar del tablero">×</button>
    </div>`;
}

function pintar() {
  zSiguiente = Math.max(10, ...estado.elementos.map((e) => e.z || 1)) + 1;
  pared.innerHTML = `
    ${estado.elementos.length ? '' : `<p class="tablero__vacio">El tablero está vacío.<br>Usa «Añadir al tablero» en las hojas del expediente, o pon una nota.</p>`}
    ${estado.elementos.map(elementoHTML).join('')}
    <svg class="tablero__hilos" aria-hidden="true"></svg>`;
  dibujarHilos();
}

function ancla(clave) {
  const el = pared.querySelector(`.ti[data-clave="${clave}"]`);
  if (!el) return null;
  return { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + 9 };
}

function dibujarHilos(nueva = -1) {
  const svg = pared.querySelector('.tablero__hilos');
  if (!svg) return;
  const ancho = pared.clientWidth;
  const alto = pared.clientHeight;
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.innerHTML = estado.conexiones.map((c, i) => {
    const a = ancla(c.a);
    const b = ancla(c.b);
    if (!a || !b) return '';
    const distancia = Math.hypot(b.x - a.x, b.y - a.y);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 + Math.min(70, distancia * .14); // el hilo cuelga un poco
    const d = `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`;
    const ty = (a.y + b.y) / 4 + my / 2;
    return `
      <g class="hilo${i === nueva ? ' hilo--nuevo' : ''}">
        <path class="hilo__sombra" d="${d}" transform="translate(2 3)" pathLength="1"/>
        <path class="hilo__linea" d="${d}" pathLength="1"/>
        <path class="hilo__zona" d="${d}" data-hilo="${i}"/>
        ${c.etiqueta ? `<text class="hilo__etiqueta" x="${mx}" y="${ty}" text-anchor="middle">${escapar(c.etiqueta)}</text>` : ''}
      </g>`;
  }).join('');
}

// ---------- Interacción en la pared ----------

function moverA(el, x, y) {
  const maxX = 1 - el.offsetWidth / pared.clientWidth;
  const maxY = 1 - el.offsetHeight / pared.clientHeight;
  const datos = estado.elementos.find((e) => e.clave === el.dataset.clave);
  datos.x = Math.max(0, Math.min(maxX, x));
  datos.y = Math.max(0, Math.min(maxY, y));
  el.style.left = `${datos.x * 100}%`;
  el.style.top = `${datos.y * 100}%`;
  dibujarHilos();
}

function alFrente(el) {
  const datos = estado.elementos.find((e) => e.clave === el.dataset.clave);
  datos.z = zSiguiente++;
  el.style.zIndex = datos.z;
}

function conectarCon(el) {
  const clave = el.dataset.clave;
  if (!origen) {
    origen = clave;
    el.classList.add('ti--origen');
    indicar('Ahora elige el segundo elemento.');
    reproducir('click');
    return;
  }
  pared.querySelector('.ti--origen')?.classList.remove('ti--origen');
  if (origen !== clave) {
    const existe = estado.conexiones.some((c) =>
      (c.a === origen && c.b === clave) || (c.a === clave && c.b === origen));
    if (!existe) {
      estado.conexiones.push({ a: origen, b: clave, etiqueta: '' });
      guardar();
      dibujarHilos(estado.conexiones.length - 1);
      reproducir('papel');
    }
  }
  origen = null;
  indicar('Elige el primer elemento de otra conexión, o pulsa «Conectar» para terminar.');
}

function arrastrar(e, el) {
  const caja = pared.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const dx = e.clientX - r.left;
  const dy = e.clientY - r.top;
  const inicio = { x: e.clientX, y: e.clientY };
  let movido = false;

  el.setPointerCapture(e.pointerId);
  alFrente(el);

  const mover = (ev) => {
    if (!movido && Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) < 4) return;
    if (!movido) {
      movido = true;
      el.classList.add('ti--arrastrando');
    }
    moverA(el, (ev.clientX - caja.left - dx) / caja.width, (ev.clientY - caja.top - dy) / caja.height);
  };
  const soltar = () => {
    el.removeEventListener('pointermove', mover);
    el.removeEventListener('pointerup', soltar);
    el.removeEventListener('pointercancel', soltar);
    el.classList.remove('ti--arrastrando');
    if (movido) reproducir('papel');
    guardar();
  };
  el.addEventListener('pointermove', mover);
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);
}

function editarHilo(i) {
  cerrarEditorHilo();
  const c = estado.conexiones[i];
  const a = ancla(c.a);
  const b = ancla(c.b);
  if (!a || !b) return;
  const editor = document.createElement('form');
  editor.className = 'hilo-editor';
  editor.style.left = `${(a.x + b.x) / 2}px`;
  editor.style.top = `${(a.y + b.y) / 2}px`;
  editor.innerHTML = `
    <input type="text" maxlength="40" placeholder="Etiqueta (p. ej. llamada 22:43)" aria-label="Etiqueta del hilo" value="${escapar(c.etiqueta || '')}">
    <button type="submit">Guardar</button>
    <button type="button" data-quitar-hilo>Quitar hilo</button>`;
  editor.addEventListener('submit', (ev) => {
    ev.preventDefault();
    c.etiqueta = editor.querySelector('input').value.trim();
    guardar();
    cerrarEditorHilo();
    dibujarHilos();
  });
  editor.querySelector('[data-quitar-hilo]').addEventListener('click', () => {
    estado.conexiones.splice(i, 1);
    guardar();
    cerrarEditorHilo();
    dibujarHilos();
    reproducir('click');
  });
  pared.append(editor);
  editor.querySelector('input').focus();
}

const cerrarEditorHilo = () => pared.querySelector('.hilo-editor')?.remove();

function indicar(texto) {
  dialogo.querySelector('[data-indicacion]').textContent = texto;
}

function alternarConectar(activo = !modoConectar) {
  modoConectar = activo;
  origen = null;
  pared.querySelector('.ti--origen')?.classList.remove('ti--origen');
  pared.classList.toggle('tablero__pared--conectando', modoConectar);
  const boton = dialogo.querySelector('[data-herramienta="conectar"]');
  boton.setAttribute('aria-pressed', String(modoConectar));
  indicar(modoConectar ? 'Elige el primer elemento que quieres conectar.' : 'Arrastra los elementos. Toca un hilo para ponerle nombre o quitarlo.');
  reproducir('click');
}

function crearDialogo() {
  dialogo = document.createElement('dialog');
  dialogo.className = 'tablero';
  dialogo.setAttribute('aria-label', 'Tablero de investigación');
  dialogo.innerHTML = `
    <header class="tablero__barra">
      <div>
        <p class="tablero__titulo">Tablero de investigación · Expediente Nº ${contexto.exp.numero}</p>
        <p class="tablero__indicacion" data-indicacion aria-live="polite"></p>
      </div>
      <div class="tablero__herramientas">
        <button type="button" data-herramienta="nota">+ Nota</button>
        <button type="button" data-herramienta="conectar" aria-pressed="false">Conectar</button>
        <button type="button" data-herramienta="cerrar">Volver al expediente</button>
      </div>
    </header>
    <div class="tablero__pared"></div>`;
  document.body.append(dialogo);
  pared = dialogo.querySelector('.tablero__pared');

  dialogo.querySelector('.tablero__herramientas').addEventListener('click', (e) => {
    const herramienta = e.target.closest('[data-herramienta]')?.dataset.herramienta;
    if (herramienta === 'cerrar') dialogo.close();
    if (herramienta === 'conectar') alternarConectar();
    if (herramienta === 'nota') {
      const clave = `n${Date.now()}`;
      agregar(clave, null, { texto: '' });
      pared.querySelector(`.ti[data-clave="${clave}"] textarea`)?.focus();
    }
  });

  pared.addEventListener('pointerdown', (e) => {
    const zona = e.target.closest('[data-hilo]');
    if (zona) {
      editarHilo(Number(zona.dataset.hilo));
      return;
    }
    if (!e.target.closest('.hilo-editor')) cerrarEditorHilo();
    const el = e.target.closest('.ti');
    if (!el || e.target.closest('textarea, button')) return;
    if (modoConectar) {
      conectarCon(el);
      return;
    }
    e.preventDefault();
    el.focus({ preventScroll: true });
    arrastrar(e, el);
  });

  pared.addEventListener('click', (e) => {
    const quitarBoton = e.target.closest('[data-quitar]');
    if (quitarBoton) quitar(quitarBoton.closest('.ti').dataset.clave);
  });

  pared.addEventListener('input', (e) => {
    if (!e.target.matches('.ti__nota')) return;
    const datos = estado.elementos.find((x) => x.clave === e.target.closest('.ti').dataset.clave);
    datos.texto = e.target.value;
    guardar();
  });

  // Teclado: flechas mueven el elemento con foco; Intro lo conecta en modo «Conectar»
  pared.addEventListener('keydown', (e) => {
    const el = e.target.closest('.ti');
    if (!el || e.target.matches('textarea')) return;
    const paso = e.shiftKey ? .05 : .01;
    const datos = estado.elementos.find((x) => x.clave === el.dataset.clave);
    const movimientos = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] };
    if (movimientos[e.key]) {
      e.preventDefault();
      moverA(el, datos.x + movimientos[e.key][0], datos.y + movimientos[e.key][1]);
      guardar();
    } else if (e.key === 'Enter' && modoConectar) {
      e.preventDefault();
      conectarCon(el);
    }
  });

  // Esc primero cancela la conexión en curso y después cierra
  dialogo.addEventListener('cancel', (e) => {
    if (modoConectar) {
      e.preventDefault();
      alternarConectar(false);
    }
  });
  dialogo.addEventListener('close', () => {
    if (modoConectar) alternarConectar(false);
    cerrarEditorHilo();
    contexto.refrescar?.('tablero');
    reproducir('papel');
  });
  window.addEventListener('resize', () => { if (dialogo.open) dibujarHilos(); });
}

export function abrirTablero() {
  if (!dialogo) return;
  dialogo.showModal();
  indicar('Arrastra los elementos. Toca un hilo para ponerle nombre o quitarlo.');
  pintar();
  reproducir('carpeta');
}

// Acceso permanente al tablero en la barra del sistema
function crearBotonMesa() {
  botonMesa = document.createElement('button');
  botonMesa.type = 'button';
  botonMesa.className = 'barra-sistema__boton boton-mesa-tablero';
  botonMesa.dataset.abrirTablero = '';
  botonMesa.innerHTML = '<span class="boton-mesa-tablero__chincheta" aria-hidden="true"></span>Tablero <span data-cuenta>0</span>';
  const acciones = document.querySelector('.barra-sistema__acciones');
  if (acciones) acciones.prepend(botonMesa);
  else document.body.append(botonMesa);
  pintarBotonMesa();
}

export function iniciarTablero(ctx) {
  contexto = ctx;
  claveAlmacen = `a47.tablero.${ctx.exp.partida.idPartida}`;
  cargar();
  crearDialogo();
  crearBotonMesa();

  // Botones «Añadir al tablero» y «Abrir tablero» de cualquier hoja o visor
  document.addEventListener('click', (e) => {
    const alternar = e.target.closest('[data-tablero]');
    if (alternar) {
      alternarEnTablero(alternar.dataset.tablero, alternar);
      return;
    }
    if (e.target.closest('[data-abrir-tablero]')) abrirTablero();
  });
}
