/**
 * Estado compartido del panel.
 * Un store mínimo: carga los datos una vez, y avisa a las vistas cuando cambian.
 */
import { todosLosViajes } from '../modelo/trips.js';
import { todasLasReservas } from '../modelo/bookings.js';
import { obtenerConfig } from '../modelo/config.js';

export const estado = {
  viajes: [],
  reservas: [],
  config: null,
  cargando: true,
  error: null,
};

const oyentes = new Set();

export function alCambiar(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

function notificar() {
  for (const fn of oyentes) fn(estado);
}

export async function cargarTodo() {
  estado.cargando = true;
  estado.error = null;
  notificar();
  try {
    const [viajes, reservas, config] = await Promise.all([
      todosLosViajes(),
      todasLasReservas(),
      obtenerConfig({ refrescar: true }),
    ]);
    estado.viajes = viajes;
    estado.reservas = reservas;
    estado.config = config;
  } catch (err) {
    estado.error = err;
  } finally {
    estado.cargando = false;
    notificar();
  }
}

/** Recarga viajes y reservas tras una operación de escritura. */
export async function recargarDatos() {
  const [viajes, reservas] = await Promise.all([todosLosViajes(), todasLasReservas()]);
  estado.viajes = viajes;
  estado.reservas = reservas;
  notificar();
}

export function actualizarConfig(config) {
  estado.config = config;
  notificar();
}

/** Reservas de un viaje concreto (ya vienen todas en memoria). */
export function reservasDe(tripId) {
  return estado.reservas.filter((r) => r.tripId === tripId);
}

export function viajePorId(id) {
  return estado.viajes.find((v) => v.id === id) || null;
}
