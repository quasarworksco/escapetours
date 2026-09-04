/** Formateo de montos, teléfonos y textos. */
import { BRAND } from '../../config/brand.js';

/** 320 → "$320" · 320.5 → "$320,50" */
export function precio(monto, moneda = BRAND.reglas.moneda) {
  const n = Number(monto) || 0;
  const decimales = Number.isInteger(n) ? 0 : 2;
  const simbolo = moneda === BRAND.reglas.moneda ? BRAND.reglas.simboloMoneda : '';
  return simbolo + new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: decimales, maximumFractionDigits: 2,
  }).format(n) + (simbolo ? '' : ` ${moneda}`);
}

/** "0414-1234567" → "584141234567" (formato que exige wa.me). */
export function telefonoInternacional(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.startsWith('58')) return d;
  if (d.startsWith('0')) d = d.slice(1);          // 0414... → 414...
  return d.length === 10 ? '58' + d : d;
}

/** "584141234567" → "+58 414-123 4567" */
export function telefonoVisible(tel) {
  const d = telefonoInternacional(tel);
  if (d.length !== 12) return String(tel || '');
  return `+${d.slice(0, 2)} ${d.slice(2, 5)}-${d.slice(5, 8)} ${d.slice(8)}`;
}

/** Valida un móvil venezolano (0412/0414/0416/0424/0426 + 7 dígitos). */
export function telefonoValido(tel) {
  const d = telefonoInternacional(tel);
  return /^58(412|414|416|424|426|2\d\d)\d{7}$/.test(d);
}

export function emailValido(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

/** Evita inyectar HTML al pintar datos que escribió un cliente. */
export function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

/** Solo aceptamos URLs http(s) para las fotos de los viajes. */
export function urlImagenValida(url) {
  try {
    const u = new URL(String(url).trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function pluralizar(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}
