// Última hoja del expediente: acceso al tablero de investigación
import { resumenTablero } from '../tablero.js';

export function render() {
  const { elementos, conexiones } = resumenTablero();
  return `
    <p class="hoja__entradilla">La pared donde se arma el caso: fotos, papeles, notas e hilos que los unen.</p>
    <div class="acceso-tablero">
      <div class="acceso-tablero__corcho" aria-hidden="true">
        <span class="acceso-tablero__foto"></span>
        <span class="acceso-tablero__foto acceso-tablero__foto--2"></span>
        <span class="acceso-tablero__nota"></span>
        <svg viewBox="0 0 100 60"><path d="M24 14Q45 38 72 18" fill="none" stroke="#a92727" stroke-width="1.2"/></svg>
      </div>
      <p class="acceso-tablero__resumen">${elementos} ${elementos === 1 ? 'elemento' : 'elementos'} · ${conexiones} ${conexiones === 1 ? 'conexión' : 'conexiones'}</p>
      <button type="button" class="boton-tinta boton-tinta--rojo" data-abrir-tablero>Abrir tablero</button>
      <p class="nota-mano acceso-tablero__nota-mano">Añade lo importante desde cada hoja con «+ Añadir al tablero».</p>
    </div>`;
}
