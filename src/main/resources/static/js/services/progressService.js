// PartidaController: /api/partidas/mias
import { api } from './api.js';

export const misPartidas = () => api('/api/partidas/mias');

// PuntajeController: desglose del puntaje de una partida → { ..., total }
export const obtenerPuntaje = (idPartida) => api(`/api/partidas/${idPartida}/puntaje`);

// Estadísticas del perfil. Precisión = resueltos / casos cerrados.
export function resumenInvestigador(partidas) {
  const resueltos = partidas.filter((p) => p.estado === 'RESUELTA').length;
  const fallidos = partidas.filter((p) => p.estado === 'FALLIDA').length;
  const activos = partidas.filter((p) => p.estado === 'EN_CURSO').length;
  const cerrados = resueltos + fallidos;
  return {
    resueltos,
    activos,
    precision: cerrados ? Math.round((resueltos / cerrados) * 100) + '%' : '—'
  };
}
