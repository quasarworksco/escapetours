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

  // Logo: puede ser una URL de imagen externa o null para usar solo el texto.
  logoUrl: null,
  // Emoji/carácter que acompaña al nombre cuando no hay logo.
  logoEmoji: '🌴',

  // --- Contacto ------------------------------------------------------------
  // Teléfono en formato internacional SIN "+" ni espacios (requisito de wa.me).
  whatsapp: '584140000000',
  whatsappVisible: '+58 414-000 0000',
  instagram: 'escapetoursmcbo',
  email: 'escapetoursmcbo@gmail.com',
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

  // --- Textos de la interfaz pública ---------------------------------------
  textos: {
    heroTitulo: 'Próximos viajes',
    heroSubtitulo: 'Escoge tu destino, aparta tu cupo y nosotros nos encargamos del resto.',
    ctaReservar: 'Reservar mi cupo',
    ctaListaEspera: 'Anotarme en lista de espera',
    etiquetaAgotado: 'Agotado',
    sinViajes:
      'Todavía no hay viajes publicados para este mes. Escríbenos por WhatsApp ' +
      'y te avisamos apenas salga el próximo destino.',

    // Pantalla de confirmación tras crear la reserva
    reservaTitulo: '¡Reserva registrada!',
    reservaMensaje:
      'Tu cupo queda apartado como PENDIENTE hasta que verifiquemos el pago. ' +
      'Envíanos el comprobante por WhatsApp y te confirmamos de una vez.',
    listaEsperaTitulo: 'Quedaste en lista de espera',
    listaEsperaMensaje:
      'Este viaje ya está lleno, pero te anotamos de primero: si alguien cancela, ' +
      'te contactamos inmediatamente por WhatsApp.',
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
}

/** Arma un enlace wa.me con el mensaje ya redactado. */
export function linkWhatsApp(mensaje, telefono = BRAND.whatsapp) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}
