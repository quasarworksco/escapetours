/**
 * Utilidades de fecha para Venezuela (America/Caracas).
 *
 * CONVENCIÓN IMPORTANTE:
 * Las fechas de los viajes se guardan como STRING "YYYY-MM-DD" (fecha civil),
 * no como Timestamp. Un viaje "sale el 14 de marzo" no tiene hora, y guardarlo
 * como Timestamp obliga a pelear con UTC (el 14 se convierte en 13 a las 20:00
 * hora de Caracas). Los campos de auditoría (createdAt, fechaPago) sí usan
 * Timestamp real de Firestore.
 */

export const ZONA = 'America/Caracas';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * Convierte "YYYY-MM-DD" en un Date anclado a UTC.
 * Formatearlo siempre con timeZone:'UTC' garantiza que el día no se corra.
 */
function aDateUTC(iso) {
  const [a, m, d] = String(iso).split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

/** Fecha de hoy en Caracas, como "YYYY-MM-DD". */
export function hoyISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());
}

/** Mes actual en Caracas, como "YYYY-MM". */
export function mesActual() {
  return hoyISO().slice(0, 7);
}

/** "2026-03" → "Marzo 2026" */
export function nombreMes(ym) {
  const [a, m] = ym.split('-').map(Number);
  const nombre = MESES[m - 1];
  return `${nombre[0].toUpperCase()}${nombre.slice(1)} ${a}`;
}

/** Desplaza un mes "YYYY-MM" en N meses (positivo o negativo). */
export function desplazarMes(ym, delta) {
  const [a, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "2026-03-14" → "14 de marzo" (sin año). */
export function fechaCorta(iso) {
  const d = aDateUTC(iso);
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
}

/** "2026-03-14" → "sábado, 14 de marzo de 2026". */
export function fechaLarga(iso) {
  return new Intl.DateTimeFormat('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(aDateUTC(iso));
}

/**
 * Rango legible entre dos fechas civiles.
 *   mismo día      → "sábado, 14 de marzo de 2026"
 *   mismo mes      → "14 al 16 de marzo de 2026"
 *   distinto mes   → "28 de febrero al 2 de marzo de 2026"
 */
export function rangoFechas(inicio, fin) {
  if (!fin || fin === inicio) return fechaLarga(inicio);
  const a = aDateUTC(inicio);
  const b = aDateUTC(fin);
  const anio = b.getUTCFullYear();
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === anio) {
    return `${a.getUTCDate()} al ${b.getUTCDate()} de ${MESES[b.getUTCMonth()]} de ${anio}`;
  }
  return `${fechaCorta(inicio)} al ${fechaCorta(fin)} de ${anio}`;
}

/** Cantidad de días que dura el viaje (inclusive). */
export function duracionEnDias(inicio, fin) {
  if (!fin || fin === inicio) return 1;
  const ms = aDateUTC(fin) - aDateUTC(inicio);
  return Math.round(ms / 86400000) + 1;
}

/** true si la fecha civil ya pasó (comparada con hoy en Caracas). */
export function yaPaso(iso) {
  return iso < hoyISO();
}

/** Timestamp de Firestore (o Date) → "14/03/2026, 3:20 p. m." */
export function fechaHora(ts) {
  if (!ts) return '—';
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: ZONA,
  }).format(d);
}

/** Días transcurridos desde un Timestamp de Firestore. */
export function diasDesde(ts) {
  if (!ts) return 0;
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

/** Mes ("YYYY-MM") al que pertenece una fecha civil. Se guarda denormalizado. */
export function mesDe(iso) {
  return String(iso).slice(0, 7);
}
