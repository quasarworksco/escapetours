/** Errores de negocio con mensajes listos para mostrarle al usuario. */

export class ErrorApp extends Error {
  constructor(mensaje, codigo = 'error') {
    super(mensaje);
    this.name = 'ErrorApp';
    this.codigo = codigo;
  }
}

export class ErrorCupo extends ErrorApp {
  constructor(mensaje, disponibles = 0) {
    super(mensaje, 'sin-cupo');
    this.name = 'ErrorCupo';
    this.disponibles = disponibles;
  }
}

/** Traduce errores del SDK de Firebase a español entendible. */
export function mensajeDeError(err) {
  if (err instanceof ErrorApp) return err.message;
  const codigo = err?.code || '';
  const mapa = {
    'permission-denied':
      'No tienes permiso para hacer esto. Verifica que iniciaste sesión como administrador.',
    'unavailable':
      'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
    'not-found': 'No encontramos el registro solicitado.',
    'aborted':
      'Otra persona modificó este viaje al mismo tiempo. Vuelve a intentarlo.',
    'failed-precondition': 'La operación no se pudo completar. Recarga la página.',
    'auth/invalid-credential': 'Usuario o contraseña incorrectos.',
    'auth/invalid-email': 'El usuario no tiene un formato válido.',
    'auth/user-not-found': 'Usuario o contraseña incorrectos.',
    'auth/wrong-password': 'Usuario o contraseña incorrectos.',
    'auth/too-many-requests':
      'Demasiados intentos fallidos. Espera unos minutos e inténtalo otra vez.',
    'auth/user-disabled': 'Esta cuenta está deshabilitada en Firebase.',
    // Las tres siguientes son fallos de configuración del proyecto, no del
    // usuario: el mensaje dice exactamente qué falta hacer en la consola.
    'auth/network-request-failed':
      'No se pudo contactar con Firebase. Suele ser una de tres cosas: ' +
      'Authentication todavía no está activado en la consola, una extensión ' +
      'del navegador (bloqueador de anuncios) está bloqueando googleapis.com, ' +
      'o no hay internet. Prueba primero en una ventana de incógnito.',
    'auth/operation-not-allowed':
      'El acceso con correo y contraseña no está habilitado. Actívalo en ' +
      'Firebase → Authentication → Sign-in method.',
    'auth/unauthorized-domain':
      'Este dominio no está autorizado. Agrégalo en Firebase → Authentication ' +
      '→ Settings → Dominios autorizados.',
    'auth/invalid-api-key':
      'La clave del proyecto no es válida. Revisa config/firebase.js.',
  };
  if (mapa[codigo]) return mapa[codigo];
  console.error('[Escape Tours]', err);
  // El código técnico se muestra a propósito: sin él es imposible diagnosticar
  // un fallo que solo ocurre en el navegador de otra persona.
  return 'Ocurrió un error inesperado' + (codigo ? ` (${codigo})` : '') +
    '. Inténtalo de nuevo en un momento.';
}
