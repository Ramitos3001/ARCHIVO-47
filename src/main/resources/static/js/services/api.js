// Cliente HTTP común. La sesión viaja en la cookie JSESSIONID (mismo origen).

export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const MENSAJES_POR_ESTADO = {
  401: 'Sesión no válida',
  403: 'Acceso no autorizado',
  404: 'Registro no encontrado',
  500: 'Fallo interno del sistema'
};

export async function api(url, { method = 'GET', body } = {}) {
  const opciones = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(body);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new ApiError(0, 'Sin conexión con el archivo central');
  }

  const texto = await respuesta.text();
  let datos = null;
  if (texto) {
    try { datos = JSON.parse(texto); } catch { datos = texto; }
  }

  if (!respuesta.ok) {
    const mensaje = (datos && datos.error) || MENSAJES_POR_ESTADO[respuesta.status] || `Error ${respuesta.status}`;
    throw new ApiError(respuesta.status, mensaje);
  }
  return datos;
}
