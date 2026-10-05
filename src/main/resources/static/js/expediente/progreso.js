// FASE 22 · Progreso discreto de la investigación (concepto §36).
// Mide lo que el investigador ha hecho, no lo que ha acertado:
//   30 % hojas consultadas · 30 % evidencias examinadas · 30 % acertijos resueltos
//   10 % caso cerrado (resuelto o archivado)
import { marcas } from './comun.js';

const CELDAS = 18;
// Hojas que cuentan como "consultadas" (la portada se ve siempre)
const NO_CUENTAN = new Set(['portada']);

export function marcarVisitada(contexto, idSeccion) {
  marcas('visitadas', contexto.exp.partida.idPartida).agregar(idSeccion);
}

export function calcularProgreso({ exp, datos }, idsSecciones) {
  const idPartida = exp.partida.idPartida;
  const contables = idsSecciones.filter((id) => !NO_CUENTAN.has(id));
  const visitadas = new Set(marcas('visitadas', idPartida).todas());
  const examinadas = new Set(marcas('examinadas', idPartida).todas());

  const proporcion = (hechos, total) => (total ? Math.min(1, hechos / total) : 1);
  const hojas = proporcion(contables.filter((id) => visitadas.has(id)).length, contables.length);
  const evidencias = proporcion(datos.evidencias.filter((e) => examinadas.has(String(e.idEvidencia))).length, datos.evidencias.length);
  const acertijos = proporcion(datos.acertijos.filter((a) => a.resuelto).length, datos.acertijos.length);
  const cerrado = exp.partida.estado === 'EN_CURSO' ? 0 : 1;

  return {
    porcentaje: Math.round((hojas * .3 + evidencias * .3 + acertijos * .3 + cerrado * .1) * 100),
    detalle: `Hojas ${Math.round(hojas * 100)} % · Evidencias ${Math.round(evidencias * 100)} % · Acertijos ${Math.round(acertijos * 100)} %`
  };
}

// INVESTIGACIÓN ██████████░░░░░░ 62 %
export function barraProgreso({ porcentaje, detalle }) {
  const llenas = Math.round((porcentaje / 100) * CELDAS);
  return `
    <span class="progreso" role="img" aria-label="Investigación al ${porcentaje} por ciento. ${detalle}" title="${detalle}">
      <span class="progreso__rotulo">Investigación</span>
      <span class="progreso__barra" aria-hidden="true">${'█'.repeat(llenas)}<span>${'░'.repeat(CELDAS - llenas)}</span></span>
      <span class="progreso__cifra">${porcentaje} %</span>
    </span>`;
}

export function pintarProgreso(contexto, idsSecciones) {
  const html = barraProgreso(calcularProgreso(contexto, idsSecciones));
  document.querySelectorAll('[data-progreso]').forEach((el) => { el.innerHTML = html; });
}
