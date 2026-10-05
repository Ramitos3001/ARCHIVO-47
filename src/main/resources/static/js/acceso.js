// FASE 2 · Acceso: arranque de terminal, identificación, alta y autorización
import { login, registro, sesionActual, idInvestigador } from './services/authService.js';
import { alternarSonido, sonidoActivo, reproducir } from './sound.js';
import { escribir, esperar, salirHacia, animar, formatearHora, movimientoReducido } from './ui.js';

const $ = (id) => document.getElementById(id);

const ARRANQUE = [
  { texto: 'Archivo 47 · Sistema de investigadores v4.7', clase: 'titulo' },
  { texto: 'Departamento de casos no resueltos', clase: 'tenue' },
  { texto: 'Iniciando terminal', estado: 'OK' },
  { texto: 'Estableciendo conexión cifrada', estado: 'OK' },
  { texto: 'Verificando integridad del archivo', estado: 'OK' },
  { texto: 'Expedientes en custodia', estado: '047' },
  { texto: 'Nivel de seguridad', estado: 'RESTRINGIDO', alerta: true }
];

// Pulsar una tecla o hacer clic acelera la secuencia
let prisa = false;
const conPrisa = () => prisa;
const apurar = () => { prisa = true; };

// Escribe una línea "ETIQUETA ........ ESTADO" en un contenedor
async function lineaSistema(contenedor, { texto, estado, clase, alerta }, velocidad = 14) {
  const linea = document.createElement('div');
  linea.className = 'linea-sistema' + (clase ? ` linea-sistema--${clase}` : '');
  const etiqueta = document.createElement('span');
  linea.append(etiqueta);
  contenedor.append(linea);
  await escribir(etiqueta, texto, { velocidad, saltar: conPrisa });

  if (estado) {
    const guia = document.createElement('span');
    guia.className = 'linea-sistema__guia';
    const valor = document.createElement('span');
    valor.className = 'linea-sistema__estado' + (alerta ? ' linea-sistema__estado--alerta' : '');
    linea.append(guia, valor);
    await esperar(prisa ? 0 : 160);
    valor.textContent = estado;
    reproducir(alerta ? 'error' : 'click');
  }
  await esperar(prisa ? 0 : 90);
}

function iniciarReloj() {
  const reloj = $('reloj');
  const pintar = () => {
    const ahora = new Date();
    const dos = (n) => String(n).padStart(2, '0');
    reloj.textContent = `${dos(ahora.getDate())}.${dos(ahora.getMonth() + 1)}.${ahora.getFullYear()} · ${formatearHora(ahora)}`;
  };
  pintar();
  setInterval(pintar, 1000);
}

function iniciarBotonSonido() {
  const boton = $('botonSonido');
  const pintar = () => {
    boton.textContent = sonidoActivo() ? 'Sonido: on' : 'Sonido: off';
    boton.setAttribute('aria-pressed', String(sonidoActivo()));
  };
  pintar();
  boton.addEventListener('click', () => { alternarSonido(); pintar(); });
}

async function arrancar() {
  // En la misma pestaña el arranque completo se ve una sola vez
  try {
    prisa = sessionStorage.getItem('a47.arranque') === 'visto';
    sessionStorage.setItem('a47.arranque', 'visto');
  } catch { /* sin almacenamiento */ }

  document.addEventListener('keydown', apurar, { once: true });
  document.addEventListener('pointerdown', apurar, { once: true });

  const sesion = sesionActual().catch(() => null);
  const arranque = $('arranque');
  for (const linea of ARRANQUE) await lineaSistema(arranque, linea);
  document.removeEventListener('keydown', apurar);
  document.removeEventListener('pointerdown', apurar);

  const usuario = await sesion;
  if (usuario) {
    await lineaSistema(arranque, { texto: 'Sesión activa detectada', estado: idInvestigador(usuario.idUsuario) });
    await esperar(700);
    salirHacia('central.html');
    return;
  }

  $('panelAcceso').hidden = false;
  if (!movimientoReducido()) $('loginCorreo').focus({ preventScroll: true });
}

// ---------- Identificación / alta ----------

let modoRegistro = false;

function cambiarModo() {
  modoRegistro = !modoRegistro;
  $('formLogin').hidden = modoRegistro;
  $('formRegistro').hidden = !modoRegistro;
  $('textoCambio').textContent = modoRegistro ? '¿Ya tienes credencial?' : '¿Nuevo investigador?';
  $('botonCambio').textContent = modoRegistro ? 'Identificarse' : 'Registrarse';
  $('mensajeError').textContent = '';
  reproducir('click');
  $(modoRegistro ? 'registroNombre' : 'loginCorreo').focus();
}

function denegar(motivo) {
  $('mensajeError').textContent = `Acceso denegado — ${motivo}`;
  animar($('panelAcceso'), 'anim-temblor');
  reproducir('error');
}

function ocupado(formulario, estado) {
  formulario.querySelectorAll('input, button').forEach((el) => { el.disabled = estado; });
  $('botonCambio').disabled = estado;
}

async function alIdentificarse(evento) {
  evento.preventDefault();
  const correo = $('loginCorreo').value.trim();
  const clave = $('loginClave').value;
  if (!correo || !clave) return denegar('identificación y contraseña requeridas');

  ocupado(evento.target, true);
  try {
    const usuario = await login(correo, clave);
    await autorizar(usuario);
  } catch (e) {
    ocupado(evento.target, false);
    denegar(e.message);
    $('loginClave').select();
  }
}

async function alSolicitarAlta(evento) {
  evento.preventDefault();
  const nombre = $('registroNombre').value.trim();
  const correo = $('registroCorreo').value.trim();
  const clave = $('registroClave').value;
  if (!nombre || !correo || !clave) return denegar('todos los campos son obligatorios');
  if (clave.length < 6) return denegar('la contraseña debe tener mínimo 6 caracteres');

  ocupado(evento.target, true);
  let usuario;
  try {
    usuario = await registro(nombre, correo, clave);
  } catch (e) {
    ocupado(evento.target, false);
    return denegar(e.message);
  }

  // El registro no abre sesión: se identifica automáticamente
  const sesionAbierta = await login(correo, clave).then(() => true, () => false);
  await imprimirFicha(usuario, sesionAbierta);
}

// ---------- Resultado ----------

async function autorizar(usuario) {
  $('panelAcceso').hidden = true;
  $('panelAutorizacion').hidden = false;
  prisa = false;

  const lineas = $('lineasAutorizacion');
  await lineaSistema(lineas, { texto: '> Verificando credenciales', estado: 'OK' }, 18);
  await lineaSistema(lineas, { texto: '> Cotejando registro de acceso', estado: 'OK' }, 18);

  $('accesoAutorizado').hidden = false;
  reproducir('acceso');
  await esperar(900);
  await escribir($('investigadorIdentificado'), 'Investigador identificado', { velocidad: 30 });
  await escribir($('investigadorDatos'), `${idInvestigador(usuario.idUsuario)} · ${usuario.nombre}`, { velocidad: 30 });
  await esperar(1300);
  salirHacia('central.html');
}

async function imprimirFicha(usuario, sesionAbierta) {
  $('panelAcceso').hidden = true;
  $('panelAutorizacion').hidden = false;
  prisa = false;

  const lineas = $('lineasAutorizacion');
  await lineaSistema(lineas, { texto: '> Procesando solicitud de alta', estado: 'OK' }, 18);
  await lineaSistema(lineas, { texto: '> Asignando identificador', estado: idInvestigador(usuario.idUsuario) }, 18);
  await lineaSistema(lineas, { texto: '> Imprimiendo credencial', estado: '...' }, 18);

  $('altaId').textContent = idInvestigador(usuario.idUsuario);
  $('altaNombre').textContent = usuario.nombre;
  $('ranura').hidden = false;
  reproducir('papel');
  setTimeout(() => reproducir('sello'), movimientoReducido() ? 0 : 1700);

  const boton = $('botonCentral');
  if (!sesionAbierta) boton.textContent = 'Identificarse →';
  boton.addEventListener('click', () => {
    reproducir('click');
    if (sesionAbierta) {
      salirHacia('central.html');
    } else {
      location.reload();
    }
  });
  await esperar(1800);
  boton.focus({ preventScroll: true });
  $('ranura').scrollIntoView({ behavior: movimientoReducido() ? 'auto' : 'smooth', block: 'center' });
}

// ---------- Arranque ----------

iniciarReloj();
iniciarBotonSonido();
$('botonCambio').addEventListener('click', cambiarModo);
$('formLogin').addEventListener('submit', alIdentificarse);
$('formRegistro').addEventListener('submit', alSolicitarAlta);
arrancar();
