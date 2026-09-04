/**
 * Autenticación del panel.
 *
 * Ser administrador exige DOS cosas:
 *   1. sesión iniciada en Firebase Authentication (correo y contraseña), y
 *   2. un documento en /admins/{uid}.
 *
 * El documento se crea a mano desde la consola de Firebase (ver DEPLOY.md), así
 * que nadie puede auto-promoverse registrándose en la web. Las reglas de
 * Firestore hacen exactamente esta misma comprobación del lado del servidor:
 * lo de aquí es solo para la interfaz.
 */
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db, COL } from '../firebase.js';
import { ErrorApp } from '../modelo/errores.js';

/** Datos del admin en sesión, o null. */
export let adminActual = null;

async function cargarPerfilAdmin(user) {
  const snap = await getDoc(doc(db, COL.admins, user.uid));
  if (!snap.exists()) return null;
  return { uid: user.uid, email: user.email, ...snap.data() };
}

export async function iniciarSesion(email, password) {
  await setPersistence(auth, browserLocalPersistence);
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const perfil = await cargarPerfilAdmin(cred.user);
  if (!perfil) {
    await signOut(auth);
    throw new ErrorApp(
      'Esta cuenta existe pero no tiene permisos de administrador. ' +
        'Pídele al dueño que agregue tu UID a la colección "admins".'
    );
  }
  adminActual = perfil;
  return perfil;
}

export async function cerrarSesion() {
  adminActual = null;
  await signOut(auth);
}

/**
 * Observa el estado de sesión y avisa con el perfil del admin (o null).
 * Se dispara al cargar la página y en cada login/logout.
 */
export function observarSesion(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      adminActual = null;
      callback(null);
      return;
    }
    try {
      adminActual = await cargarPerfilAdmin(user);
      if (!adminActual) await signOut(auth);
      callback(adminActual);
    } catch (err) {
      console.error('[Escape Tours] Error verificando permisos de admin', err);
      adminActual = null;
      callback(null);
    }
  });
}

/** Nombre para mostrar y para el campo `registradoPor` de los pagos. */
export function nombreAdmin() {
  return adminActual?.nombre || adminActual?.email || 'admin';
}
