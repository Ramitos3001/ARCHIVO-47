// Utilidades compartidas por las hojas del expediente
import { escapar, formatearFecha } from '../ui.js';

const dos = (n) => String(n).padStart(2, '0');

export const numero2 = (n) => dos(n);
export const numero3 = (n) => String(n).padStart(3, '0');
export const fecha = formatearFecha;

export function hora(iso) {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? '--:--' : `${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

const msDe = (iso) => new Date(iso).getTime() || 0;
export const porFecha = (campo) => (a, b) => msDe(a[campo]) - msDe(b[campo]);

// 0 segundos = llamada perdida
export function duracionLlamada(segundos) {
  if (!segundos) return null;
  return `${dos(Math.floor(segundos / 60))}:${dos(segundos % 60)}`;
}

export function recortar(texto = '', max = 90) {
  return texto.length > max ? `${texto.slice(0, max - 1).trimEnd()}…` : texto;
}

export const vacio = (texto) => `
  <div class="vacio">
    <p class="vacio__texto">${escapar(texto)}</p>
    <span class="sello sello--tinta vacio__sello">Sin registros</span>
  </div>`;

// ---------- Personas ----------

const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function contiene(texto, frase) {
  const patron = new RegExp(`(^|[^a-z0-9])${escRegex(normalizar(frase))}($|[^a-z0-9])`);
  return patron.test(normalizar(texto));
}

// Por nombre completo, o por nombre de pila si ningún otro sospechoso lo comparte
export function apareceEn(sospechoso, texto, sospechosos) {
  if (!texto) return false;
  if (contiene(texto, sospechoso.nombre)) return true;
  const pila = sospechoso.nombre.split(/\s+/)[0];
  const compartido = sospechosos.filter((s) => normalizar(s.nombre.split(/\s+/)[0]) === normalizar(pila)).length > 1;
  return !compartido && pila.length > 2 && contiene(texto, pila);
}

export const personasEn = (texto, sospechosos) => sospechosos.filter((s) => apareceEn(s, texto, sospechosos));

export function relacionesDe(sospechoso, datos) {
  const en = (texto) => apareceEn(sospechoso, texto, datos.sospechosos);
  return {
    mensajes: datos.mensajes.filter((m) => en(m.remitente) || en(m.destinatario) || en(m.contenido)),
    llamadas: datos.llamadas.filter((l) => en(l.origen) || en(l.destino) || en(l.transcripcion)),
    declaraciones: datos.declaraciones.filter((d) => en(d.contenido)),
    documentos: datos.documentos.filter((d) => en(d.titulo) || en(d.contenido)),
    evidencias: datos.evidencias.filter((e) => en(e.nombre) || en(e.descripcion)),
    ubicaciones: datos.ubicaciones.filter((u) => en(u.nombre) || en(u.descripcion))
  };
}

// "Nombre: «texto»" → { persona, texto }
export function partirDeclaracion(contenido = '') {
  const m = contenido.match(/^([^:«"\n]{3,60}):\s*([\s\S]+)$/);
  const persona = m ? m[1].trim() : null;
  const texto = (m ? m[2] : contenido).trim().replace(/^[«"“]\s*/, '').replace(/\s*[»"”]$/, '');
  return { persona, texto };
}

// Texto de documento: saltos de línea y [TACHADO] como barra de tinta
export function textoDocumento(contenido = '') {
  return escapar(contenido)
    .replace(/\[TACHADO\]/g, '<span class="censurado" aria-hidden="true">████████</span><span class="solo-lectores">[tachado]</span>')
    .replace(/\n/g, '<br>');
}

// Horas y citas textuales legibles en una descripción
export function detallesEn(texto = '') {
  const vistos = new Set();
  const detalles = [];
  const agregar = (tipo, valor) => {
    if (!vistos.has(valor)) {
      vistos.add(valor);
      detalles.push({ tipo, valor });
    }
  };
  for (const m of texto.matchAll(/\b([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?\b/g)) agregar('Hora', m[0]);
  for (const m of texto.matchAll(/[«"“]([^»"”]{3,90})[»"”]/g)) agregar('Texto legible', m[1]);
  return detalles;
}

// Texto escapado con los detalles resaltados
export function resaltar(texto, detalles) {
  let html = escapar(texto);
  for (const { valor } of detalles) {
    html = html.split(escapar(valor)).join(`<mark class="resaltado">${escapar(valor)}</mark>`);
  }
  return html;
}

// ---------- Marcas del jugador (solo en este navegador) ----------

export function marcas(tipo, idPartida) {
  const clave = `a47.${tipo}.${idPartida}`;
  const leer = () => {
    try { return new Set(JSON.parse(localStorage.getItem(clave) || '[]')); } catch { return new Set(); }
  };
  const guardar = (conjunto) => {
    try { localStorage.setItem(clave, JSON.stringify([...conjunto])); } catch { /* sin almacenamiento */ }
  };
  return {
    tiene: (id) => leer().has(String(id)),
    todas: () => [...leer()],
    agregar(id) {
      const s = leer();
      s.add(String(id));
      guardar(s);
    },
    alternar(id) {
      const s = leer();
      const k = String(id);
      const ahora = !s.has(k);
      if (ahora) s.add(k);
      else s.delete(k);
      guardar(s);
      return ahora;
    }
  };
}

// ---------- Registros comparables (declaraciones, cronología) ----------

// Cada registro del expediente reducido a algo que se puede leer al lado de otro
export function registrosComparables(datos) {
  const r = [];
  datos.mensajes.forEach((m) => r.push({
    clave: `m${m.idMensaje}`, grupo: 'Mensajes',
    etiqueta: `${hora(m.fecha)} · ${m.remitente} → ${m.destinatario}`,
    titulo: `Mensaje · ${fecha(m.fecha)} ${hora(m.fecha)}`,
    texto: `${m.remitente} → ${m.destinatario}: «${m.contenido}»`
  }));
  datos.llamadas.forEach((l) => r.push({
    clave: `l${l.idLlamada}`, grupo: 'Llamadas',
    etiqueta: `${hora(l.fecha)} · ${l.origen} → ${l.destino}`,
    titulo: `Llamada · ${fecha(l.fecha)} ${hora(l.fecha)}`,
    texto: `${l.origen} → ${l.destino}. ${duracionLlamada(l.duracion) ? `Duración ${duracionLlamada(l.duracion)}.` : 'Llamada perdida.'} ${l.transcripcion || ''}`
  }));
  datos.documentos.forEach((d) => r.push({
    clave: `d${d.idDocumento}`, grupo: 'Documentos',
    etiqueta: d.titulo,
    titulo: `Documento · ${d.titulo}`,
    texto: d.contenido,
    documento: true
  }));
  datos.evidencias.forEach((e) => r.push({
    clave: `e${e.idEvidencia}`, grupo: 'Evidencias',
    etiqueta: `#${numero3(e.idEvidencia)} ${e.nombre}`,
    titulo: `Evidencia #${numero3(e.idEvidencia)} · ${e.nombre}`,
    texto: e.descripcion || 'Sin descripción.'
  }));
  datos.ubicaciones.forEach((u) => r.push({
    clave: `u${u.idUbicacion}`, grupo: 'Ubicaciones',
    etiqueta: u.nombre,
    titulo: `Ubicación · ${u.nombre}`,
    texto: `${u.direccion}. ${u.descripcion || ''}`
  }));
  datos.lineaTiempo.forEach((a) => r.push({
    clave: `a${a.idAcontecimiento}`, grupo: 'Cronología',
    etiqueta: `${hora(a.fecha)} · ${a.titulo}`,
    titulo: `${fecha(a.fecha)} ${hora(a.fecha)} · ${a.titulo}`,
    texto: a.descripcion
  }));
  datos.declaraciones.forEach((d, i) => {
    const { persona, texto } = partirDeclaracion(d.contenido);
    r.push({
      clave: `c${d.idDeclaracion}`, grupo: 'Declaraciones',
      etiqueta: `Nº ${numero2(i + 1)} · ${persona || 'Persona no consta'}`,
      titulo: `Declaración Nº ${numero2(i + 1)} · ${persona || 'Persona no consta'}`,
      texto: `«${texto}»`
    });
  });
  return r;
}
