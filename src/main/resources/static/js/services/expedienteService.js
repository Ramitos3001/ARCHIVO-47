// ExpedienteController: /api/casos/{idCaso}/expediente/*
// Requiere una partida iniciada en el caso (si no, 403).
import { api } from './api.js';

const SECCIONES = {
  sospechosos: 'sospechosos',
  evidencias: 'evidencias', // solo las visibles: las bloqueadas por acertijo no llegan
  documentos: 'documentos',
  mensajes: 'mensajes',
  llamadas: 'llamadas',
  ubicaciones: 'ubicaciones',
  declaraciones: 'declaraciones',
  lineaTiempo: 'linea-tiempo' // ordenada por fecha ascendente
};

export async function cargarExpediente(idCaso) {
  const claves = Object.keys(SECCIONES);
  const respuestas = await Promise.all(
    claves.map((clave) => api(`/api/casos/${idCaso}/expediente/${SECCIONES[clave]}`)));
  return Object.fromEntries(claves.map((clave, i) => [clave, respuestas[i] || []]));
}
