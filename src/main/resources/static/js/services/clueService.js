// PistaController: /api/partidas/{idPartida}/pistas
import { api } from './api.js';

// El texto solo llega en las pistas ya usadas
export const listarPistas = (idPartida) => api(`/api/partidas/${idPartida}/pistas`);

// Abre la siguiente pista en orden y descuenta su costo → { pista, restantes, puntaje }
export const usarPista = (idPartida) => api(`/api/partidas/${idPartida}/pistas/usar`, { method: 'POST' });
