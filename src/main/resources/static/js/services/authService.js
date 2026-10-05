// AuthController: /api/auth/registro, /login, /logout, /me
import { api } from './api.js';

export const login = (correo, contrasena) =>
  api('/api/auth/login', { method: 'POST', body: { correo, contrasena } });

export const registro = (nombre, correo, contrasena) =>
  api('/api/auth/registro', { method: 'POST', body: { nombre, correo, contrasena } });

// Si la sesión ya expiró el backend responde 401; para el jugador da igual
export const logout = () =>
  api('/api/auth/logout', { method: 'POST' }).catch(() => null);

// Usuario autenticado o null si no hay sesión
export async function sesionActual() {
  try {
    return await api('/api/auth/me');
  } catch (e) {
    if (e.status === 401) return null;
    throw e;
  }
}

// INV-0047 a partir del id de usuario
export const idInvestigador = (idUsuario) => 'INV-' + String(idUsuario).padStart(4, '0');

export const esAdministrador = (usuario) => usuario?.rol === 'ADMINISTRADOR';
