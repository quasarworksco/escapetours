/**
 * Inicializa Firebase una sola vez y exporta las instancias compartidas.
 * El SDK se carga por CDN como módulo ES: no hace falta bundler ni npm.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { FIREBASE_CONFIG, FIREBASE_SIN_CONFIGURAR } from '../config/firebase.js';

if (FIREBASE_SIN_CONFIGURAR) {
  console.warn(
    '[Escape Tours] config/firebase.js todavía tiene valores de ejemplo. ' +
      'Sigue las instrucciones de DEPLOY.md para conectar tu proyecto.'
  );
}

export const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { FIREBASE_SIN_CONFIGURAR };

// Nombres de colecciones en un solo lugar, para evitar strings sueltos.
export const COL = {
  trips: 'trips',
  bookings: 'bookings',
  pagos: 'pagos', // subcolección de bookings
  admins: 'admins',
  config: 'config',
};
