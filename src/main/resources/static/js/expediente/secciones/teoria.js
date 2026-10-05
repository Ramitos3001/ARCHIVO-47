// FASE 20 · Teoría del caso (§32): responsable, qué ocurrió y evidencias que la respaldan.
// El backend evalúa el responsable y la evidencia CLAVE; las demás evidencias de apoyo
// y el borrador se guardan en este navegador (a47.teoria.<idPartida>).
import { escapar, salirHacia, duracionInvestigacion } from '../../ui.js';
import { idInvestigador } from '../../services/authService.js';
import { misPartidas } from '../../services/progressService.js';
import { presentarTeoria, requisitosTeoria, historialTeorias, solucionDePartida } from '../../services/theoryService.js';
import { confirmarAcusacion, evaluar, mostrarInforme, mostrarRechazo } from '../presentacion.js';
import { retrato } from '../ilustraciones.js';
import { vacio, numero3, fecha, hora } from '../comun.js';

// ---------- Borrador ----------

const claveBorrador = (exp) => `a47.teoria.${exp.partida.idPartida}`;
function leerBorrador(exp) {
  try { return JSON.parse(localStorage.getItem(claveBorrador(exp)) || '{}'); } catch { return {}; }
}
function guardarBorrador(exp, borrador) {
  try { localStorage.setItem(claveBorrador(exp), JSON.stringify(borrador)); } catch { /* sin almacenamiento */ }
}

// ---------- Piezas ----------

function marcador(datos) {
  const r = datos.requisitos;
  return `
    <p class="marcador">
      ${r ? `Intentos <b>${r.intentosUsados} / ${r.intentosMaximos ?? '—'}</b> · Acertijos <b>${r.acertijosResueltos} / ${r.acertijosTotales}</b> · ` : ''}
      Puntaje <b data-puntaje>${datos.puntaje ?? '—'}</b> pts
    </p>
    <div class="teoria__progreso" data-progreso></div>`;
}

function historialHTML(datos, soloRechazadas) {
  const lista = soloRechazadas ? datos.teorias.filter((t) => !t.correcta) : datos.teorias;
  if (!lista.length) return '';
  return `
    <div class="teorias-previas">
      <p class="visor__rotulo">${soloRechazadas ? 'Teorías rechazadas' : 'Teorías presentadas'}</p>
      <ol>
        ${lista.map((t) => `
          <li class="teorias-previas__item${t.correcta ? ' teorias-previas__item--aceptada' : ''}">
            <span class="teorias-previas__fecha">${fecha(t.fecha)} · ${hora(t.fecha)}</span>
            Acusado: <b>${escapar(t.sospechoso?.nombre || '—')}</b>${t.evidenciaClave ? ` · Clave: ${escapar(t.evidenciaClave.nombre)}` : ''}
            <em>${t.correcta ? 'Aceptada' : 'Rechazada'}</em>
          </li>`).join('')}
      </ol>
    </div>`;
}

function formulario(exp, datos, bloqueado) {
  const b = leerBorrador(exp);
  const respaldo = new Set((b.respaldo || []).map(Number));
  return `
    <form class="teoria" novalidate>
      <fieldset class="teoria__grupo">
        <legend>¿Quién considera responsable?</legend>
        <div class="teoria__sospechosos">
          ${datos.sospechosos.map((s, i) => `
            <label class="teoria__sospechoso">
              <input type="radio" name="responsable" value="${s.idSospechoso}" ${b.responsable === s.idSospechoso ? 'checked' : ''}>
              <span class="teoria__retrato">${retrato(i)}</span>
              <span class="teoria__nombre">${escapar(s.nombre)}</span>
            </label>`).join('')}
        </div>
      </fieldset>

      <label class="teoria__rotulo" for="teoriaTexto">¿Qué ocurrió?</label>
      <textarea id="teoriaTexto" class="teoria__texto" name="texto" maxlength="1000" rows="5"
                placeholder="Reconstruye los hechos: quién, cómo, cuándo y por qué.">${escapar(b.texto || '')}</textarea>

      <fieldset class="teoria__grupo">
        <legend>Evidencias que respaldan la teoría</legend>
        <p class="teoria__ayuda">Marca las que la apoyan y señala cuál es la <b>clave</b>: la que demuestra la culpa.</p>
        ${datos.evidencias.map((e) => `
          <div class="teoria__evidencia">
            <label class="teoria__apoyo">
              <input type="checkbox" name="respaldo" value="${e.idEvidencia}" ${respaldo.has(e.idEvidencia) ? 'checked' : ''}>
              #${numero3(e.idEvidencia)} ${escapar(e.nombre)}
            </label>
            <label class="teoria__clave">
              <input type="radio" name="clave" value="${e.idEvidencia}" ${b.clave === e.idEvidencia && respaldo.has(e.idEvidencia) ? 'checked' : ''}
                     ${respaldo.has(e.idEvidencia) ? '' : 'disabled'}> Clave
            </label>
          </div>`).join('') || '<p class="teoria__ayuda">No hay evidencias disponibles.</p>'}
      </fieldset>

      <p class="teoria__error" data-error role="alert"></p>
      <button type="submit" class="boton-tinta boton-tinta--rojo teoria__presentar" ${bloqueado ? 'disabled' : ''}>Presentar teoría</button>
    </form>`;
}

function cerrada(exp, datos) {
  const resuelta = exp.partida.estado === 'RESUELTA';
  return `
    ${marcador(datos)}
    <div class="teoria-cerrada">
      <span class="sello sello--grande ${resuelta ? '' : 'sello--tinta'} teoria-cerrada__sello">${resuelta ? 'Caso cerrado' : 'Sin resolver'}</span>
      <p class="teoria-cerrada__texto">${resuelta ? 'La teoría fue aceptada. El caso está cerrado.' : 'Se agotaron los intentos. El caso quedó archivado.'}</p>
      ${historialHTML(datos, false)}
      <button type="button" class="boton-tinta" data-ver-informe>Ver informe de cierre</button>
    </div>`;
}

export function render({ exp, datos }) {
  if (exp.partida.estado !== 'EN_CURSO') return cerrada(exp, datos);
  const r = datos.requisitos;
  if (r && !r.solucionConfigurada) return `${marcador(datos)}${vacio('Este caso todavía no admite teorías.')}`;
  if (!datos.sospechosos.length) return vacio('No hay sospechosos a los que acusar.');
  const faltan = r ? r.acertijosResueltos < r.acertijosTotales : false;
  return `
    <p class="hoja__entradilla">No se trata de adivinar: acusa solo cuando las pruebas lo sostengan.</p>
    ${marcador(datos)}
    ${historialHTML(datos, true)}
    ${faltan ? `
      <div class="teoria__bloqueo" role="note">
        <p>Antes de acusar debes resolver todos los acertijos (${r.acertijosResueltos} de ${r.acertijosTotales}).
        Puedes ir preparando la teoría: se guarda sola.</p>
        <button type="button" class="boton-tinta boton-tinta--suave" data-ir-acertijos>Ir a los acertijos</button>
      </div>` : ''}
    ${formulario(exp, datos, faltan)}`;
}

// ---------- Estado tras presentar ----------

async function recargarEstado({ exp, datos }) {
  const id = exp.partida.idPartida;
  const [requisitos, teorias, partidas] = await Promise.all([
    requisitosTeoria(id).catch(() => datos.requisitos),
    historialTeorias(id).catch(() => datos.teorias),
    misPartidas().catch(() => null)
  ]);
  datos.requisitos = requisitos;
  datos.teorias = teorias;
  const partida = partidas?.find((p) => p.idPartida === id);
  if (partida) Object.assign(exp.partida, partida);
  if (exp.partida.puntaje != null) datos.puntaje = exp.partida.puntaje;
  document.querySelectorAll('[data-puntaje]').forEach((el) => { el.textContent = datos.puntaje; });
}

// Precisión = puntaje obtenido / puntaje máximo posible (base del caso + todos los acertijos)
function estadisticas({ exp, datos, usuario }, solucion, apoyos) {
  const maximo = (solucion?.puntajeBase || 0) + datos.acertijos.reduce((suma, a) => suma + (a.puntos || 0), 0);
  const puntaje = datos.puntaje ?? 0;
  return {
    investigador: idInvestigador(usuario.idUsuario),
    precision: maximo ? `${Math.round(Math.min(1, puntaje / maximo) * 100)} %` : '—',
    evidencias: apoyos || '—',
    pistas: datos.pistas.filter((p) => p.usada).length,
    tiempo: duracionInvestigacion(exp.partida.fechaInicio, exp.partida.fechaFin),
    puntaje
  };
}

function despues(accion) {
  if (accion === 'central') salirHacia('central.html', 'fundido');
  else location.reload(); // el expediente vuelve a abrirse ya cerrado: pistas y acertijos bloqueados
}

async function verInforme(contexto) {
  const { exp } = contexto;
  const solucion = await solucionDePartida(exp.partida.idPartida).catch(() => null);
  await recargarEstado(contexto);
  const accion = await mostrarInforme({
    tipo: exp.partida.estado === 'RESUELTA' ? 'cerrado' : 'archivado',
    numero: exp.numero,
    estadisticas: estadisticas(contexto, solucion, (leerBorrador(exp).respaldo || []).length),
    solucion,
    animado: false
  });
  if (accion === 'central') salirHacia('central.html', 'fundido');
}

async function entregar(contexto, form, teoria) {
  const { exp, datos } = contexto;
  const error = form.querySelector('[data-error]');
  const fallo = (texto) => {
    error.textContent = texto;
    error.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  if (!teoria.responsable) return fallo('Elige a quién consideras responsable.');
  if (teoria.texto.trim().length < 15) return fallo('Explica qué ocurrió: al menos una frase.');
  if (!teoria.respaldo.length) return fallo('Marca al menos una evidencia que respalde la teoría.');
  if (!teoria.clave) return fallo('Señala cuál de esas evidencias es la clave.');
  error.textContent = '';

  const r = datos.requisitos;
  const sospechoso = datos.sospechosos.find((s) => s.idSospechoso === teoria.responsable);
  const clave = datos.evidencias.find((e) => e.idEvidencia === teoria.clave);
  const confirmada = await confirmarAcusacion({
    numero: exp.numero,
    responsable: sospechoso.nombre,
    clave: `#${numero3(clave.idEvidencia)} ${clave.nombre}`,
    apoyos: teoria.respaldo.length,
    intentosRestantes: r?.intentosMaximos != null ? r.intentosMaximos - r.intentosUsados : null
  });
  if (!confirmada) return;

  let resultado;
  try {
    resultado = await evaluar(presentarTeoria(exp.partida.idPartida, {
      idSospechoso: teoria.responsable,
      idEvidenciaClave: teoria.clave,
      movil: teoria.texto.trim()
    }));
  } catch {
    await recargarEstado(contexto);
    contexto.refrescar('teoria');
    contexto.actualizarProgreso();
    return;
  }

  datos.puntaje = resultado.puntaje;
  await recargarEstado(contexto);
  exp.partida.estado = resultado.estado;

  if (resultado.estado === 'EN_CURSO') {
    await mostrarRechazo({ intentosRestantes: resultado.intentosRestantes, puntaje: resultado.puntaje });
    contexto.refrescar('teoria');
    contexto.actualizarProgreso();
    return;
  }

  const accion = await mostrarInforme({
    tipo: resultado.correcta ? 'cerrado' : 'archivado',
    numero: exp.numero,
    estadisticas: estadisticas(contexto, resultado.solucion, teoria.respaldo.length),
    solucion: resultado.solucion,
    logros: resultado.logrosNuevos || []
  });
  despues(accion);
}

// ---------- Eventos ----------

export function montar(hoja, contexto) {
  const { exp } = contexto;
  hoja.addEventListener('click', (e) => {
    if (e.target.closest('[data-ir-acertijos]')) contexto.navegar('acertijos');
    if (e.target.closest('[data-ver-informe]')) verInforme(contexto);
  });

  const form = hoja.querySelector('form.teoria');
  if (!form) return;

  const leer = () => ({
    responsable: Number(form.querySelector('[name="responsable"]:checked')?.value) || null,
    texto: form.elements.texto.value,
    respaldo: [...form.querySelectorAll('[name="respaldo"]:checked')].map((x) => Number(x.value)),
    clave: Number(form.querySelector('[name="clave"]:checked')?.value) || null
  });

  // La clave solo puede ser una evidencia marcada; si solo hay una marcada, es la clave
  const sincronizar = () => {
    form.querySelectorAll('.teoria__evidencia').forEach((fila) => {
      const apoyo = fila.querySelector('[name="respaldo"]');
      const clave = fila.querySelector('[name="clave"]');
      clave.disabled = !apoyo.checked;
      if (!apoyo.checked) clave.checked = false;
    });
    const marcadas = form.querySelectorAll('[name="respaldo"]:checked');
    if (marcadas.length === 1 && !form.querySelector('[name="clave"]:checked')) {
      form.querySelector(`[name="clave"][value="${marcadas[0].value}"]`).checked = true;
    }
    guardarBorrador(exp, leer());
  };

  form.addEventListener('change', sincronizar);
  form.addEventListener('input', () => guardarBorrador(exp, leer()));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    entregar(contexto, form, leer());
  });
}
