/**
 * Iconos SVG en línea — sustituyen a los emojis en toda la interfaz.
 *
 * Trazo de 1.75 con `currentColor`, así heredan el color del texto que los
 * acompaña y no hace falta una versión por tema. Al ser inline no añaden
 * ninguna petición de red ni dependen de una fuente de iconos.
 *
 * Uso:  elemento.innerHTML = `${icono('calendario')} 14 de marzo`;
 */

const TRAZO = {
  flechaIzq: '<path d="M19 12H5m7 7-7-7 7-7"/>',
  flechaDer: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  chevronIzq: '<path d="m15 18-6-6 6-6"/>',
  chevronDer: '<path d="m9 18 6-6-6-6"/>',
  cerrar: '<path d="M18 6 6 18M6 6l12 12"/>',
  mas: '<path d="M5 12h14M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCirculo:
    '<path d="M21.8 10.9V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>',
  alerta:
    '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/>',
  ubicacion:
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>' +
    '<circle cx="12" cy="10" r="3"/>',
  calendario:
    '<rect x="3" y="4" width="18" height="17" rx="2"/>' +
    '<path d="M16 2v4M8 2v4M3 10h18"/>',
  personas:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' +
    '<path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  etiqueta:
    '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.8 8.8a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8Z"/>' +
    '<path d="M7 7h.01"/>',
  nota:
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
  lista:
    '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  mapa:
    '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
  bandeja:
    '<path d="M22 12h-6l-2 3h-4l-2-3H2"/>' +
    '<path d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1Z"/>',
  brujula:
    '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.4-6.4 2.1 2.1-6.4Z"/>',
  imagen:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/>' +
    '<path d="m21 15-4.6-4.6a2 2 0 0 0-2.8 0L3 21"/>',
  reloj: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  salir:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  instagram:
    '<rect x="2" y="2" width="20" height="20" rx="5.5"/>' +
    '<circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  refrescar:
    '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/>' +
    '<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
};

/** Iconos de marca: son formas rellenas, no trazos. */
const RELLENO = {
  whatsapp:
    '<path d="M17.5 14.4c-.3-.2-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.4.2-.7.1-1.2-.5-2.4-1.5c-.9-.8-1.5-1.8-1.6-2.1s0-.5.1-.6l.5-.5.3-.5c.1-.2 0-.4 0-.5L9.2 6.9c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1 2.9 1.2 3.1 2.1 3.2 5 4.5c1.9.8 2.7.9 3.6.8.6-.1 1.8-.7 2-1.4s.2-1.3.2-1.4-.3-.2-.6-.4"/>' +
    '<path d="M12 0A12 12 0 0 0 1.6 17.9L0 24l6.3-1.7A12 12 0 1 0 12 0Zm0 21.9a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.9 9.9 0 1 1 12 21.9Z"/>',
};

/**
 * Devuelve el SVG del icono como string.
 * @param {string} nombre  clave de TRAZO o RELLENO
 * @param {{tam?: number, clase?: string}} opciones
 */
export function icono(nombre, { tam = 18, clase = '' } = {}) {
  const relleno = RELLENO[nombre];
  const cuerpo = relleno || TRAZO[nombre];
  if (!cuerpo) {
    console.warn(`[Escape Tours] Icono desconocido: ${nombre}`);
    return '';
  }
  const pintura = relleno
    ? 'fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"'
    : 'fill="none" stroke="currentColor" stroke-width="1.75" ' +
      'stroke-linecap="round" stroke-linejoin="round"';
  return `<svg class="et-icono ${clase}" width="${tam}" height="${tam}" viewBox="0 0 24 24" ` +
    `${pintura} aria-hidden="true" focusable="false">${cuerpo}</svg>`;
}

/**
 * Marca de agua animada para la pantalla de confirmación: el círculo se dibuja
 * y luego aparece el visto bueno.
 */
export function iconoExito(clase = '') {
  return `
    <svg class="et-exito ${clase}" viewBox="0 0 52 52" width="76" height="76"
         fill="none" stroke="currentColor" stroke-width="3"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle class="et-exito__circulo" cx="26" cy="26" r="23"/>
      <path class="et-exito__trazo" d="m15 27 8 8 15-16"/>
    </svg>`;
}
