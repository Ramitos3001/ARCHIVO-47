// FASE 3 · Central de investigación: perfil del investigador y expedientes
import { sesionActual, idInvestigador, esAdministrador } from './services/authService.js';
import { listarCasos, iniciarInvestigacion, armarExpedientes, ESTADO } from './services/caseService.js';
import { misPartidas, resumenInvestigador } from './services/progressService.js';
import { misLogros, catalogoLogros } from './services/achievementService.js';
import { montarBarra } from './components/barraSistema.js';
import { reproducir } from './sound.js';
import {
  avisar, animar, escapar, esperar, formatearFecha, duracionInvestigacion, movimientoReducido, salirHacia
} from './ui.js';

const $ = (id) => document.getElementById(id);
const archivador = $('archivador');
const dialogo = $('solicitud');
const hoja = $('solicitudHoja');

let usuario = null;
let expedientes = [];

// Pequeñas variaciones para que las carpetas no parezcan alineadas por máquina
const GIROS = [-1.4, 1.2, -0.5, 1.8, -2, 0.7];
const GIROS_SELLO = [-9, 7, -5, 11, -12, 6];

// ---------- Perfil ----------

function pintarCredencial(estadisticas) {
  const campos = {
    id: idInvestigador(usuario.idUsuario),
    nombre: usuario.nombre,
    resueltos: estadisticas?.resueltos ?? '…',
    precision: estadisticas?.precision ?? '…',
    logros: estadisticas?.logros ?? '…',
    activos: estadisticas?.activos ?? '…'
  };
  for (const [campo, valor] of Object.entries(campos)) {
    document.querySelector(`[data-campo="${campo}"]`).textContent = valor;
  }
  const firma = document.querySelector('[data-campo="firma"]');
  if (!firma.textContent) {
    firma.textContent = usuario.nombre;
    firma.classList.add('firmando');
  }
}

// Logros como medallas en la credencial: obtenidas en latón, pendientes en hueco
function pintarDistinciones(catalogo, obtenidos) {
  const contenedor = $('distinciones');
  if (!catalogo.length) {
    contenedor.closest('.distinciones').hidden = true;
    return;
  }
  const fechas = new Map(obtenidos.map((u) => [u.logro.idLogro, u.fechaObtencion]));
  contenedor.innerHTML = catalogo.map((logro) => {
    const fecha = fechas.get(logro.idLogro);
    const texto = fecha
      ? `${logro.nombre}: ${logro.descripcion} Obtenido el ${formatearFecha(fecha)}.`
      : `${logro.nombre} (pendiente): ${logro.descripcion}`;
    return `
      <button type="button" class="medalla${fecha ? ' medalla--obtenida' : ''}" data-logro="${escapar(texto)}"
              title="${escapar(texto)}" aria-label="${escapar(texto)}">${fecha ? '★' : '?'}</button>`;
  }).join('');
}

$('distinciones').addEventListener('click', (e) => {
  const medalla = e.target.closest('[data-logro]');
  if (medalla) avisar(medalla.dataset.logro);
});

// ---------- Expedientes ----------

function presentacion(exp) {
  const { estado, partida } = exp;
  if (estado === ESTADO.BLOQUEADO) {
    return { sello: 'Bloqueado', claseSello: 'sello--tinta', nota: `requiere cerrar el exp. ${exp.requisito}` };
  }
  if (estado === ESTADO.EN_INVESTIGACION) {
    return { sello: 'En investigación', claseSello: '', nota: `abierto el ${formatearFecha(partida.fechaInicio)}` };
  }
  if (estado === ESTADO.COMPLETADO) {
    return partida.estado === 'RESUELTA'
      ? { sello: 'Caso cerrado', claseSello: 'sello--tinta', nota: `${partida.puntaje} pts` }
      : { sello: 'Sin resolver', claseSello: '', nota: 'archivado' };
  }
  return { sello: 'Caso abierto', claseSello: 'sello--abierto', nota: 'sin revisar' };
}

const ETIQUETA_ESTADO = {
  [ESTADO.BLOQUEADO]: 'bloqueado',
  [ESTADO.DISPONIBLE]: 'disponible',
  [ESTADO.EN_INVESTIGACION]: 'en investigación',
  [ESTADO.COMPLETADO]: 'completado'
};

function carpetaHTML(exp, i) {
  const { caso, estado, numero } = exp;
  const p = presentacion(exp);
  const giro = GIROS[i % GIROS.length];
  const giroSello = GIROS_SELLO[i % GIROS_SELLO.length];

  return `
    <article class="carpeta carpeta--${estado}" style="--giro: ${giro}deg; --i: ${i}">
      <button type="button" class="carpeta__boton" data-indice="${i}"
              aria-label="Expediente número ${numero}, ${escapar(caso.titulo)}, ${ETIQUETA_ESTADO[estado]}">
        <span class="carpeta__pestana">EXP. ${numero}</span>
        <span class="carpeta__hoja" aria-hidden="true"></span>
        ${estado === ESTADO.EN_INVESTIGACION ? '<span class="clip carpeta__clip" aria-hidden="true"></span>' : ''}
        <span class="carpeta__tapa">
          <span class="carpeta__etiqueta">
            <span class="carpeta__referencia">Archivo 47 · Expediente Nº ${numero}</span>
            <span class="carpeta__titulo">${escapar(caso.titulo)}</span>
            <span class="carpeta__clasificacion">Dificultad: ${escapar(caso.dificultad)}</span>
          </span>
          <span class="sello ${p.claseSello} carpeta__sello" style="--giro-sello: ${giroSello}deg">${escapar(p.sello)}</span>
          <span class="carpeta__nota nota-mano">${escapar(p.nota)}</span>
        </span>
        ${estado === ESTADO.BLOQUEADO
          ? '<span class="carpeta__precinto" aria-hidden="true">Precinto de seguridad · No abrir · Precinto de seguridad · No abrir</span>'
          : ''}
      </button>
    </article>`;
}

function pintarExpedientes() {
  archivador.setAttribute('aria-busy', 'false');
  if (!expedientes.length) {
    archivador.innerHTML = '<p class="archivador__vacio">No hay expedientes en custodia.</p>';
    return;
  }
  archivador.innerHTML = expedientes.map(carpetaHTML).join('');
}

function pintarError(mensaje) {
  archivador.setAttribute('aria-busy', 'false');
  archivador.innerHTML = `
    <div class="archivador__vacio">
      <span>Fallo de comunicación con el archivo central: ${escapar(mensaje)}</span>
      <button type="button" class="boton-terminal" data-accion="reintentar">Reintentar</button>
    </div>`;
}

async function cargar() {
  try {
    const [casos, partidas, logros, catalogo] = await Promise.all([
      listarCasos(), misPartidas(), misLogros(), catalogoLogros().catch(() => [])
    ]);
    pintarDistinciones(catalogo, logros);
    expedientes = armarExpedientes(casos, partidas, esAdministrador(usuario));
    pintarCredencial({ ...resumenInvestigador(partidas), logros: logros.length });
    pintarExpedientes();
  } catch (e) {
    if (e.status === 401) {
      location.replace('acceso.html');
      return;
    }
    pintarError(e.message);
  }
}

// ---------- Hoja de solicitud ----------

function cabeceraHoja(formulario, exp, sello) {
  return `
    <p class="solicitud__formulario">${formulario}</p>
    ${sello}
    <h2 class="solicitud__numero" id="solicitudTitulo">Expediente Nº ${exp.numero}</h2>
    <p class="solicitud__titulo">${escapar(exp.caso.titulo)}</p>`;
}

function hojaApertura(exp) {
  return `
    ${cabeceraHoja('Formulario A-47 · Solicitud de apertura', exp,
      '<span class="sello sello--confidencial sello--estampar solicitud__sello" style="--retardo: .35s">Confidencial</span>')}
    <dl class="ficha-datos">
      <dt>Clasificación</dt><dd>${escapar(exp.caso.dificultad)}</dd>
      <dt>Estado</dt><dd>CASO ABIERTO</dd>
      <dt>Investigador asignado</dt><dd>${idInvestigador(usuario.idUsuario)}</dd>
    </dl>
    <p class="solicitud__resumen">${escapar(exp.caso.descripcion)}</p>
    <div class="solicitud__firma">
      <span class="firma" data-firma></span>
      <span class="rotulo">Firma del investigador</span>
    </div>
    <div class="solicitud__acciones">
      <button type="button" class="boton-tinta boton-tinta--suave" data-accion="cerrar">Cancelar</button>
      <button type="button" class="boton-tinta boton-tinta--rojo" data-accion="firmar">Firmar y abrir</button>
    </div>`;
}

function hojaEnCurso(exp) {
  return `
    ${cabeceraHoja('Registro de investigación en curso', exp,
      '<span class="sello sello--estampar solicitud__sello" style="--retardo: .35s">En investigación</span>')}
    <dl class="ficha-datos">
      <dt>Clasificación</dt><dd>${escapar(exp.caso.dificultad)}</dd>
      <dt>Abierto el</dt><dd>${formatearFecha(exp.partida.fechaInicio)}</dd>
      <dt>Investigador asignado</dt><dd>${idInvestigador(usuario.idUsuario)}</dd>
    </dl>
    <p class="solicitud__resumen">${escapar(exp.caso.descripcion)}</p>
    <div class="solicitud__acciones">
      <button type="button" class="boton-tinta boton-tinta--suave" data-accion="cerrar">Volver</button>
      <button type="button" class="boton-tinta boton-tinta--rojo" data-accion="continuar">Continuar investigación</button>
    </div>`;
}

function hojaCierre(exp) {
  const { partida } = exp;
  const resuelto = partida.estado === 'RESUELTA';
  return `
    ${cabeceraHoja('Informe de cierre', exp,
      `<span class="sello ${resuelto ? 'sello--tinta' : ''} sello--estampar solicitud__sello" style="--retardo: .35s">
        ${resuelto ? 'Caso cerrado' : 'Sin resolver'}</span>`)}
    <dl class="ficha-datos">
      <dt>Resultado</dt><dd>${resuelto ? 'RESUELTO' : 'NO RESUELTO'}</dd>
      <dt>Puntaje</dt><dd>${partida.puntaje}</dd>
      <dt>Apertura</dt><dd>${formatearFecha(partida.fechaInicio)}</dd>
      <dt>Cierre</dt><dd>${formatearFecha(partida.fechaFin)}</dd>
      <dt>Tiempo de investigación</dt><dd>${duracionInvestigacion(partida.fechaInicio, partida.fechaFin)}</dd>
    </dl>
    <div class="solicitud__acciones">
      <button type="button" class="boton-tinta boton-tinta--suave" data-accion="cerrar">Devolver al archivo</button>
      <button type="button" class="boton-tinta" data-accion="continuar">Consultar expediente</button>
    </div>`;
}

let expedienteAbierto = null;
let firmando = false;

function abrirHoja(exp) {
  expedienteAbierto = exp;
  const plantillas = {
    [ESTADO.DISPONIBLE]: hojaApertura,
    [ESTADO.EN_INVESTIGACION]: hojaEnCurso,
    [ESTADO.COMPLETADO]: hojaCierre
  };
  hoja.innerHTML = plantillas[exp.estado](exp);
  reproducir('carpeta');
  dialogo.showModal();
  setTimeout(() => reproducir('sello'), 380);
}

async function firmarApertura(boton) {
  const exp = expedienteAbierto;
  firmando = true;
  hoja.querySelectorAll('button').forEach((b) => { b.disabled = true; });

  const firma = hoja.querySelector('[data-firma]');
  firma.textContent = usuario.nombre;
  firma.classList.add('firmando');
  reproducir('papel');

  try {
    await iniciarInvestigacion(exp.caso.idCaso);
  } catch (e) {
    firmando = false;
    avisar(`No se pudo abrir el expediente: ${e.message}`, 'alerta');
    hoja.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    boton.focus();
    return;
  }

  await esperar(900);
  const sello = document.createElement('span');
  sello.className = 'sello sello--grande sello--estampar solicitud__resultado';
  sello.textContent = 'Investigación iniciada';
  hoja.append(sello);
  reproducir('sello');

  await esperar(1300);
  firmando = false;
  dialogo.close();
  abrirExpediente(exp);
}

// El expediente se acerca al centro mientras la mesa se oscurece, y se abre en expediente.html
function abrirExpediente(exp) {
  const url = `expediente.html?caso=${exp.caso.idCaso}`;
  const carpeta = archivador.querySelector(`[data-indice="${expedientes.indexOf(exp)}"]`)?.closest('.carpeta');
  if (!carpeta || movimientoReducido()) {
    location.href = url;
    return;
  }
  const r = carpeta.getBoundingClientRect();
  carpeta.style.setProperty('--dx', `${window.innerWidth / 2 - (r.left + r.width / 2)}px`);
  carpeta.style.setProperty('--dy', `${window.innerHeight / 2 - (r.top + r.height / 2)}px`);
  carpeta.classList.add('carpeta--acercandose');

  // Dentro de .central, para que la carpeta quede por encima de la oscuridad
  const fundido = document.createElement('div');
  fundido.className = 'central__fundido';
  carpeta.closest('.central').append(fundido);
  reproducir('carpeta');
  setTimeout(() => salirHacia(url, 'fundido'), 700);
}

// ---------- Eventos ----------

archivador.addEventListener('click', (e) => {
  if (e.target.closest('[data-accion="reintentar"]')) {
    archivador.innerHTML = '<p class="archivador__cargando">Recuperando expedientes<span class="cursor"></span></p>';
    cargar();
    return;
  }
  const boton = e.target.closest('.carpeta__boton');
  if (!boton) return;
  const exp = expedientes[Number(boton.dataset.indice)];

  if (exp.estado === ESTADO.BLOQUEADO) {
    animar(boton, 'anim-temblor');
    reproducir('error');
    avisar(`Acceso restringido. Cierra el Expediente Nº ${exp.requisito} para romper el precinto.`, 'alerta');
    return;
  }
  abrirHoja(exp);
});

hoja.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton) return;
  reproducir('click');
  const accion = boton.dataset.accion;
  if (accion === 'cerrar') dialogo.close();
  if (accion === 'firmar') firmarApertura(boton);
  if (accion === 'continuar') {
    dialogo.close();
    abrirExpediente(expedienteAbierto);
  }
});

// Clic fuera de la hoja la devuelve al archivo
dialogo.addEventListener('click', (e) => {
  if (e.target === dialogo && !firmando) dialogo.close();
});
// Mientras se firma, Esc no interrumpe
dialogo.addEventListener('cancel', (e) => {
  if (firmando) e.preventDefault();
});
dialogo.addEventListener('close', () => reproducir('papel'));

// ---------- Inicio ----------

async function iniciar() {
  usuario = await sesionActual().catch(() => null);
  if (!usuario) {
    location.replace('acceso.html');
    return;
  }
  montarBarra($('barra'), { titulo: 'Central de investigación' });
  pintarCredencial(null);
  await cargar();
}

iniciar();
