/**
 * Viajes (colección `trips`).
 *
 * El cupo se controla con un único contador denormalizado: `cuposConfirmados`.
 * Solo se mueve dentro de transacciones (ver bookings.js), por lo que nunca
 * puede descuadrarse por escrituras simultáneas.
 */
import {
  collection, doc, getDoc, getDocs, query, where,
  addDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db, COL } from '../firebase.js';
import { mesDe } from '../utils/fecha.js';
import { ErrorApp } from './errores.js';

const refTrips = () => collection(db, COL.trips);
const refTrip = (id) => doc(db, COL.trips, id);

/** Ordena por fecha de salida (se hace en el cliente para no exigir índices). */
const porFecha = (a, b) => a.fechaInicio.localeCompare(b.fechaInicio);

function aObjeto(snap) {
  return { id: snap.id, ...snap.data() };
}

// --- Lectura ---------------------------------------------------------------

/** Viajes de un mes "YYYY-MM". Por defecto solo los que están abiertos. */
export async function viajesDelMes(mes, { soloActivos = true } = {}) {
  const snap = await getDocs(query(refTrips(), where('mes', '==', mes)));
  return snap.docs
    .map(aObjeto)
    .filter((v) => !soloActivos || v.estado === 'activo')
    .sort(porFecha);
}

/** Todos los viajes (panel admin). */
export async function todosLosViajes() {
  const snap = await getDocs(refTrips());
  return snap.docs.map(aObjeto).sort(porFecha).reverse();
}

/** Meses que tienen al menos un viaje activo, ordenados. */
export async function mesesConViajes() {
  const snap = await getDocs(refTrips());
  const meses = new Set(
    snap.docs.map((d) => d.data()).filter((v) => v.estado === 'activo').map((v) => v.mes)
  );
  return [...meses].sort();
}

export async function obtenerViaje(id) {
  const snap = await getDoc(refTrip(id));
  if (!snap.exists()) throw new ErrorApp('Este viaje ya no está disponible.', 'not-found');
  return aObjeto(snap);
}

// --- Cupos -----------------------------------------------------------------

/** Cupos que todavía se pueden confirmar. */
export function cuposDisponibles(viaje) {
  return Math.max(0, (viaje.cupoMaximo || 0) - (viaje.cuposConfirmados || 0));
}

export function estaLleno(viaje) {
  return cuposDisponibles(viaje) <= 0;
}

/** Porcentaje de ocupación, para la barra de progreso. */
export function ocupacion(viaje) {
  if (!viaje.cupoMaximo) return 0;
  return Math.min(100, Math.round((viaje.cuposConfirmados / viaje.cupoMaximo) * 100));
}

// --- Escritura (solo admin) -------------------------------------------------

/** Normaliza lo que viene del formulario antes de guardarlo. */
function normalizar(datos) {
  const fechaInicio = datos.fechaInicio;
  const fechaFin = datos.fechaFin || fechaInicio;
  return {
    destino: String(datos.destino || '').trim(),
    descripcion: String(datos.descripcion || '').trim(),
    itinerario: Array.isArray(datos.itinerario)
      ? datos.itinerario.map((l) => String(l).trim()).filter(Boolean)
      : [],
    incluye: Array.isArray(datos.incluye)
      ? datos.incluye.map((l) => String(l).trim()).filter(Boolean)
      : [],
    fechaInicio,
    fechaFin,
    mes: mesDe(fechaInicio),
    precio: Number(datos.precio) || 0,
    moneda: datos.moneda || 'USD',
    fotoUrl: String(datos.fotoUrl || '').trim(),
    cupoMaximo: Number.parseInt(datos.cupoMaximo, 10) || 1,
    estado: datos.estado || 'activo',
    puntoEncuentro: String(datos.puntoEncuentro || '').trim(),
  };
}

export async function crearViaje(datos) {
  const base = normalizar(datos);
  if (!base.destino) throw new ErrorApp('El destino es obligatorio.');
  if (!base.fechaInicio) throw new ErrorApp('La fecha de salida es obligatoria.');
  if (base.fechaFin < base.fechaInicio) {
    throw new ErrorApp('La fecha de regreso no puede ser anterior a la de salida.');
  }
  const ref = await addDoc(refTrips(), {
    ...base,
    cuposConfirmados: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function actualizarViaje(id, datos, viajeActual) {
  const base = normalizar(datos);
  if (base.fechaFin < base.fechaInicio) {
    throw new ErrorApp('La fecha de regreso no puede ser anterior a la de salida.');
  }
  // Regla dura: no se puede reducir el cupo por debajo de lo ya confirmado.
  const confirmados = viajeActual?.cuposConfirmados ?? 0;
  if (base.cupoMaximo < confirmados) {
    throw new ErrorApp(
      `No puedes bajar el cupo a ${base.cupoMaximo}: ya hay ${confirmados} ` +
        'personas con pago confirmado. Cancela alguna reserva primero.'
    );
  }
  await updateDoc(refTrip(id), { ...base, updatedAt: serverTimestamp() });
}

export async function eliminarViaje(id) {
  await deleteDoc(refTrip(id));
}

/**
 * Red de seguridad: recuenta `cuposConfirmados` a partir de las reservas
 * realmente confirmadas. Útil si alguna vez algo queda descuadrado.
 */
export async function recalcularCupos(id) {
  const reservas = await getDocs(
    query(collection(db, COL.bookings), where('tripId', '==', id), where('estado', '==', 'confirmada'))
  );
  const total = reservas.docs.reduce(
    (suma, d) => suma + (d.data().personasConfirmadas ?? d.data().cantidadPersonas ?? 0),
    0
  );
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(refTrip(id));
    if (!snap.exists()) throw new ErrorApp('El viaje ya no existe.');
    tx.update(refTrip(id), { cuposConfirmados: total, updatedAt: serverTimestamp() });
  });
  return total;
}
