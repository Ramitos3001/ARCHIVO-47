// FASE 9 · Evidencias: objetos en bolsas, EXAMINAR con zoom y análisis,
// y las bloqueadas por acertijo con su requisito.
import { escapar, escribir, esperar, movimientoReducido } from '../../ui.js';
import { reproducir } from '../../sound.js';
import { abrirVisor, activarLupa } from '../../components/visor.js';
import { ilustracionEvidencia, candado } from '../ilustraciones.js';
import { botonTablero } from '../tablero.js';
import { vacio, numero2, numero3, recortar, detallesEn, resaltar, personasEn, marcas } from '../comun.js';

const examinadas = (exp) => marcas('examinadas', exp.partida.idPartida);

// Una entrada por cada evidencia que sigue oculta tras un acertijo sin resolver
function bloqueadas(acertijos) {
  const lista = [];
  acertijos.forEach((a, i) => {
    if (a.resuelto) return;
    for (let k = 0; k < (a.evidenciasQueDesbloquea || 0); k++) lista.push({ acertijo: a, numero: i + 1 });
  });
  return lista;
}

function bolsa(e, analizada, nueva) {
  return `
    <button type="button" class="bolsa${analizada ? ' bolsa--examinada' : ''}${nueva ? ' bolsa--nueva' : ''}" data-evidencia="${e.idEvidencia}">
      <span class="bolsa__cierre" aria-hidden="true"></span>
      ${nueva ? '<span class="bolsa__nueva">Nueva</span>' : ''}
      <span class="bolsa__objeto">${ilustracionEvidencia(e)}</span>
      <span class="bolsa__etiqueta">
        <b>Evidencia #${numero3(e.idEvidencia)}</b>
        <span class="bolsa__nombre">${escapar(e.nombre)}</span>
        <span class="bolsa__tipo">${escapar(e.tipo)}</span>
      </span>
      <span class="bolsa__accion">${analizada ? 'Analizada' : 'Examinar'}</span>
    </button>`;
}

function bolsaBloqueada({ acertijo, numero }) {
  return `
    <button type="button" class="bolsa bolsa--bloqueada" data-ir-acertijo="${acertijo.idAcertijo}"
            aria-label="Evidencia bloqueada. Requisito: resolver el acertijo número ${numero}. Ir al acertijo">
      <span class="bolsa__cierre" aria-hidden="true"></span>
      <span class="bolsa__objeto bolsa__objeto--oculto">${candado()}</span>
      <span class="bolsa__etiqueta">
        <b>Evidencia bloqueada</b>
        <span class="bolsa__requisito">Requisito: resolver el acertijo Nº ${numero2(numero)}</span>
        <span class="bolsa__pregunta">«${escapar(recortar(acertijo.pregunta, 80))}»</span>
      </span>
      <span class="bolsa__accion bolsa__accion--ir">Ir al acertijo</span>
    </button>`;
}

export function render({ exp, datos }) {
  const ocultas = bloqueadas(datos.acertijos);
  if (!datos.evidencias.length && !ocultas.length) return vacio('No hay evidencias registradas.');
  const marcadas = examinadas(exp);
  return `
    <p class="hoja__entradilla">
      ${datos.evidencias.length} ${datos.evidencias.length === 1 ? 'evidencia disponible' : 'evidencias disponibles'}${ocultas.length
        ? ` · <span class="rojo">${ocultas.length} ${ocultas.length === 1 ? 'bloqueada' : 'bloqueadas'}</span>` : ''}.
      Examina cada objeto: los detalles importan.
    </p>
    <div class="bolsas">
      ${datos.evidencias.map((e) => bolsa(e, marcadas.tiene(e.idEvidencia), datos.nuevas.has(e.idEvidencia))).join('')}
      ${ocultas.map(bolsaBloqueada).join('')}
    </div>`;
}

export function montar(hoja, contexto) {
  hoja.addEventListener('click', (e) => {
    const bloqueada = e.target.closest('[data-ir-acertijo]');
    if (bloqueada) {
      contexto.navegar('acertijos', `acertijo-${bloqueada.dataset.irAcertijo}`);
      return;
    }
    const boton = e.target.closest('[data-evidencia]');
    if (boton) examinar(contexto, Number(boton.dataset.evidencia), hoja);
  });
}

// El visor es único: si se abre otro documento, el análisis anterior se abandona
let turno = 0;

async function examinar(contexto, id, hoja) {
  const { exp, datos } = contexto;
  const mio = ++turno;
  const e = datos.evidencias.find((x) => x.idEvidencia === id);
  const registro = examinadas(exp);
  const yaAnalizada = registro.tiene(id);
  const detalles = detallesEn(e.descripcion || '');
  const personas = personasEn(`${e.nombre} ${e.descripcion}`, datos.sospechosos);

  const raiz = abrirVisor(`
    <header class="visor__encabezado">
      <span>Archivo 47 · Expediente Nº ${exp.numero}</span><span>Evidencia #${numero3(e.idEvidencia)}</span>
    </header>
    <h2 class="visor__titulo">${escapar(e.nombre)}</h2>
    <div class="examen">
      <div class="lupa" title="Clic para ampliar">${ilustracionEvidencia(e)}</div>
      <button type="button" class="boton-tinta boton-tinta--suave examen__lupa" data-lupa aria-pressed="false">+ Ampliar</button>
    </div>
    <dl class="ficha-datos">
      <dt>Evidencia</dt><dd>#${numero3(e.idEvidencia)}</dd>
      <dt>Tipo</dt><dd>${escapar(e.tipo)}</dd>
      <dt>Estado</dt><dd data-estado>${yaAnalizada ? 'ANALIZADA' : 'EN ANÁLISIS'}</dd>
    </dl>
    <p class="visor__rotulo">Análisis</p>
    <div class="analisis" data-analisis>
      <span class="analisis__barra"><span></span></span>
      <span class="analisis__texto">Analizando evidencia…</span>
    </div>
    <p class="visor__texto visor__texto--maquina" data-descripcion></p>
    <div data-resultado></div>`,
  { clase: 'visor--evidencia', etiqueta: `Evidencia ${e.nombre}` });

  activarLupa(raiz);
  const analisis = raiz.querySelector('[data-analisis]');
  const descripcion = raiz.querySelector('[data-descripcion]');
  const texto = e.descripcion || 'Sin descripción registrada.';

  if (yaAnalizada || movimientoReducido()) {
    analisis.classList.add('analisis--completo');
  } else {
    analisis.classList.add('analisis--en-curso');
    await esperar(1300);
    if (mio !== turno) return;
    analisis.classList.replace('analisis--en-curso', 'analisis--completo');
    await escribir(descripcion, texto, { velocidad: 14, saltar: () => mio !== turno });
    if (mio !== turno) return;
  }
  analisis.querySelector('.analisis__texto').textContent = 'Análisis completado';
  descripcion.innerHTML = resaltar(texto, detalles);
  raiz.querySelector('[data-estado]').textContent = 'ANALIZADA';

  raiz.querySelector('[data-resultado]').innerHTML = `
    ${detalles.length ? `
      <p class="visor__rotulo">Detalles detectados</p>
      <ul class="detalles">${detalles.map((d) => `<li><span>${d.tipo}</span> ${escapar(d.valor)}</li>`).join('')}</ul>` : ''}
    <p class="visor__rotulo">Relacionado con</p>
    <p class="visor__texto">${personas.length ? personas.map((p) => escapar(p.nombre)).join(', ') : 'Sin personas identificadas.'}</p>
    <div class="visor__acciones visor__acciones--pie">
      <span class="sello sello--tinta sello--estampar visor__sello-pie">Analizada</span>
      ${botonTablero(`e${e.idEvidencia}`)}
    </div>`;
  if (detalles.length && !yaAnalizada) reproducir('acceso');
  reproducir('sello');

  if (!yaAnalizada) {
    registro.agregar(id);
    contexto.actualizarProgreso?.();
    const enHoja = hoja.querySelector(`[data-evidencia="${id}"]`);
    enHoja?.classList.add('bolsa--examinada');
    if (enHoja) enHoja.querySelector('.bolsa__accion').textContent = 'Analizada';
  }
}
