// FASE 5 · Introducción cinematográfica: pantalla oscura, horas que aparecen
// y frases que se escriben, hasta "INVESTIGACIÓN INICIADA".
import { reproducir } from '../sound.js';
import { escribir, escapar, formatearFecha, movimientoReducido } from '../ui.js';

const HORA = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;

const dos = (n) => String(n).padStart(2, '0');

function horaDe(iso) {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? null : `${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

// Minutos desde las 06:00: la madrugada va después de la noche anterior
function minutosNocturnos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return (h < 6 ? h + 24 : h) * 60 + m;
}

// Momentos del caso para la introducción. Fuente, por orden de preferencia:
// 1) los primeros acontecimientos de la línea temporal;
// 2) las frases de la descripción que mencionan una hora (ordenadas por hora),
//    cerrando con la última frase sin hora;
// 3) las primeras frases de la descripción, sin hora.
// Nunca se inventan horas: una hora falsa sería una pista falsa.
export function momentosDelCaso(caso, lineaTiempo = []) {
  if (lineaTiempo.length) {
    return lineaTiempo.slice(0, 3).map((a) => ({
      hora: horaDe(a.fecha),
      fecha: formatearFecha(a.fecha),
      texto: a.titulo
    }));
  }

  const frases = (caso.descripcion || '')
    .split(/(?<=[.!?])\s+/)
    .map((f) => f.trim())
    .filter(Boolean);

  const conHora = [];
  const sinHora = [];
  for (const frase of frases) {
    const m = frase.match(HORA);
    if (m) conHora.push({ hora: `${dos(m[1])}:${m[2]}`, texto: frase });
    else sinHora.push({ hora: null, texto: frase });
  }

  if (!conHora.length) return sinHora.slice(0, 3);
  conHora.sort((a, b) => minutosNocturnos(a.hora) - minutosNocturnos(b.hora));
  return [...conHora.slice(0, 3), ...sinHora.slice(-1)];
}

// Reproduce la introducción en `capa` y resuelve al terminar o al saltarla
export async function reproducirIntro(capa, { momentos, numero, estado }) {
  let saltado = false;
  let despertar = () => {};

  const pausa = (ms) => {
    if (saltado || movimientoReducido()) return Promise.resolve();
    return new Promise((resolver) => {
      const t = setTimeout(resolver, ms);
      despertar = () => { clearTimeout(t); resolver(); };
    });
  };
  const saltar = () => {
    saltado = true;
    despertar();
  };

  const resumen = momentos.map((m) => `${m.hora || ''} ${m.texto}`).join('. ');
  capa.innerHTML = `
    <p class="solo-lectores">${escapar(resumen)}. Archivo 47, caso número ${numero}. ${escapar(estado)}.</p>
    <div class="intro__lineas" aria-hidden="true"></div>
    <div class="intro__cierre" aria-hidden="true"></div>
    <button type="button" class="boton-terminal intro__saltar">Saltar ›</button>`;
  capa.classList.remove('intro--saliendo');
  capa.hidden = false;

  const botonSaltar = capa.querySelector('.intro__saltar');
  botonSaltar.addEventListener('click', saltar);
  const alTeclear = (e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      saltar();
    }
  };
  document.addEventListener('keydown', alTeclear);
  botonSaltar.focus({ preventScroll: true });

  await pausa(800);

  const lineas = capa.querySelector('.intro__lineas');
  let anterior = null;
  for (const momento of momentos) {
    if (saltado) break;
    anterior?.classList.add('intro__momento--pasado');

    const el = document.createElement('div');
    el.className = 'intro__momento';
    el.innerHTML = `
      <span class="intro__hora${momento.hora ? '' : ' intro__hora--desconocida'}">${momento.hora || '--:--'}</span>
      <span class="intro__texto"></span>
      ${momento.fecha ? `<span class="intro__fecha">${escapar(momento.fecha)}</span>` : ''}`;
    lineas.append(el);
    reproducir('click');

    await pausa(700);
    await escribir(el.querySelector('.intro__texto'), momento.texto, { velocidad: 32, saltar: () => saltado });
    await pausa(1400);
    anterior = el;
  }

  if (!saltado) {
    anterior?.classList.add('intro__momento--pasado');
    const cierre = capa.querySelector('.intro__cierre');
    cierre.innerHTML = `<p class="intro__caso">Archivo 47 · Caso Nº ${numero}</p><p class="intro__estado"></p>`;
    await pausa(600);
    await escribir(cierre.querySelector('.intro__estado'), estado, { velocidad: 55, saltar: () => saltado });
    reproducir('sello');
    await pausa(1700);
  }

  document.removeEventListener('keydown', alTeclear);
  capa.classList.add('intro--saliendo');
  await new Promise((resolver) => setTimeout(resolver, movimientoReducido() ? 0 : 900));
  capa.hidden = true;
  capa.innerHTML = '';
}
