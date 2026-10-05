// AcertijoController: /api/partidas/{idPartida}/acertijos
import { api } from './api.js';

// Sin respuestas. evidenciasQueDesbloquea: cuántas evidencias siguen ocultas tras cada uno.
export const listarAcertijos = (idPartida) => api(`/api/partidas/${idPartida}/acertijos`);

// → { correcta, puntaje, evidenciasDesbloqueadas, logrosNuevos }
export const responderAcertijo = (idPartida, idAcertijo, respuesta) =>
  api(`/api/partidas/${idPartida}/acertijos/${idAcertijo}/responder`, { method: 'POST', body: { respuesta } });
