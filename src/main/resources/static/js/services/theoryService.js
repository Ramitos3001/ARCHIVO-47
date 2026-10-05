// TeoriaController: /api/partidas/{idPartida}/teoria, /teorias, /solucion
import { api } from './api.js';

// → { acertijosResueltos, acertijosTotales, intentosUsados, intentosMaximos, solucionConfigurada, puedePresentar }
export const requisitosTeoria = (idPartida) => api(`/api/partidas/${idPartida}/teoria/requisitos`);

// Teorías ya presentadas en la partida (sospechoso, evidencia clave, móvil, correcta, fecha)
export const historialTeorias = (idPartida) => api(`/api/partidas/${idPartida}/teorias`);

// El backend evalúa el culpable y UNA evidencia clave; `movil` guarda el texto de la teoría.
// → { correcta, estado, intentosRestantes, puntaje, logrosNuevos, solucion }
export const presentarTeoria = (idPartida, { idSospechoso, idEvidenciaClave, movil }) =>
  api(`/api/partidas/${idPartida}/teoria`, { method: 'POST', body: { idSospechoso, idEvidenciaClave, movil } });

// Solo cuando la partida ya terminó (si no, 409)
export const solucionDePartida = (idPartida) => api(`/api/partidas/${idPartida}/solucion`);
