// FASE 17 · Pistas: sobres cerrados que se abren en orden y descuentan puntos.
// Orientan, no resuelven.
import { escapar, escribir, esperar, avisar } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { usarPista } from '../../services/clueService.js';
import { vacio, numero2 } from '../comun.js';

const enCurso = (exp) => exp.partida.estado === 'EN_CURSO';

function sobre(p, siguiente, abierto) {
  const cabecera = `
    <span class="sobre__numero">Pista Nº ${numero2(p.orden ?? 0)}</span>
    <span class="sobre__datos">${p.importancia ? `Importancia ${escapar(p.importancia)} · ` : ''}−${p.costo} pts</span>`;
  if (p.usada) {
    return `
      <article class="sobre sobre--abierto" data-pista="${p.idPista}">
        ${cabecera}
        <p class="sobre__nota nota-mano">${escapar(p.descripcion || '')}</p>
      </article>`;
  }
  if (siguiente && abierto) {
    return `
      <div class="sobre sobre--cerrado sobre--siguiente" data-pista="${p.idPista}">
        <span class="sobre__solapa" aria-hidden="true"></span>
        <span class="sobre__lacre" aria-hidden="true">47</span>
        ${cabecera}
        <div class="sobre__accion" data-accion-pista>
          <button type="button" class="boton-tinta" data-pedir>Abrir sobre</button>
        </div>
      </div>`;
  }
  return `
    <div class="sobre sobre--cerrado sobre--en-espera" aria-disabled="true">
      <span class="sobre__solapa" aria-hidden="true"></span>
      <span class="sobre__lacre" aria-hidden="true">47</span>
      ${cabecera}
      <span class="sobre__espera">${abierto ? 'Se abre después de la anterior' : 'Investigación cerrada'}</span>
    </div>`;
}

export function render({ exp, datos }) {
  if (!datos.pistas.length) return vacio('Este caso no tiene pistas.');
  const siguiente = datos.pistas.find((p) => !p.usada);
  return `
    <p class="hoja__entradilla">Las pistas orientan, no resuelven. Se abren en orden y cada sobre descuenta puntos.</p>
    <p class="marcador">Puntaje actual <b data-puntaje>${datos.puntaje ?? '—'}</b> pts</p>
    <div class="sobres">
      ${datos.pistas.map((p) => sobre(p, p === siguiente, enCurso(exp))).join('')}
    </div>`;
}

export function montar(hoja, contexto) {
  const { exp, datos } = contexto;
  hoja.addEventListener('click', async (e) => {
    const accion = e.target.closest('[data-accion-pista]');
    if (!accion) return;
    const p = datos.pistas.find((x) => !x.usada);

    if (e.target.closest('[data-pedir]')) {
      accion.innerHTML = `
        <p class="sobre__confirmar">Abrirlo descontará <b>${p.costo} puntos</b>.</p>
        <button type="button" class="boton-tinta boton-tinta--suave" data-cancelar>Mejor no</button>
        <button type="button" class="boton-tinta boton-tinta--rojo" data-confirmar>Abrir</button>`;
      accion.querySelector('[data-confirmar]').focus();
      reproducir('click');
      return;
    }
    if (e.target.closest('[data-cancelar]')) {
      accion.innerHTML = '<button type="button" class="boton-tinta" data-pedir>Abrir sobre</button>';
      reproducir('click');
      return;
    }
    if (!e.target.closest('[data-confirmar]')) return;

    accion.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    let resultado;
    try {
      resultado = await usarPista(exp.partida.idPartida);
    } catch (error) {
      avisar(error.message, 'alerta');
      contexto.refrescar('pistas');
      return;
    }

    // El sobre se abre y la nota sale escrita a mano
    Object.assign(p, resultado.pista);
    datos.puntaje = resultado.puntaje;
    document.querySelectorAll('[data-puntaje]').forEach((el) => { el.textContent = resultado.puntaje; });

    const tarjeta = accion.closest('.sobre');
    tarjeta.classList.add('sobre--abriendose');
    reproducir('papel');
    await esperar(650);
    tarjeta.classList.replace('sobre--cerrado', 'sobre--abierto');
    tarjeta.classList.remove('sobre--siguiente', 'sobre--abriendose');
    accion.remove();
    tarjeta.querySelectorAll('.sobre__solapa, .sobre__lacre').forEach((x) => x.remove());
    const nota = document.createElement('p');
    nota.className = 'sobre__nota nota-mano';
    tarjeta.append(nota);
    avisar(`Nueva pista · −${p.costo} pts`);
    await escribir(nota, p.descripcion || '', { velocidad: 30 });
    await esperar(500);
    contexto.refrescar('pistas');
  });
}
