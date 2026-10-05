// FASE 18 · Acertijos: resolverlos suma puntos y puede desbloquear evidencias
import { escapar, animar, avisar } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { responderAcertijo } from '../../services/puzzleService.js';
import { mostrarDesbloqueo } from '../desbloqueo.js';
import { vacio, numero2 } from '../comun.js';

const enCurso = (exp) => exp.partida.estado === 'EN_CURSO';

function tarjeta(a, i, abierto) {
  const ocultas = a.evidenciasQueDesbloquea || 0;
  return `
    <article class="acertijo${a.resuelto ? ' acertijo--resuelto' : ''}" id="acertijo-${a.idAcertijo}" data-acertijo="${a.idAcertijo}">
      <header class="acertijo__cabecera">
        <span>Acertijo Nº ${numero2(i + 1)}</span>
        <span>${a.dificultad ? `${escapar(a.dificultad)} · ` : ''}+${a.puntos} pts</span>
      </header>
      <p class="acertijo__pregunta">${escapar(a.pregunta)}</p>
      ${ocultas && !a.resuelto ? `<p class="acertijo__oculta">Oculta ${ocultas === 1 ? 'una evidencia' : `${ocultas} evidencias`}</p>` : ''}
      ${a.resuelto
        ? '<span class="sello sello--tinta acertijo__sello">Resuelto</span>'
        : abierto ? `
          <form class="acertijo__formulario" novalidate>
            <label class="solo-lectores" for="respuesta-${a.idAcertijo}">Respuesta al acertijo ${i + 1}</label>
            <input id="respuesta-${a.idAcertijo}" class="acertijo__campo" type="text" autocomplete="off" spellcheck="false" placeholder="Tu respuesta">
            <button type="submit" class="boton-tinta">Resolver</button>
          </form>` : '<p class="acertijo__intentos">Investigación cerrada.</p>'}
      <p class="acertijo__intentos" data-intentos>${a.intentos ? `Intentos: ${a.intentos}` : ''}</p>
      <p class="acertijo__mensaje" data-mensaje role="status"></p>
    </article>`;
}

export function render({ exp, datos }) {
  if (!datos.acertijos.length) return vacio('Este caso no tiene acertijos.');
  const resueltos = datos.acertijos.filter((a) => a.resuelto).length;
  return `
    <p class="hoja__entradilla">Algunas respuestas abren evidencias que el expediente aún esconde.</p>
    <p class="marcador">Resueltos <b>${resueltos} / ${datos.acertijos.length}</b> · Puntaje <b data-puntaje>${datos.puntaje ?? '—'}</b> pts</p>
    ${datos.acertijos.map((a, i) => tarjeta(a, i, enCurso(exp))).join('')}`;
}

export function montar(hoja, contexto) {
  const { exp, datos } = contexto;
  hoja.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formulario = e.target;
    const caja = formulario.closest('[data-acertijo]');
    const a = datos.acertijos.find((x) => x.idAcertijo === Number(caja.dataset.acertijo));
    const campo = formulario.querySelector('input');
    const mensaje = caja.querySelector('[data-mensaje]');
    const respuesta = campo.value.trim();
    if (!respuesta) {
      mensaje.textContent = 'Escribe una respuesta.';
      campo.focus();
      return;
    }

    formulario.querySelectorAll('input, button').forEach((x) => { x.disabled = true; });
    let resultado;
    try {
      resultado = await responderAcertijo(exp.partida.idPartida, a.idAcertijo, respuesta);
    } catch (error) {
      mensaje.textContent = error.message;
      formulario.querySelectorAll('input, button').forEach((x) => { x.disabled = false; });
      reproducir('error');
      return;
    }

    a.intentos = (a.intentos || 0) + 1;
    caja.querySelector('[data-intentos]').textContent = `Intentos: ${a.intentos}`;

    if (!resultado.correcta) {
      mensaje.textContent = 'Respuesta incorrecta.';
      formulario.querySelectorAll('input, button').forEach((x) => { x.disabled = false; });
      animar(caja, 'anim-temblor');
      reproducir('error');
      campo.select();
      return;
    }

    // Correcta: sello, puntaje y, si había, evidencias nuevas
    a.resuelto = true;
    datos.puntaje = resultado.puntaje;
    document.querySelectorAll('[data-puntaje]').forEach((el) => { el.textContent = resultado.puntaje; });
    formulario.remove();
    caja.classList.add('acertijo--resuelto');
    caja.querySelector('.acertijo__oculta')?.remove();
    mensaje.textContent = `Correcto · +${a.puntos} pts`;
    const sello = document.createElement('span');
    sello.className = 'sello sello--tinta sello--estampar acertijo__sello';
    sello.textContent = 'Resuelto';
    caja.querySelector('.acertijo__pregunta').after(sello);
    reproducir('sello');

    resultado.logrosNuevos?.forEach((logro) => avisar(`Logro desbloqueado · ${logro.nombre}`));

    const nuevas = resultado.evidenciasDesbloqueadas || [];
    nuevas.forEach((ev) => {
      if (!datos.evidencias.some((x) => x.idEvidencia === ev.idEvidencia)) datos.evidencias.push(ev);
      datos.nuevas.add(ev.idEvidencia);
    });
    // La teoría depende de cuántos acertijos quedan
    if (datos.requisitos) datos.requisitos.acertijosResueltos = datos.acertijos.filter((x) => x.resuelto).length;
    contexto.refrescar('evidencias', 'fotografias', 'teoria');

    if (nuevas.length) {
      const eleccion = await mostrarDesbloqueo(nuevas);
      if (eleccion === 'ver') contexto.navegar('evidencias');
    } else {
      avisar('Acertijo resuelto');
    }
  });
}
