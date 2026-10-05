// LogroController: /api/logros y /api/logros/mios
import { api } from './api.js';

export const catalogoLogros = () => api('/api/logros');

export const misLogros = () => api('/api/logros/mios');
