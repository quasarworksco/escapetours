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
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests':
      'Demasiados intentos fallidos. Espera unos minutos e inténtalo otra vez.',
    'auth/network-request-failed': 'Falló la conexión. Revisa tu internet.',
  };
  if (mapa[codigo]) return mapa[codigo];
  console.error('[Escape Tours]', err);
  return 'Ocurrió un error inesperado. Inténtalo de nuevo en un momento.';
}
