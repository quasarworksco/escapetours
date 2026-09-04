/**
 * Configuración editable por la agencia (documento único `config/app`).
 * Es de lectura pública a propósito: el cliente necesita ver los datos de pago.
 * Si el documento no existe todavía, la app usa CONFIG_POR_DEFECTO.
 */
import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db, COL } from '../firebase.js';

const refConfig = () => doc(db, COL.config, 'app');

export const CONFIG_POR_DEFECTO = {
  // Lista editable desde el panel. `detalle` es lo que ve el cliente.
  metodosPago: [
    { nombre: 'Pago móvil', detalle: 'Banesco · C.I. V-00.000.000 · 0414-000 0000', activo: true },
    { nombre: 'Zelle', detalle: 'escapetoursmcbo@gmail.com — Escape Tours', activo: true },
    { nombre: 'Binance', detalle: 'escapetoursmcbo@gmail.com', activo: true },
    { nombre: 'Transferencia', detalle: 'Banesco · Cta. 0134-0000-00-0000000000', activo: true },
    { nombre: 'Efectivo', detalle: 'Coordinado por WhatsApp', activo: true },
  ],
  instruccionesPago:
    'Puedes abonar el 50% para apartar tu cupo y el resto hasta 5 días antes de la salida. ' +
    'Envíanos el comprobante por WhatsApp para confirmarte.',
  mostrarDatosDePago: true,
};

let cache = null;

export async function obtenerConfig({ refrescar = false } = {}) {
  if (cache && !refrescar) return cache;
  try {
    const snap = await getDoc(refConfig());
    cache = snap.exists()
      ? { ...CONFIG_POR_DEFECTO, ...snap.data() }
      : { ...CONFIG_POR_DEFECTO };
  } catch (err) {
    console.warn('[Escape Tours] No se pudo leer config/app, usando valores por defecto.', err);
    cache = { ...CONFIG_POR_DEFECTO };
  }
  return cache;
}

export async function guardarConfig(datos) {
  const limpio = {
    metodosPago: (datos.metodosPago || [])
      .map((m) => ({
        nombre: String(m.nombre || '').trim(),
        detalle: String(m.detalle || '').trim(),
        activo: m.activo !== false,
      }))
      .filter((m) => m.nombre),
    instruccionesPago: String(datos.instruccionesPago || '').trim(),
    mostrarDatosDePago: datos.mostrarDatosDePago !== false,
    updatedAt: serverTimestamp(),
  };
  await setDoc(refConfig(), limpio, { merge: true });
  cache = { ...CONFIG_POR_DEFECTO, ...limpio };
  return cache;
}

/** Solo los métodos que la agencia tiene activos. */
export function metodosActivos(config) {
  return (config?.metodosPago || []).filter((m) => m.activo !== false);
}
