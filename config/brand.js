/**
 * ============================================================================
 *  IDENTIDAD DE MARCA — Escape Tours Mcbo
 * ----------------------------------------------------------------------------
 *  Este es el ÚNICO archivo que hay que tocar para adaptar el sitio a otra
 *  agencia: nombre, logo, colores, textos, contacto y valores por defecto.
 *  Los colores definidos aquí se inyectan en tiempo de ejecución sobre las
 *  variables CSS de styles/tokens.css (ver aplicarTemaDeMarca más abajo).
 * ============================================================================
 */

export const BRAND = {
  // --- Identidad -----------------------------------------------------------
  nombre: 'Escape Tours Mcbo',
  nombreCorto: 'Escape Tours',
  eslogan: 'Vive Venezuela, un viaje a la vez',
  descripcion:
    'Viajes y excursiones grupales saliendo desde Maracaibo. Cupos limitados, ' +
    'destinos increíbles y todo coordinado para que solo te preocupes por disfrutar.',

  // Logo: marca geométrica en SVG que sigue la paleta definida más abajo.
  // Para usar una imagen propia, pon aquí su URL en `logoUrl` y se usará en su
  // lugar. Si defines ambos, manda `logoUrl`.
  logoUrl: null,
  logoSvg: `
    <svg viewBox="0 0 40 40" width="36" height="36" role="img" aria-label="Logo">
      <rect width="40" height="40" rx="11" fill="var(--et-marino)"/>
      <circle cx="20" cy="16.5" r="7" fill="var(--et-amarillo)"/>
      <path d="M8.5 27.5h23M12 32.5h16" stroke="var(--et-turquesa)"
            stroke-width="2.6" stroke-linecap="round"/>
    </svg>`,

  // --- Contacto ------------------------------------------------------------
  // Teléfono en formato internacional SIN "+" ni espacios (requisito de wa.me).
  whatsapp: '584246256385',
  whatsappVisible: '+58 424-625 6385',
  instagram: 'escapetoursmcbo',
  email: 'escapetourmcbo@gmail.com',
  ciudad: 'Maracaibo, Venezuela',

  // --- Paleta "sol y playa" ------------------------------------------------
  // Ver styles/tokens.css para la lista completa de variables disponibles.
  colores: {
    amarillo: '#FFC233',       // sol — acento principal, botones de reservar
    amarilloOscuro: '#E5A312',
    turquesa: '#14B8B3',       // mar — acento secundario, enlaces y bordes
    turquesaOscuro: '#0A7C79', // versión accesible para texto sobre blanco
    arena: '#FFF8EC',          // fondo neutro cálido
    marino: '#0B3B45',         // texto principal, alto contraste
    coral: '#F2603C',          // alertas y estados críticos
  },

  // --- Cómo se le habla al cliente -----------------------------------------
  // Escape Tours Mcbo llama "Mochilero" a sus clientes. Los textos de abajo
  // usan los marcadores {tratamiento} y {tratamientoPlural}, que se sustituyen
  // en tiempo de ejecución (ver la función `texto`). Si algún día cambia el
  // apelativo, basta con editarlo aquí.
  publico: {
    tratamiento: 'Mochilero',
    tratamientoPlural: 'Mochileros',
  },

  // --- Tipografía ----------------------------------------------------------
  // IMPORTANTE: si cambias las familias, actualiza también el <link> de Google Fonts que
  // hay en index.html, admin.html, 404.html y seed/index.html; de lo contrario
  // el navegador no tendrá la fuente que le pides y usará la de respaldo.
  tipografia: {
    titulos: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
    texto: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  },

  // --- Textos de la interfaz pública ---------------------------------------
  textos: {
    heroTitulo: 'Próximos viajes',
    heroSubtitulo:
      'Escoge tu destino, {tratamiento}: apartas tu cupo y nosotros nos ' +
      'encargamos del resto.',
    ctaReservar: 'Reservar mi cupo',
    ctaListaEspera: 'Anotarme en lista de espera',
    etiquetaAgotado: 'Agotado',
    sinViajes:
      'Todavía no hay viajes publicados para este mes. Escríbenos por WhatsApp, ' +
      '{tratamiento}, y te avisamos apenas salga el próximo destino.',

    // Pantalla de confirmación tras crear la reserva
    reservaTitulo: '¡Listo, {tratamiento}!',
    reservaMensaje:
      'Tu cupo queda apartado como PENDIENTE hasta que verifiquemos el pago. ' +
      'Envíanos el comprobante por WhatsApp y te confirmamos de una vez.',
    reservaNota:
      'Reservar no cobra nada todavía. Confirmamos tu cupo cuando verifiquemos el pago.',
    listaEsperaTitulo: 'Quedaste en lista de espera',
    listaEsperaMensaje:
      'Este viaje ya está lleno, pero te anotamos de primero, {tratamiento}: ' +
      'si alguien cancela, te contactamos inmediatamente por WhatsApp.',
  },

  // --- Reglas de negocio por defecto ---------------------------------------
  reglas: {
    // Tope de personas que un mismo cliente puede pedir en una sola reserva.
    // Este valor TAMBIÉN está replicado en firestore.rules; si lo cambias aquí,
    // cámbialo allá (constante maxPersonasPorReserva).
    maxPersonasPorReserva: 10,
    // Cupos restantes a partir de los cuales se muestra el aviso "¡Últimos cupos!"
    umbralUltimosCupos: 3,
    // Días tras los cuales una reserva pendiente se marca como "sin respuesta"
    // en el panel (solo es un aviso visual, no cambia el estado).
    diasParaAvisoPendiente: 3,
    moneda: 'USD',
    simboloMoneda: '$',
  },
};

/**
 * Vuelca BRAND.colores sobre las variables CSS del documento.
 * Se llama una sola vez al cargar cada página.
 */
export function aplicarTemaDeMarca() {
  const raiz = document.documentElement.style;
  const c = BRAND.colores;
  raiz.setProperty('--et-amarillo', c.amarillo);
  raiz.setProperty('--et-amarillo-oscuro', c.amarilloOscuro);
  raiz.setProperty('--et-turquesa', c.turquesa);
  raiz.setProperty('--et-turquesa-oscuro', c.turquesaOscuro);
  raiz.setProperty('--et-arena', c.arena);
  raiz.setProperty('--et-marino', c.marino);
  raiz.setProperty('--et-coral', c.coral);

  if (BRAND.tipografia?.titulos) raiz.setProperty('--et-fuente-titulo', BRAND.tipografia.titulos);
  if (BRAND.tipografia?.texto) raiz.setProperty('--et-fuente-texto', BRAND.tipografia.texto);
}

/** Devuelve el logo listo para insertar: imagen propia si la hay, si no la marca SVG. */
export function logoHtml(alto = 36) {
  if (BRAND.logoUrl) {
    return `<img src="${BRAND.logoUrl}" alt="${BRAND.nombre}" height="${alto}"
                 style="height:${alto}px; width:auto">`;
  }
  return BRAND.logoSvg;
}

/**
 * Devuelve un texto de BRAND.textos con los marcadores ya sustituidos.
 * Acepta también un texto suelto, para reutilizar los marcadores fuera de
 * BRAND.textos (por ejemplo en los mensajes de WhatsApp del panel).
 */
export function texto(claveOTexto) {
  const bruto = BRAND.textos[claveOTexto] ?? claveOTexto ?? '';
  return String(bruto)
    .replaceAll('{tratamiento}', BRAND.publico.tratamiento)
    .replaceAll('{tratamientoPlural}', BRAND.publico.tratamientoPlural);
}

/** Arma un enlace wa.me con el mensaje ya redactado. */
export function linkWhatsApp(mensaje, telefono = BRAND.whatsapp) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}
