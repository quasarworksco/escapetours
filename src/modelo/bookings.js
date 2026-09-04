/**
 * Reservas (colección `bookings`) y pagos (subcolección `bookings/{id}/pagos`).
 *
 * ---------------------------------------------------------------------------
 *  CICLO DE VIDA
 * ---------------------------------------------------------------------------
 *    [cliente reserva]
 *           │
 *           ▼
 *      PENDIENTE ───── admin verifica el pago ─────▶ CONFIRMADA
 *           │                                       (descuenta cupo + registra pago)
 *           └───────── admin rechaza / no pagó ────▶ CANCELADA
 *                                                    (devuelve el cupo si lo tenía)
 *
 *  Una reserva pendiente NO retiene cupo: el cupo solo se descuenta al
 *  confirmar el pago. Por eso siempre se pueden recibir reservas, incluso con
 *  el viaje lleno — esas quedan como LISTA DE ESPERA.
 *
 * ---------------------------------------------------------------------------
 *  CONDICIONES DE CARRERA
 * ---------------------------------------------------------------------------
 *  Firestore no tiene transacciones SQL, pero sí `runTransaction`, que lee y
 *  escribe de forma atómica y reintenta automáticamente si el documento cambió
 *  entre la lectura y la escritura. Toda operación que mueva `cuposConfirmados`
 *  pasa por una transacción que:
 *      1. lee el viaje y la reserva,
 *      2. valida el límite duro (confirmados + nuevas <= cupoMaximo),
 *      3. escribe reserva + viaje + pago en un solo commit.
 *  Si dos admins confirman la última plaza a la vez, la segunda transacción
 *  reintenta, relee el contador ya actualizado y falla con ErrorCupo. Nunca se
 *  supera el máximo.
 */
import {
  collection, doc, setDoc, getDocs, query, where,
  serverTimestamp, runTransaction, deleteField,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db, COL } from '../firebase.js';
import { ErrorApp, ErrorCupo } from './errores.js';
import { telefonoInternacional, telefonoValido, emailValido } from '../utils/formato.js';
import { BRAND } from '../../config/brand.js';

export const ESTADOS = {
  pendiente: { etiqueta: 'Pendiente', chip: 'et-chip--espera' },
  confirmada: { etiqueta: 'Confirmada', chip: 'et-chip--ok' },
  cancelada: { etiqueta: 'Cancelada', chip: 'et-chip--error' },
};

const refBookings = () => collection(db, COL.bookings);
const refBooking = (id) => doc(db, COL.bookings, id);
const refTrip = (id) => doc(db, COL.trips, id);

const aObjeto = (snap) => ({ id: snap.id, ...snap.data() });
const porFechaDesc = (a, b) =>
  (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);

// ---------------------------------------------------------------------------
//  Creación (pública, sin sesión)
// ---------------------------------------------------------------------------

/**
 * Crea una reserva en estado "pendiente".
 * No toca el cupo del viaje: solo registra la solicitud.
 *
 * @returns {{ id: string, esListaEspera: boolean }}
 */
export async function crearReserva({ viaje, nombre, telefono, email, personas, notas }) {
  const nombreLimpio = String(nombre || '').trim();
  const cantidad = Number.parseInt(personas, 10);
  const max = BRAND.reglas.maxPersonasPorReserva;

  if (nombreLimpio.length < 2) throw new ErrorApp('Escribe tu nombre completo.');
  if (!telefonoValido(telefono)) {
    throw new ErrorApp('El teléfono no parece válido. Usa el formato 0414-1234567.');
  }
  if (!emailValido(email)) throw new ErrorApp('El correo no tiene un formato válido.');
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > max) {
    throw new ErrorApp(`La cantidad de personas debe estar entre 1 y ${max}.`);
  }
  if (viaje.estado !== 'activo') {
    throw new ErrorApp('Este viaje ya no está recibiendo reservas.');
  }

  const esListaEspera =
    (viaje.cupoMaximo || 0) - (viaje.cuposConfirmados || 0) < cantidad;

  // Una reserva pendiente no mueve ningún contador: no hace falta transacción.
  const ref = doc(refBookings());
  await setDoc(ref, {
    tripId: viaje.id,
    tripDestino: viaje.destino,
    tripFechaInicio: viaje.fechaInicio,
    tripFechaFin: viaje.fechaFin,
    tripPrecio: viaje.precio,
    nombreCliente: nombreLimpio,
    telefonoCliente: telefonoInternacional(telefono),
    emailCliente: String(email || '').trim(),
    cantidadPersonas: cantidad,
    notasCliente: String(notas || '').trim(),
    estado: 'pendiente',
    origen: 'web',
    createdAt: serverTimestamp(),
  });

  return { id: ref.id, esListaEspera };
}

// ---------------------------------------------------------------------------
//  Lectura (solo admin)
// ---------------------------------------------------------------------------

export async function reservasDelViaje(tripId) {
  const snap = await getDocs(query(refBookings(), where('tripId', '==', tripId)));
  return snap.docs.map(aObjeto).sort(porFechaDesc);
}

export async function todasLasReservas() {
  const snap = await getDocs(refBookings());
  return snap.docs.map(aObjeto).sort(porFechaDesc);
}

export async function pagosDeReserva(bookingId) {
  const snap = await getDocs(collection(refBooking(bookingId), COL.pagos));
  return snap.docs.map(aObjeto).sort(porFechaDesc);
}

/** Resumen de personas por estado, para las tarjetas del panel. */
export function resumirReservas(reservas) {
  const r = { pendientes: 0, confirmadas: 0, canceladas: 0, personasPendientes: 0, personasConfirmadas: 0 };
  for (const b of reservas) {
    if (b.estado === 'pendiente') {
      r.pendientes += 1;
      r.personasPendientes += b.cantidadPersonas || 0;
    } else if (b.estado === 'confirmada') {
      r.confirmadas += 1;
      r.personasConfirmadas += b.personasConfirmadas ?? b.cantidadPersonas ?? 0;
    } else if (b.estado === 'cancelada') {
      r.canceladas += 1;
    }
  }
  return r;
}

// ---------------------------------------------------------------------------
//  Confirmación de pago (transaccional)
// ---------------------------------------------------------------------------

/**
 * Marca una reserva como confirmada, descuenta los cupos y registra el pago.
 *
 * @param {string} bookingId
 * @param {object} pago  { metodoPago, fechaPago: 'YYYY-MM-DD', montoPagado,
 *                         personasConfirmadas, notas, registradoPor }
 */
export async function confirmarReserva(bookingId, pago) {
  const personas = Number.parseInt(pago.personasConfirmadas, 10);
  if (!Number.isInteger(personas) || personas < 1) {
    throw new ErrorApp('Indica cuántas personas quedan confirmadas.');
  }
  if (!pago.metodoPago) throw new ErrorApp('Selecciona el método de pago.');
  if (!pago.fechaPago) throw new ErrorApp('Indica la fecha en que se realizó el pago.');
  const monto = Number(pago.montoPagado);
  if (!Number.isFinite(monto) || monto < 0) throw new ErrorApp('El monto pagado no es válido.');

  await runTransaction(db, async (tx) => {
    // --- 1. Lecturas (en Firestore van todas antes de cualquier escritura) --
    const bSnap = await tx.get(refBooking(bookingId));
    if (!bSnap.exists()) throw new ErrorApp('La reserva ya no existe.');
    const reserva = bSnap.data();
    if (reserva.estado === 'confirmada') {
      throw new ErrorApp('Esta reserva ya estaba confirmada.');
    }

    const tSnap = await tx.get(refTrip(reserva.tripId));
    if (!tSnap.exists()) throw new ErrorApp('El viaje de esta reserva ya no existe.');
    const viaje = tSnap.data();

    // --- 2. Límite duro de cupos -------------------------------------------
    const disponibles = (viaje.cupoMaximo || 0) - (viaje.cuposConfirmados || 0);
    if (personas > disponibles) {
      throw new ErrorCupo(
        disponibles <= 0
          ? `"${viaje.destino}" ya está lleno (${viaje.cupoMaximo}/${viaje.cupoMaximo}). ` +
            'Cancela otra reserva o amplía el cupo máximo del viaje.'
          : `Solo quedan ${disponibles} cupos disponibles y estás confirmando ${personas}.`,
        disponibles
      );
    }

    // --- 3. Escrituras atómicas --------------------------------------------
    tx.update(refTrip(reserva.tripId), {
      cuposConfirmados: (viaje.cuposConfirmados || 0) + personas,
      updatedAt: serverTimestamp(),
    });

    tx.update(refBooking(bookingId), {
      estado: 'confirmada',
      personasConfirmadas: personas,
      confirmadaEn: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Resumen denormalizado para que el panel muestre el pago sin tener que
      // leer la subcolección reserva por reserva.
      ultimoPago: {
        metodoPago: String(pago.metodoPago),
        fechaPago: String(pago.fechaPago),
        montoPagado: monto,
        registradoPor: String(pago.registradoPor || 'admin'),
      },
    });

    tx.set(doc(collection(refBooking(bookingId), COL.pagos)), {
      metodoPago: String(pago.metodoPago),
      fechaPago: String(pago.fechaPago),
      montoPagado: monto,
      personasConfirmadas: personas,
      notas: String(pago.notas || '').trim(),
      registradoPor: String(pago.registradoPor || 'admin'),
      createdAt: serverTimestamp(),
    });
  });
}

// ---------------------------------------------------------------------------
//  Cancelación (transaccional: devuelve el cupo si estaba confirmada)
// ---------------------------------------------------------------------------

export async function cancelarReserva(bookingId, motivo = '') {
  await runTransaction(db, async (tx) => {
    const bSnap = await tx.get(refBooking(bookingId));
    if (!bSnap.exists()) throw new ErrorApp('La reserva ya no existe.');
    const reserva = bSnap.data();
    if (reserva.estado === 'cancelada') return;

    let viaje = null;
    if (reserva.estado === 'confirmada') {
      const tSnap = await tx.get(refTrip(reserva.tripId));
      viaje = tSnap.exists() ? tSnap.data() : null;
    }

    if (viaje) {
      const liberados = reserva.personasConfirmadas ?? reserva.cantidadPersonas ?? 0;
      tx.update(refTrip(reserva.tripId), {
        cuposConfirmados: Math.max(0, (viaje.cuposConfirmados || 0) - liberados),
        updatedAt: serverTimestamp(),
      });
    }

    tx.update(refBooking(bookingId), {
      estado: 'cancelada',
      motivoCancelacion: String(motivo || '').trim(),
      canceladaEn: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

/** Devuelve una reserva cancelada al estado pendiente (libera el cupo si aplica). */
export async function reabrirReserva(bookingId) {
  await runTransaction(db, async (tx) => {
    const bSnap = await tx.get(refBooking(bookingId));
    if (!bSnap.exists()) throw new ErrorApp('La reserva ya no existe.');
    const reserva = bSnap.data();
    if (reserva.estado === 'pendiente') return;

    if (reserva.estado === 'confirmada') {
      const tSnap = await tx.get(refTrip(reserva.tripId));
      if (tSnap.exists()) {
        const liberados = reserva.personasConfirmadas ?? reserva.cantidadPersonas ?? 0;
        tx.update(refTrip(reserva.tripId), {
          cuposConfirmados: Math.max(0, (tSnap.data().cuposConfirmados || 0) - liberados),
          updatedAt: serverTimestamp(),
        });
      }
    }

    tx.update(refBooking(bookingId), {
      estado: 'pendiente',
      personasConfirmadas: deleteField(),
      updatedAt: serverTimestamp(),
    });
  });
}
