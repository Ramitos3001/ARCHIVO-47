// Expediente: una sola página con hojas internas.
// Carga → introducción (la primera vez) → la carpeta se acerca y se abre →
// portada → pasar páginas con el Hojeador. El tablero vive encima, en su propia capa.
import { sesionActual, idInvestigador, esAdministrador } from './services/authService.js';
import { expedienteDeCaso, estadoDelCaso } from './services/caseService.js';
import { misPartidas, obtenerPuntaje } from './services/progressService.js';
import { cargarExpediente } from './services/expedienteService.js';
import { listarAcertijos } from './services/puzzleService.js';
import { listarPistas } from './services/clueService.js';
import { montarBarra } from './components/barraSistema.js';
import { Hojeador } from './components/hojeador.js';
import { SECCIONES, construirHoja, rellenarHoja, folio } from './expediente/hojas.js';
import { iniciarTablero, mostrarBotonTablero } from './expediente/tablero.js';
import { marcarVisitada, pintarProgreso } from './expediente/progreso.js';
import { requisitosTeoria, historialTeorias } from './services/theoryService.js';
import { momentosDelCaso, reproducirIntro } from './expediente/intro.js';
import { reproducir } from './sound.js';
import { avisar, esperar, escapar, formatearFecha } from './ui.js';

const $ = (id) => document.getElementById(id);
const idCaso = Number(new URLSearchParams(location.search).get('caso'));

let usuario = null;
let exp = null;
let datos = null;
let hojeador = null;

// ---------- Memoria local de la introducción ----------

const claveIntro = () => `a47.intro.${exp.partida.idPartida}`;
function introVista() {
  try { return localStorage.getItem(claveIntro()) === 'vista'; } catch { return false; }
}
function marcarIntroVista() {
  try { localStorage.setItem(claveIntro(), 'vista'); } catch { /* sin almacenamiento */ }
}

// ---------- Construcción ----------

function construirTapa() {
  const { caso, partida, numero } = exp;
  $('tapa').innerHTML = `
    <div class="tapa__frente">
      <div class="tapa__etiqueta">
        <span class="tapa__referencia">Archivo 47 · Expediente Nº ${numero}</span>
        <span class="tapa__titulo">${escapar(caso.titulo)}</span>
        <span class="tapa__clasificacion">Dificultad: ${escapar(caso.dificultad)}</span>
      </div>
      <span class="sello sello--confidencial tapa__sello">Confidencial</span>
    </div>
    <div class="tapa__dorso">
      <p class="tapa__impreso">Archivo 47<br>Propiedad del departamento<br>No retirar de la central</p>
      <div class="tapa__prestamo papel">
        <p class="tapa__prestamo-titulo">Registro de consulta</p>
        <dl class="ficha-datos">
          <dt>Expediente</dt><dd>Nº ${numero}</dd>
          <dt>Investigador</dt><dd>${idInvestigador(usuario.idUsuario)}</dd>
          <dt>Apertura</dt><dd>${formatearFecha(partida.fechaInicio)}</dd>
          <dt>Estado</dt><dd>${escapar(estadoDelCaso(partida).toUpperCase())}</dd>
        </dl>
        <p class="nota-mano">${escapar(usuario.nombre)}</p>
      </div>
      <div class="tapa__progreso" data-progreso></div>
    </div>`;
}

// Lo que reciben todas las hojas: datos del caso y cómo moverse o repintar
let contexto = null;

// Va a la hoja de una sección; con `ancla`, además lleva la vista a ese elemento
async function navegar(idSeccion, ancla = null) {
  const indice = SECCIONES.findIndex((s) => s.id === idSeccion);
  if (indice < 0) return;
  await hojeador.irA(indice);
  const destino = ancla && document.getElementById(ancla);
  if (destino) {
    destino.scrollIntoView({ block: 'center', behavior: 'smooth' });
    destino.querySelector('input')?.focus({ preventScroll: true });
  }
}

// Vuelve a pintar hojas cuyo contenido cambió (p. ej. evidencias desbloqueadas)
function refrescar(...ids) {
  ids.forEach((id) => {
    const indice = SECCIONES.findIndex((s) => s.id === id);
    if (indice >= 0) rellenarHoja(hojeador.hojas[indice], SECCIONES[indice], indice, contexto);
  });
  actualizarProgreso();
}

const actualizarProgreso = () => pintarProgreso(contexto, SECCIONES.map((s) => s.id));

function construirHojas() {
  const contenedor = $('hojas');
  SECCIONES.forEach((seccion, i) => {
    contenedor.append(construirHoja(seccion, i, SECCIONES.length, contexto));
  });

  $('separadores').innerHTML = SECCIONES.map((s, i) =>
    `<button type="button" class="separador" data-ir="${i}" aria-current="${i === 0}">${escapar(s.pestana)}</button>`).join('');

  hojeador = new Hojeador(contenedor, { alCambiar: alCambiarHoja });
}

function alCambiarHoja(indice, hoja) {
  const seccion = SECCIONES[indice];
  $('folioActual').textContent = `Folio ${folio(indice)} / ${folio(SECCIONES.length - 1)}`;
  $('folioTitulo').textContent = seccion.titulo;
  document.querySelectorAll('.separador').forEach((boton, i) => {
    boton.setAttribute('aria-current', String(i === indice));
  });
  document.querySelector('[data-control="anterior"]').disabled = indice === 0;
  document.querySelector('[data-control="siguiente"]').disabled = indice === SECCIONES.length - 1;
  seccion.alMostrar?.(hoja);
  marcarVisitada(contexto, seccion.id);
  actualizarProgreso();
}

// ---------- Secuencias ----------

function textoDeCierre(primeraVez) {
  if (exp.partida.estado !== 'EN_CURSO') return estadoDelCaso(exp.partida);
  return primeraVez ? 'Investigación iniciada' : 'Investigación en curso';
}

let carpetaAbierta = false;

async function introduccion(primeraVez) {
  hojeador.habilitar(false);
  await reproducirIntro($('intro'), {
    momentos: momentosDelCaso(exp.caso, datos.lineaTiempo),
    numero: exp.numero,
    estado: textoDeCierre(primeraVez)
  });
  hojeador.habilitar(carpetaAbierta);
}

async function abrirCarpeta() {
  const carpeta = $('carpeta');
  $('luz').classList.remove('mesa__luz--apagada');

  // La carpeta se acerca a la luz…
  await esperar(250);
  carpeta.classList.remove('carpeta-abierta--oculta');
  reproducir('papel');
  await esperar(950);

  // …se abre…
  reproducir('carpeta');
  carpeta.classList.remove('carpeta-abierta--cerrada');
  await esperar(1250);
  $('tapa').classList.add('tapa--abierta');

  // …y aparece la primera hoja: los sellos golpean la portada
  $('mesaExpediente').classList.add('mesa-expediente--abierta');
  document.querySelectorAll('[data-sello-apertura]').forEach((sello) => {
    sello.classList.remove('sello--espera');
    sello.classList.add('sello--estampar');
  });
  reproducir('sello');
  setTimeout(() => reproducir('sello'), 550);

  carpetaAbierta = true;
  hojeador.habilitar(true);
  mostrarBotonTablero();
  alCambiarHoja(0, hojeador.hojaActual);
  await esperar(900);
  avisar(`Expediente Nº ${exp.numero} abierto`);
}

function mostrarFallo(mensaje) {
  $('intro').innerHTML = `
    <div class="intro__fallo" role="alert">
      <span>No se pudo recuperar el expediente — ${escapar(mensaje)}</span>
      <button type="button" class="boton-terminal">Volver a la central</button>
    </div>`;
  $('intro').querySelector('button').addEventListener('click', () => { location.href = 'central.html'; });
}

// ---------- Eventos ----------

$('separadores').addEventListener('click', (e) => {
  const boton = e.target.closest('[data-ir]');
  if (boton) hojeador.irA(Number(boton.dataset.ir));
});

$('controlFolios').addEventListener('click', (e) => {
  const boton = e.target.closest('[data-control]');
  if (!boton) return;
  if (boton.dataset.control === 'siguiente') hojeador.siguiente();
  else hojeador.anterior();
});

$('hojas').addEventListener('click', (e) => {
  if (e.target.closest('[data-accion="intro"]')) {
    reproducir('click');
    introduccion(false);
  }
});

// ---------- Inicio ----------

async function iniciar() {
  usuario = await sesionActual().catch(() => null);
  if (!usuario) {
    location.replace('acceso.html');
    return;
  }
  if (!idCaso) {
    location.replace('central.html');
    return;
  }

  try {
    const partidas = await misPartidas();
    exp = await expedienteDeCaso(idCaso, partidas, esAdministrador(usuario));
    // Sin partida no hay acceso al expediente: la apertura se firma en la central
    if (!exp?.partida) {
      location.replace('central.html');
      return;
    }
    const idPartida = exp.partida.idPartida;
    // Pistas, acertijos y puntaje son opcionales: si fallan, el expediente sigue abriendo
    const [expediente, acertijos, pistas, puntaje, requisitos, teorias] = await Promise.all([
      cargarExpediente(idCaso),
      listarAcertijos(idPartida).catch(() => []),
      listarPistas(idPartida).catch(() => []),
      obtenerPuntaje(idPartida).catch(() => null),
      requisitosTeoria(idPartida).catch(() => null),
      historialTeorias(idPartida).catch(() => [])
    ]);
    datos = {
      ...expediente, acertijos, pistas, requisitos, teorias,
      puntaje: puntaje?.total ?? null,
      nuevas: new Set()
    };
  } catch (e) {
    if (e.status === 401) {
      location.replace('acceso.html');
      return;
    }
    mostrarFallo(e.message);
    return;
  }

  document.title = `Archivo 47 · Expediente Nº ${exp.numero}`;
  montarBarra($('barra'), {
    titulo: `Expediente Nº ${exp.numero}`,
    volver: { texto: 'Central', url: 'central.html' }
  });
  contexto = { exp, datos, usuario, navegar, refrescar, actualizarProgreso };
  iniciarTablero(contexto);
  construirTapa();
  construirHojas();
  actualizarProgreso();

  if (introVista()) {
    $('intro').classList.add('intro--saliendo');
    setTimeout(() => { $('intro').hidden = true; }, 600);
  } else {
    await introduccion(true);
    marcarIntroVista();
  }
  await abrirCarpeta();
}

iniciar();
