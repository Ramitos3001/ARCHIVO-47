// Sonido opcional, apagado por defecto. Los efectos se sintetizan con
// Web Audio, así no dependen de archivos y nunca fallan por faltar uno.

const CLAVE = 'a47.sonido';
let activo = leerPreferencia();
let ctx = null;

function leerPreferencia() {
  try { return localStorage.getItem(CLAVE) === 'on'; } catch { return false; }
}

export const sonidoActivo = () => activo;

export function alternarSonido() {
  activo = !activo;
  try { localStorage.setItem(CLAVE, activo ? 'on' : 'off'); } catch { /* sin almacenamiento */ }
  if (activo) reproducir('click');
  return activo;
}

function contexto() {
  if (!ctx) {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return null;
    ctx = new Contexto();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// El navegador solo permite audio después de un gesto del usuario
const desbloquear = () => { if (activo) contexto(); };
document.addEventListener('pointerdown', desbloquear, { once: true });
document.addEventListener('keydown', desbloquear, { once: true });

function ruido(c, segundos) {
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * segundos), c.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  const fuente = c.createBufferSource();
  fuente.buffer = buffer;
  return fuente;
}

// Conecta un nodo a la salida con una envolvente ataque/caída
function envolvente(c, nodo, t, ataque, duracion, volumen) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(volumen, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  nodo.connect(g).connect(c.destination);
}

function filtrado(c, fuente, tipo, frecuencia, q = 1) {
  const f = c.createBiquadFilter();
  f.type = tipo;
  f.frequency.value = frecuencia;
  f.Q.value = q;
  fuente.connect(f);
  return f;
}

function tono(c, t, { tipo = 'sine', desde, hasta = desde, duracion, volumen }) {
  const o = c.createOscillator();
  o.type = tipo;
  o.frequency.setValueAtTime(desde, t);
  if (hasta !== desde) o.frequency.exponentialRampToValueAtTime(hasta, t + duracion);
  envolvente(c, o, t, 0.005, duracion, volumen);
  o.start(t);
  o.stop(t + duracion + 0.02);
}

function golpeDeRuido(c, t, { tipo, frecuencia, q, ataque, duracion, volumen }) {
  const n = ruido(c, duracion + 0.02);
  envolvente(c, filtrado(c, n, tipo, frecuencia, q), t, ataque, duracion, volumen);
  n.start(t);
  n.stop(t + duracion + 0.02);
}

const EFECTOS = {
  // Tecla de máquina de escribir
  tecla: (c, t) => golpeDeRuido(c, t, {
    tipo: 'bandpass', frecuencia: 2200 + Math.random() * 1600, q: 1.4, ataque: 0.002, duracion: 0.045, volumen: 0.35
  }),
  click: (c, t) => tono(c, t, { tipo: 'square', desde: 1400, hasta: 700, duracion: 0.03, volumen: 0.05 }),
  // Sello: golpe sordo más el roce del papel
  sello: (c, t) => {
    tono(c, t, { desde: 130, hasta: 45, duracion: 0.18, volumen: 0.6 });
    golpeDeRuido(c, t, { tipo: 'lowpass', frecuencia: 700, q: 0.7, ataque: 0.002, duracion: 0.12, volumen: 0.4 });
  },
  papel: (c, t) => golpeDeRuido(c, t, {
    tipo: 'bandpass', frecuencia: 1700, q: 0.6, ataque: 0.09, duracion: 0.34, volumen: 0.22
  }),
  carpeta: (c, t) => {
    golpeDeRuido(c, t, { tipo: 'lowpass', frecuencia: 900, q: 0.8, ataque: 0.03, duracion: 0.26, volumen: 0.35 });
    tono(c, t + 0.02, { desde: 90, hasta: 55, duracion: 0.12, volumen: 0.25 });
  },
  acceso: (c, t) => {
    tono(c, t, { tipo: 'square', desde: 660, duracion: 0.09, volumen: 0.05 });
    tono(c, t + 0.12, { tipo: 'square', desde: 990, duracion: 0.16, volumen: 0.05 });
  },
  error: (c, t) => {
    tono(c, t, { tipo: 'sawtooth', desde: 150, duracion: 0.16, volumen: 0.07 });
    tono(c, t + 0.2, { tipo: 'sawtooth', desde: 120, duracion: 0.24, volumen: 0.07 });
  }
};

export function reproducir(nombre) {
  if (!activo || !EFECTOS[nombre]) return;
  try {
    const c = contexto();
    if (c) EFECTOS[nombre](c, c.currentTime + 0.005);
  } catch { /* el audio nunca debe romper el juego */ }
}
