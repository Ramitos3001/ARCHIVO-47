// FASES 20-22 · Presentación de la acusación (§33), resultado (§34) y logros (§35).
// Todo ocurre en una capa oscura encima del expediente.
import { escapar, escribir, esperar, movimientoReducido } from '../ui.js';
import { reproducir } from '../sound.js';

let capa = null;

function abrirCapa(clase, { cancelable = false, alCancelar = null } = {}) {
  cerrarCapa();
  capa = document.createElement('dialog');
  capa.className = `presentacion ${clase}`;
  capa.addEventListener('cancel', (e) => {
    e.preventDefault();
    if (cancelable) alCancelar?.();
  });
  document.body.append(capa);
  capa.showModal();
  return capa;
}

function cerrarCapa() {
  if (!capa) return;
  if (capa.open) capa.close();
  capa.remove();
  capa = null;
}

// ---------- Confirmación: la acusación formal antes de entregarla ----------

export function confirmarAcusacion({ numero, responsable, clave, apoyos, intentosRestantes }) {
  return new Promise((resolver) => {
    const responder = (valor) => {
      cerrarCapa();
      resolver(valor);
    };
    const el = abrirCapa('presentacion--confirmar', { cancelable: true, alCancelar: () => responder(false) });
    el.innerHTML = `
      <article class="acusacion papel papel--manchado">
        <p class="acusacion__formulario">Acusación formal · Expediente Nº ${numero}</p>
        <h2 class="acusacion__titulo">¿Presentar la teoría?</h2>
        <dl class="ficha-datos">
          <dt>Responsable</dt><dd>${escapar(responsable)}</dd>
          <dt>Evidencia clave</dt><dd>${escapar(clave)}</dd>
          <dt>Evidencias de apoyo</dt><dd>${apoyos}</dd>
          ${intentosRestantes != null ? `<dt>Intentos restantes</dt><dd>${intentosRestantes}</dd>` : ''}
        </dl>
        <p class="acusacion__aviso">Una teoría equivocada descuenta 200 puntos${intentosRestantes === 1 ? ' y es tu último intento' : ''}.</p>
        <div class="acusacion__acciones">
          <button type="button" class="boton-tinta boton-tinta--suave" data-respuesta="no">Revisar teoría</button>
          <button type="button" class="boton-tinta boton-tinta--rojo" data-respuesta="si">Presentar acusación</button>
        </div>
      </article>`;
    el.addEventListener('click', (e) => {
      const boton = e.target.closest('[data-respuesta]');
      if (boton) {
        reproducir('click');
        responder(boton.dataset.respuesta === 'si');
      }
    });
    el.querySelector('[data-respuesta="no"]').focus();
    reproducir('papel');
  });
}

// ---------- Secuencia de evaluación ----------

const PASOS = ['Presentando investigación', 'Analizando evidencias', 'Comparando información', 'Verificando teoría'];

// Muestra los pasos mientras el backend evalúa. Resuelve con el resultado o lanza su error.
export async function evaluar(promesa) {
  const el = abrirCapa('presentacion--secuencia');
  el.innerHTML = '<div class="secuencia" aria-live="polite"></div>';
  const lista = el.querySelector('.secuencia');

  // El resultado puede llegar antes que la animación: se guarda y se espera a ambos
  const pendiente = promesa.then((valor) => ({ valor }), (error) => ({ error }));

  for (const paso of PASOS) {
    const linea = document.createElement('p');
    linea.className = 'secuencia__paso';
    linea.innerHTML = '<span class="secuencia__texto"></span><span class="secuencia__puntos" aria-hidden="true"></span>';
    lista.append(linea);
    await escribir(linea.querySelector('.secuencia__texto'), `${paso}…`, { velocidad: 28 });
    await esperar(650);
    linea.classList.add('secuencia__paso--hecho');
  }

  const { valor, error } = await pendiente;
  await esperar(400);
  if (error) {
    lista.insertAdjacentHTML('beforeend',
      `<p class="secuencia__error">No se pudo registrar la teoría — ${escapar(error.message)}</p>
       <button type="button" class="boton-terminal" data-cerrar>Volver al expediente</button>`);
    reproducir('error');
    await new Promise((resolver) => {
      lista.querySelector('[data-cerrar]').addEventListener('click', resolver, { once: true });
      lista.querySelector('[data-cerrar]').focus();
    });
    cerrarCapa();
    throw error;
  }
  return valor;
}

// ---------- Resultado ----------

function filasInforme(estadisticas) {
  return [
    ['Investigador', estadisticas.investigador],
    ['Precisión', estadisticas.precision],
    ['Evidencias utilizadas', estadisticas.evidencias],
    ['Pistas utilizadas', estadisticas.pistas],
    ['Tiempo de investigación', estadisticas.tiempo],
    ['Puntaje', `${estadisticas.puntaje} pts`]
  ];
}

function solucionHTML(solucion) {
  if (!solucion) return '';
  return `
    <section class="informe__solucion">
      <p class="informe__rotulo">Resolución del caso</p>
      <dl class="ficha-datos">
        <dt>Responsable</dt><dd>${escapar(solucion.culpable)}</dd>
        ${solucion.evidenciaClave ? `<dt>Evidencia clave</dt><dd>${escapar(solucion.evidenciaClave)}</dd>` : ''}
        ${solucion.movil ? `<dt>Móvil</dt><dd>${escapar(solucion.movil)}</dd>` : ''}
      </dl>
      <p class="informe__explicacion">${escapar(solucion.explicacion || '')}</p>
    </section>`;
}

const logroHTML = (logro) => `
  <div class="logro">
    <span class="logro__medalla" aria-hidden="true">★</span>
    <div>
      <p class="logro__rotulo">Logro desbloqueado</p>
      <p class="logro__nombre">${escapar(logro.nombre)}</p>
      <p class="logro__descripcion">“${escapar(logro.descripcion)}”</p>
    </div>
  </div>`;

function esperarAccion(el) {
  return new Promise((resolver) => {
    el.addEventListener('click', (e) => {
      const boton = e.target.closest('[data-accion]');
      if (!boton) return;
      reproducir('click');
      cerrarCapa();
      resolver(boton.dataset.accion);
    });
  });
}

// Informe final: 'cerrado' (resuelto) o 'archivado' (sin intentos).
// Resuelve con 'expediente' o 'central'.
export async function mostrarInforme({ tipo, numero, estadisticas, solucion, logros = [], animado = true }) {
  const cerrado = tipo === 'cerrado';
  const el = abrirCapa('presentacion--informe');
  el.innerHTML = `
    <div class="informe">
      <article class="informe__hoja papel papel--manchado">
        <span class="sello sello--grande ${cerrado ? '' : 'sello--tinta'} informe__sello">${cerrado ? 'Caso cerrado' : 'Sin resolver'}</span>
        <p class="informe__cabecera">Archivo 47 · Expediente Nº ${numero}</p>
        <h2 class="informe__titulo">${cerrado ? 'Caso cerrado' : 'Caso archivado'}</h2>
        <dl class="ficha-datos informe__datos" data-datos></dl>
        <p class="informe__estado" data-estado></p>
        ${solucionHTML(solucion)}
      </article>
      <div class="informe__logros" data-logros></div>
      <div class="informe__acciones" data-acciones hidden>
        <button type="button" class="boton-terminal" data-accion="expediente">Revisar el expediente</button>
        <button type="button" class="boton-terminal" data-accion="central">Volver a la central</button>
      </div>
    </div>`;

  const sello = el.querySelector('.informe__sello');
  const datos = el.querySelector('[data-datos]');
  const rapido = !animado || movimientoReducido();

  await esperar(rapido ? 0 : 500);
  sello.classList.add('sello--estampar');
  reproducir('sello');
  await esperar(rapido ? 0 : 700);

  for (const [rotulo, valor] of filasInforme(estadisticas)) {
    datos.insertAdjacentHTML('beforeend', `<dt>${rotulo}</dt><dd></dd>`);
    const dd = datos.lastElementChild;
    if (rapido) dd.textContent = valor;
    else await escribir(dd, String(valor), { velocidad: 22 });
    await esperar(rapido ? 0 : 160);
  }
  const estado = el.querySelector('[data-estado]');
  const textoEstado = cerrado ? 'Investigación completada' : 'Investigación archivada sin resolver';
  if (rapido) estado.textContent = textoEstado;
  else await escribir(estado, textoEstado, { velocidad: 30 });

  // Logros, uno tras otro
  const vitrina = el.querySelector('[data-logros]');
  for (const logro of logros) {
    await esperar(rapido ? 0 : 600);
    vitrina.insertAdjacentHTML('beforeend', logroHTML(logro));
    reproducir('acceso');
  }

  await esperar(rapido ? 0 : 400);
  el.querySelector('[data-acciones]').hidden = false;
  el.querySelector('[data-accion="expediente"]').focus({ preventScroll: true });
  return esperarAccion(el);
}

// Teoría incorrecta con intentos disponibles
export function mostrarRechazo({ intentosRestantes, puntaje }) {
  const el = abrirCapa('presentacion--rechazo');
  el.innerHTML = `
    <div class="rechazo">
      <span class="sello sello--grande sello--sobre-oscuro sello--estampar">Teoría rechazada</span>
      <p class="rechazo__texto">La acusación no se sostiene con las pruebas presentadas.</p>
      <p class="rechazo__datos">
        Intentos restantes: <b>${intentosRestantes}</b> · Penalización: <b>−200 pts</b> · Puntaje: <b>${puntaje} pts</b>
      </p>
      <p class="rechazo__consejo">Vuelve a las declaraciones. Algo no encaja.</p>
      <button type="button" class="boton-terminal" data-accion="expediente">Volver al expediente</button>
    </div>`;
  reproducir('error');
  setTimeout(() => reproducir('sello'), 200);
  el.querySelector('[data-accion]').focus();
  return esperarAccion(el);
}
