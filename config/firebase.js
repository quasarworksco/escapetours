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
 *  Consola de Firebase → Configuración del proyecto → "Tus apps" → app web
 *  → sección "SDK setup and configuration" → opción "Config".
 *  El paso a paso completo está en DEPLOY.md.
 * ============================================================================
 */

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB_G9fxWs816qN5GXzHTr7tbQ0vmqhW9gU',
  authDomain: 'escapetours-235be.firebaseapp.com',
  projectId: 'escapetours-235be',
  storageBucket: 'escapetours-235be.firebasestorage.app',
  messagingSenderId: '519597757371',
  appId: '1:519597757371:web:25269c1d78870bca15ea9e',
};

/** true cuando el archivo todavía tiene los valores de ejemplo. */
export const FIREBASE_SIN_CONFIGURAR =
  FIREBASE_CONFIG.projectId.startsWith('REEMPLAZAR');
