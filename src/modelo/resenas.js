/**
 * Reseñas de clientes (colección `resenas`).
 *
 * Toda reseña nace PENDIENTE y no aparece en la web hasta que la agencia la
 * aprueba desde el panel. Sin esa moderación, cualquiera con el enlace podría
 * publicar spam o insultos en la página.
 *
 * La consulta pública filtra por estado == 'aprobada' porque las reglas de
 * Firestore rechazan cualquier consulta que pudiera devolver documentos que no
 * se tiene permiso de leer.
 */
import {
  collection, doc, setDoc, getDocs, query, where,
  updateDoc, deleteDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../firebase.js';
import { ErrorApp } from './errores.js';

const COL_RESENAS = 'resenas';

export const ESTADOS_RESENA = {
  pendiente: { etiqueta: 'Pendiente', chip: 'et-chip--espera' },
  aprobada: { etiqueta: 'Publicada', chip: 'et-chip--ok' },
  rechazada: { etiqueta: 'Rechazada', chip: 'et-chip--error' },
};

const refResenas = () => collection(db, COL_RESENAS);
const refResena = (id) => doc(db, COL_RESENAS, id);

const aObjeto = (snap) => ({ id: snap.id, ...snap.data() });
const porFechaDesc = (a, b) =>
  (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);

// --- Escritura pública -----------------------------------------------------

export async function crearResena({ nombre, texto, calificacion, viaje }) {
  const nombreLimpio = String(nombre || '').trim();
  const textoLimpio = String(texto || '').trim();
  const estrellas = Number.parseInt(calificacion, 10);

  if (nombreLimpio.length < 2) throw new ErrorApp('Escribe tu nombre.');
  if (textoLimpio.length < 10) {
    throw new ErrorApp('Cuéntanos un poquito más: al menos 10 caracteres.');
  }
  if (textoLimpio.length > 600) {
    throw new ErrorApp('La reseña es muy larga (máximo 600 caracteres).');
  }
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    throw new ErrorApp('Escoge cuántas estrellas le das.');
  }

  const ref = doc(refResenas());
  const datos = {
    nombreCliente: nombreLimpio,
    texto: textoLimpio,
    calificacion: estrellas,
    estado: 'pendiente',
    createdAt: serverTimestamp(),
  };
  if (viaje?.id) {
    datos.tripId = viaje.id;
    datos.tripDestino = viaje.destino;
  }
  await setDoc(ref, datos);
  return ref.id;
}

// --- Lectura ---------------------------------------------------------------

/** Las que se muestran en la web. */
export async function resenasAprobadas() {
  const snap = await getDocs(query(refResenas(), where('estado', '==', 'aprobada')));
  return snap.docs.map(aObjeto).sort(porFechaDesc);
}

/** Todas, para el panel. */
export async function todasLasResenas() {
  const snap = await getDocs(refResenas());
  return snap.docs.map(aObjeto).sort(porFechaDesc);
}

/** Promedio de estrellas y total, para el encabezado de la sección. */
export function resumirResenas(resenas) {
  const publicadas = resenas.filter((r) => r.estado === 'aprobada');
  if (!publicadas.length) return { total: 0, promedio: 0 };
  const suma = publicadas.reduce((s, r) => s + (r.calificacion || 0), 0);
  return {
    total: publicadas.length,
    promedio: Math.round((suma / publicadas.length) * 10) / 10,
  };
}

// --- Moderación (solo admin) -----------------------------------------------

export async function aprobarResena(id) {
  await updateDoc(refResena(id), {
    estado: 'aprobada',
    aprobadaEn: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function rechazarResena(id) {
  await updateDoc(refResena(id), { estado: 'rechazada', updatedAt: serverTimestamp() });
}

export async function eliminarResena(id) {
  await deleteDoc(refResena(id));
}
