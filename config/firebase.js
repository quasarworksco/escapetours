/**
 * ============================================================================
 *  CREDENCIALES DEL PROYECTO FIREBASE
 * ----------------------------------------------------------------------------
 *  ¿ESTO ES UN SECRETO? NO.
 *  La configuración web de Firebase es pública por diseño: viaja en el HTML de
 *  cualquier sitio que use Firebase. No es una contraseña, solo identifica a
 *  qué proyecto conectarse. Lo que realmente protege los datos son las REGLAS
 *  DE SEGURIDAD de Firestore (ver firestore.rules).
 *
 *  CÓMO OBTENER ESTOS VALORES:
 *  Consola de Firebase → ⚙ Configuración del proyecto → "Tus apps" → app web
 *  → sección "SDK setup and configuration" → opción "Config".
 *  El paso a paso completo está en DEPLOY.md.
 * ============================================================================
 */

export const FIREBASE_CONFIG = {
  apiKey: 'REEMPLAZAR_API_KEY',
  authDomain: 'REEMPLAZAR.firebaseapp.com',
  projectId: 'REEMPLAZAR_PROJECT_ID',
  storageBucket: 'REEMPLAZAR.appspot.com',
  messagingSenderId: 'REEMPLAZAR_SENDER_ID',
  appId: 'REEMPLAZAR_APP_ID',
};

/** true cuando el archivo todavía tiene los valores de ejemplo. */
export const FIREBASE_SIN_CONFIGURAR =
  FIREBASE_CONFIG.projectId.startsWith('REEMPLAZAR');
