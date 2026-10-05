// CasoController (/api/casos) y PartidaController (/api/partidas/iniciar)
import { api } from './api.js';

export const listarCasos = () => api('/api/casos');

// Crea la partida o devuelve la existente (RN-02)
export const iniciarInvestigacion = (idCaso) =>
  api(`/api/partidas/iniciar/${idCaso}`, { method: 'POST' });

export const ESTADO = {
  BLOQUEADO: 'bloqueado',
  DISPONIBLE: 'disponible',
  EN_INVESTIGACION: 'en-investigacion',
  COMPLETADO: 'completado'
};

const RANGO_DIFICULTAD = { BASICA: 0, FACIL: 0, MEDIA: 1, INTERMEDIA: 1, AVANZADA: 2, DIFICIL: 2 };

const normalizar = (texto) =>
  (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

const rango = (caso) => RANGO_DIFICULTAD[normalizar(caso.dificultad)] ?? 9;

export const numeroExpediente = (indice) => String(indice + 1).padStart(3, '0');

// Estado de la partida tal como se escribe en los documentos
export function estadoDelCaso(partida) {
  if (partida?.estado === 'RESUELTA') return 'Caso cerrado';
  if (partida?.estado === 'FALLIDA') return 'Archivado sin resolver';
  return 'Caso abierto';
}

// Expediente de un caso concreto, con su número y estado, o null
export async function expedienteDeCaso(idCaso, partidas, sinBloqueos = false) {
  const casos = await listarCasos();
  return armarExpedientes(casos, partidas, sinBloqueos).find((e) => e.caso.idCaso === idCaso) || null;
}

// El backend no tiene casos bloqueados: el orden de juego es BÁSICA → MEDIA →
// AVANZADA y cada expediente se abre al cerrar (resuelto o no) el anterior.
// Un caso con partida nunca aparece bloqueado. El administrador ve todo abierto.
export function armarExpedientes(casos, partidas, sinBloqueos = false) {
  const partidaPorCaso = new Map(partidas.map((p) => [p.caso.idCaso, p]));
  const ordenados = [...casos].sort((a, b) => rango(a) - rango(b) || a.idCaso - b.idCaso);

  return ordenados.map((caso, i) => {
    const partida = partidaPorCaso.get(caso.idCaso) || null;
    const anterior = i > 0 ? partidaPorCaso.get(ordenados[i - 1].idCaso) : null;
    const anteriorCerrado = !!anterior && anterior.estado !== 'EN_CURSO';

    let estado;
    if (partida) {
      estado = partida.estado === 'EN_CURSO' ? ESTADO.EN_INVESTIGACION : ESTADO.COMPLETADO;
    } else if (i === 0 || anteriorCerrado || sinBloqueos) {
      estado = ESTADO.DISPONIBLE;
    } else {
      estado = ESTADO.BLOQUEADO;
    }

    return {
      caso,
      partida,
      estado,
      numero: numeroExpediente(i),
      requisito: i > 0 ? numeroExpediente(i - 1) : null
    };
  });
}
