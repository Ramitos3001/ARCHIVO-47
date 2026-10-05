// Fotografías e ilustraciones dibujadas con SVG (sin imágenes).
// Se eligen por palabras clave del nombre/tipo; el grano y la viñeta vienen
// de los filtros #grano y #vineta definidos en expediente.html.

const T = '#2e2318';   // tinta
const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const tiene = (texto, ...palabras) => palabras.some((p) => texto.includes(p));

function foto(contenido, { vista = '0 0 120 90', fondo = '#c9b791', clase = '' } = {}) {
  return `
    <svg viewBox="${vista}" class="ilustracion ${clase}" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="100%" height="100%" fill="${fondo}"/>
      ${contenido}
      <rect width="100%" height="100%" fill="url(#vineta)"/>
      <rect width="100%" height="100%" filter="url(#grano)" opacity=".6"/>
    </svg>`;
}

// ---------- Objetos (evidencias) ----------

const OBJETOS = {
  zapato: () => `
    <ellipse cx="60" cy="70" rx="44" ry="6" fill="#000" opacity=".25"/>
    <path d="M20 66c0-12 7-18 16-18h14c6 8 18 11 32 13 10 1 16 5 16 9v2H20z" fill="#4b3727" stroke="${T}" stroke-width="1.5"/>
    <path d="M20 70h78" stroke="#1d140c" stroke-width="4"/>
    <path d="M38 50l4 8M45 49l3 8M52 50l2 7" stroke="#b9a37c" stroke-width="1.3"/>
    <circle cx="30" cy="69" r="3" fill="#6d5233"/><circle cx="52" cy="71" r="4" fill="#6d5233"/><circle cx="80" cy="70" r="3" fill="#6d5233"/>`,
  telefono: () => `
    <ellipse cx="60" cy="80" rx="26" ry="4" fill="#000" opacity=".25"/>
    <rect x="40" y="10" width="40" height="68" rx="6" fill="#26241f" stroke="${T}" stroke-width="1.5"/>
    <rect x="44" y="18" width="32" height="50" rx="2" fill="#5d6a66"/>
    <path d="M46 26h20M46 32h26M46 38h14" stroke="#9fb0aa" stroke-width="2"/>
    <circle cx="60" cy="73" r="2.5" fill="#55524b"/>`,
  documento: (quemado) => `
    <rect x="34" y="8" width="52" height="72" fill="#eee4cc" stroke="${T}" stroke-width="1" transform="rotate(-4 60 44)"/>
    <g transform="rotate(-4 60 44)" stroke="#6b5a44" stroke-width="1.4">
      <path d="M40 20h40M40 27h36M40 34h40M40 41h30M40 48h38M40 55h26"/>
    </g>
    ${quemado ? `<path d="M30 60c8 4 12-4 20 2s10-6 18 0 12-2 20 4v22H30z" fill="#1f160e" transform="rotate(-4 60 44)"/>
      <path d="M30 60c8 4 12-4 20 2s10-6 18 0 12-2 20 4" fill="none" stroke="#8a4b1c" stroke-width="2" transform="rotate(-4 60 44)"/>` : ''}`,
  recibo: () => `
    <path d="M46 8h28v70l-4-4-4 4-4-4-4 4-4-4-4 4-4-4z" fill="#f1ead8" stroke="${T}" stroke-width="1" transform="rotate(5 60 44)"/>
    <g transform="rotate(5 60 44)" fill="#5c4c38" font-family="monospace" font-size="5">
      <text x="50" y="18">RECIBO</text><text x="50" y="30">······</text><text x="50" y="40">····</text>
      <text x="50" y="52">TOTAL</text>
    </g>`,
  audio: () => `
    <ellipse cx="60" cy="74" rx="40" ry="5" fill="#000" opacity=".25"/>
    <rect x="22" y="22" width="76" height="48" rx="4" fill="#3a352e" stroke="${T}" stroke-width="1.5"/>
    <rect x="32" y="30" width="56" height="20" rx="2" fill="#d8ccad"/>
    <circle cx="46" cy="40" r="7" fill="#3a352e"/><circle cx="74" cy="40" r="7" fill="#3a352e"/>
    <circle cx="46" cy="40" r="2" fill="#d8ccad"/><circle cx="74" cy="40" r="2" fill="#d8ccad"/>
    <path d="M36 62h48" stroke="#6b6357" stroke-width="3"/>`,
  llave: () => `
    <circle cx="40" cy="45" r="13" fill="none" stroke="#8d7a4c" stroke-width="6"/>
    <path d="M53 45h40v8M83 45v7M73 45v5" stroke="#8d7a4c" stroke-width="6" fill="none"/>`,
  fotografia: () => `
    <rect x="30" y="14" width="60" height="62" fill="#f3eee2" transform="rotate(-6 60 45)"/>
    <rect x="35" y="19" width="50" height="40" fill="#47423a" transform="rotate(-6 60 45)"/>
    <circle cx="52" cy="38" r="7" fill="#7b746a" transform="rotate(-6 60 45)"/>`,
  caja: () => `
    <ellipse cx="60" cy="74" rx="36" ry="5" fill="#000" opacity=".25"/>
    <path d="M30 34l30-12 30 12v34l-30 10-30-10z" fill="#9b7b52" stroke="${T}" stroke-width="1.5"/>
    <path d="M30 34l30 12 30-12M60 46v32" stroke="${T}" stroke-width="1.5" fill="none"/>
    <rect x="44" y="52" width="10" height="6" fill="#efe6cf" transform="skewY(20)"/>`
};

function objetoDe(evidencia) {
  const texto = normalizar(`${evidencia.nombre} ${evidencia.tipo}`);
  if (tiene(texto, 'zapat', 'bota', 'huella')) return OBJETOS.zapato();
  if (tiene(texto, 'telefono', 'movil', 'celular')) return OBJETOS.telefono();
  if (tiene(texto, 'recibo', 'ticket', 'factura')) return OBJETOS.recibo();
  if (tiene(texto, 'audio', 'voz', 'grabacion', 'cinta')) return OBJETOS.audio();
  if (tiene(texto, 'llave')) return OBJETOS.llave();
  if (tiene(texto, 'foto', 'imagen', 'captura')) return OBJETOS.fotografia();
  if (tiene(texto, 'document', 'carta', 'nota', 'testamento', 'registro', 'informe')) {
    return OBJETOS.documento(tiene(texto, 'quem'));
  }
  return OBJETOS.caja();
}

export const ilustracionEvidencia = (evidencia, clase = '') =>
  foto(objetoDe(evidencia), { fondo: '#bfae8a', clase });

// ---------- Escenas (ubicaciones) ----------

const ESCENAS = {
  edificio: () => `
    <rect width="160" height="100" fill="#3c4146"/>
    <rect x="58" y="6" width="44" height="94" fill="#22262a"/>
    ${Array.from({ length: 8 }, (_, f) => Array.from({ length: 4 }, (_, c) =>
      `<rect x="${62 + c * 10}" y="${12 + f * 10}" width="6" height="6" fill="${f === 1 && c === 2 ? '#e8c77a' : '#4a5056'}"/>`).join('')).join('')}
    <rect x="0" y="86" width="160" height="14" fill="#1b1d20"/>`,
  casa: () => `
    <rect width="160" height="100" fill="#4a4a46"/>
    <path d="M40 50l40-28 40 28z" fill="#2b2420"/>
    <rect x="48" y="50" width="64" height="40" fill="#5e5145"/>
    <rect x="58" y="60" width="14" height="14" fill="#e3c47c"/>
    <rect x="88" y="62" width="12" height="28" fill="#2b2420"/>
    <rect x="0" y="88" width="160" height="12" fill="#2a2b28"/>`,
  puerta: () => `
    <rect width="160" height="100" fill="#55524a"/>
    <rect x="58" y="14" width="44" height="76" fill="#2c2620"/>
    <path d="M60 16h30l8 4v68l-8 2H60z" fill="#6c5a45"/>
    <circle cx="88" cy="54" r="2" fill="#c9b27a"/>
    <path d="M0 90h160v10H0z" fill="#3b2d1f"/>
    <path d="M20 94c10-3 18 2 30-1M100 96c12-4 20 1 34-2" stroke="#5c4632" stroke-width="2" fill="none"/>`,
  teatro: () => `
    <rect width="160" height="100" fill="#3e3b38"/>
    <path d="M30 34h100v56H30z" fill="#6a5d4e"/>
    <path d="M24 34l56-20 56 20z" fill="#4f453b"/>
    ${[40, 60, 80, 100, 120].map((x) => `<rect x="${x - 3}" y="40" width="6" height="50" fill="#d9ceb5"/>`).join('')}
    <rect x="50" y="26" width="60" height="6" fill="#e8c77a"/>`,
  calle: () => `
    <rect width="160" height="100" fill="#3a3c3d"/>
    <path d="M60 100l18-56h4l18 56z" fill="#26282a"/>
    <path d="M80 100v-54" stroke="#cfc6ae" stroke-width="1" stroke-dasharray="4 4"/>
    <path d="M128 100V30h-12" stroke="#1d1e1f" stroke-width="3" fill="none"/>
    <circle cx="114" cy="32" r="4" fill="#e8c77a"/>`
};

export function escenaDe(ubicacion, clase = '') {
  const texto = normalizar(`${ubicacion.nombre} ${ubicacion.descripcion}`);
  let escena = ESCENAS.calle;
  if (tiene(texto, 'teatro', 'cine')) escena = ESCENAS.teatro;
  else if (tiene(texto, 'puerta', 'jardin', 'callejon', 'acceso')) escena = ESCENAS.puerta;
  else if (tiene(texto, 'torre', 'oficina', 'edificio', 'piso')) escena = ESCENAS.edificio;
  else if (tiene(texto, 'casa', 'salon', 'despacho', 'mansion', 'domicilio')) escena = ESCENAS.casa;
  return foto(escena(), { vista: '0 0 160 100', fondo: '#444', clase });
}

// ---------- Retratos (sospechosos) ----------

const PEINADOS = [
  '',                                                                          // corto
  '<path d="M17 26c0-12 6-18 13-18s13 6 13 18c0 10-2 22-4 26H21c-2-4-4-16-4-26z" fill="#2a2520"/>', // largo
  '<circle cx="30" cy="9" r="6" fill="#2a2520"/>',                             // moño
  '<path d="M17 20c2-9 7-13 13-13s11 4 13 13z" fill="#2a2520"/>'               // flequillo
];

export function retrato(indice, clase = '') {
  const lineas = Array.from({ length: 9 }, (_, i) =>
    `<path d="M0 ${8 + i * 8}h60" stroke="#8d8576" stroke-width=".5"/>`).join('');
  return `
    <svg viewBox="0 0 60 80" class="ilustracion retrato ${clase}" aria-hidden="true">
      <rect width="60" height="80" fill="#bdb5a3"/>
      ${lineas}
      ${PEINADOS[indice % PEINADOS.length]}
      <ellipse cx="30" cy="27" rx="10" ry="12" fill="#3a342d"/>
      <path d="M8 80c1-18 10-28 22-28s21 10 22 28z" fill="#3a342d"/>
      <rect x="18" y="62" width="24" height="10" fill="#1c1915"/>
      <text x="30" y="69.5" text-anchor="middle" font-family="monospace" font-size="6" fill="#d8ccad">Nº ${String(indice + 1).padStart(2, '0')}</text>
      <rect width="60" height="80" fill="url(#vineta)"/>
      <rect width="60" height="80" filter="url(#grano)" opacity=".6"/>
    </svg>`;
}

export const candado = () => `
  <svg viewBox="0 0 40 48" class="candado" aria-hidden="true">
    <path d="M10 22v-8a10 10 0 0 1 20 0v8" fill="none" stroke="#9a8f7c" stroke-width="4"/>
    <rect x="5" y="22" width="30" height="24" rx="3" fill="#8b1e1e"/>
    <circle cx="20" cy="32" r="3" fill="#1c1410"/><path d="M20 34v6" stroke="#1c1410" stroke-width="2.5"/>
  </svg>`;
