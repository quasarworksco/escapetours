/** Pestaña "Reservas": filtros, verificación de pagos y control de cupos. */
import { el, crear, toast, conCarga, confirmar } from '../utils/dom.js';
import { esc, precio, telefonoVisible, pluralizar } from '../utils/formato.js';
import { fechaHora, fechaNumerica, diasDesde, hoyISO, rangoFechas } from '../utils/fecha.js';
import { cuposDisponibles, estaLleno } from '../modelo/trips.js';
import {
  ESTADOS, confirmarReserva, cancelarReserva, reabrirReserva, resumirReservas,
} from '../modelo/bookings.js';
import { metodosActivos } from '../modelo/config.js';
import { mensajeDeError } from '../modelo/errores.js';
import { BRAND, linkWhatsApp } from '../../config/brand.js';
import { estado, recargarDatos, viajePorId } from './estado.js';
import { nombreAdmin } from './auth.js';

const filtros = { tripId: '', estado: 'pendiente', texto: '' };
let reservaEnPago = null;

// ---------------------------------------------------------------------------
//  Listado
// ---------------------------------------------------------------------------

export function renderReservas() {
  const cont = el('#lista-reservas');
  if (!cont) return;

  sincronizarSelectorDeViajes();
  actualizarContadorPendientes();

  if (estado.cargando) {
    cont.innerHTML = '<div class="et-cargando">Cargando reservas…</div>';
    return;
  }

  const visibles = filtrar(estado.reservas);
  const total = resumirReservas(estado.reservas);
  el('#resumen-reservas').textContent =
    `${total.pendientes} pendientes · ${total.confirmadas} confirmadas ` +
    `(${total.personasConfirmadas} personas) · ${total.canceladas} canceladas`;

  if (!visibles.length) {
    cont.innerHTML = `
      <div class="et-vacio">
        <div class="et-vacio__emoji">📭</div>
        <p>No hay reservas que coincidan con este filtro.</p>
      </div>`;
    return;
  }

  cont.innerHTML = '';
  for (const reserva of visibles) cont.append(tarjetaReserva(reserva));
}

function filtrar(reservas) {
  const texto = filtros.texto.trim().toLowerCase();
  return reservas.filter((r) => {
    if (filtros.tripId && r.tripId !== filtros.tripId) return false;
    if (filtros.estado && r.estado !== filtros.estado) return false;
    if (texto) {
      const heno = `${r.nombreCliente} ${r.telefonoCliente} ${r.emailCliente || ''}`.toLowerCase();
      if (!heno.includes(texto)) return false;
    }
    return true;
  });
}

function sincronizarSelectorDeViajes() {
  const sel = el('#filtro-viaje');
  const firma = estado.viajes.map((v) => v.id).join(',');
  if (sel.dataset.firma === firma) return;
  sel.dataset.firma = firma;
  sel.innerHTML = '<option value="">Todos los viajes</option>';
  for (const v of estado.viajes) {
    sel.append(crear('option', {
      value: v.id,
      text: `${v.destino} — ${rangoFechas(v.fechaInicio, v.fechaFin)}`,
    }));
  }
  sel.value = filtros.tripId;
}

function actualizarContadorPendientes() {
  const contador = el('#contador-pendientes');
  const n = estado.reservas.filter((r) => r.estado === 'pendiente').length;
  contador.textContent = n;
  contador.hidden = n === 0;
}

function tarjetaReserva(reserva) {
  const viaje = viajePorId(reserva.tripId);
  const est = ESTADOS[reserva.estado] || ESTADOS.pendiente;
  const nodo = crear('article', { class: `admin-reserva admin-reserva--${reserva.estado}` });

  const personas = reserva.estado === 'confirmada'
    ? (reserva.personasConfirmadas ?? reserva.cantidadPersonas)
    : reserva.cantidadPersonas;

  // Una reserva pendiente en un viaje sin cupo es, de hecho, lista de espera.
  const enListaEspera =
    reserva.estado === 'pendiente' && viaje && cuposDisponibles(viaje) < reserva.cantidadPersonas;

  const dias = diasDesde(reserva.createdAt);
  const sinRespuesta =
    reserva.estado === 'pendiente' && dias >= BRAND.reglas.diasParaAvisoPendiente;

  const totalEstimado = viaje ? (viaje.precio || 0) * reserva.cantidadPersonas : null;

  nodo.innerHTML = `
    <div class="admin-reserva__fila">
      <div>
        <p class="admin-reserva__nombre">${esc(reserva.nombreCliente)}</p>
        <p class="admin-reserva__viaje">
          ${esc(reserva.tripDestino || viaje?.destino || 'Viaje eliminado')}
          ${viaje ? ` · ${esc(rangoFechas(viaje.fechaInicio, viaje.fechaFin))}` : ''}
        </p>
      </div>
      <div>
        <span class="et-chip ${est.chip}">${est.etiqueta}</span>
        ${enListaEspera ? '<span class="et-chip et-chip--sol">Lista de espera</span>' : ''}
        ${sinRespuesta ? `<span class="et-chip et-chip--error">Sin respuesta hace ${dias} d</span>` : ''}
      </div>
    </div>

    <dl class="admin-reserva__datos">
      <div class="admin-reserva__dato">
        <dt>Personas</dt><dd>${personas}</dd>
      </div>
      <div class="admin-reserva__dato">
        <dt>Teléfono</dt><dd>${esc(telefonoVisible(reserva.telefonoCliente))}</dd>
      </div>
      ${reserva.emailCliente ? `
      <div class="admin-reserva__dato">
        <dt>Correo</dt><dd>${esc(reserva.emailCliente)}</dd>
      </div>` : ''}
      ${totalEstimado !== null ? `
      <div class="admin-reserva__dato">
        <dt>Total estimado</dt><dd>${esc(precio(totalEstimado, viaje.moneda))}</dd>
      </div>` : ''}
      <div class="admin-reserva__dato">
        <dt>Reservó</dt><dd>${esc(fechaHora(reserva.createdAt))}</dd>
      </div>
    </dl>

    ${reserva.notasCliente ? `
      <p class="admin-reserva__notas">💬 ${esc(reserva.notasCliente)}</p>` : ''}

    ${reserva.estado === 'confirmada' && reserva.ultimoPago ? `
      <p class="admin-reserva__pago">
        ✅ ${esc(reserva.ultimoPago.metodoPago)} ·
        ${esc(precio(reserva.ultimoPago.montoPagado))} ·
        ${esc(fechaNumerica(reserva.ultimoPago.fechaPago))}
        ${reserva.ultimoPago.registradoPor ? `· registró ${esc(reserva.ultimoPago.registradoPor)}` : ''}
      </p>` : ''}

    ${reserva.estado === 'cancelada' && reserva.motivoCancelacion ? `
      <p class="admin-reserva__notas">Motivo: ${esc(reserva.motivoCancelacion)}</p>` : ''}

    <div class="admin-reserva__acciones"></div>`;

  const acciones = nodo.querySelector('.admin-reserva__acciones');

  acciones.append(crear('a', {
    class: 'et-btn et-btn--wa et-btn--sm',
    href: linkWhatsApp(mensajeParaCliente(reserva, viaje), reserva.telefonoCliente),
    target: '_blank',
    rel: 'noopener',
    text: 'WhatsApp',
  }));

  if (reserva.estado === 'pendiente') {
    acciones.append(crear('button', {
      class: 'et-btn et-btn--mar et-btn--sm',
      type: 'button',
      text: 'Confirmar pago',
      onclick: () => abrirModalPago(reserva, viaje),
    }));
    acciones.append(crear('button', {
      class: 'et-btn et-btn--peligro et-btn--sm',
      type: 'button',
      text: 'Cancelar',
      onclick: (e) => alCancelar(e.currentTarget, reserva),
    }));
  }

  if (reserva.estado === 'confirmada') {
    acciones.append(crear('button', {
      class: 'et-btn et-btn--peligro et-btn--sm',
      type: 'button',
      text: 'Cancelar y liberar cupo',
      onclick: (e) => alCancelar(e.currentTarget, reserva),
    }));
  }

  if (reserva.estado === 'cancelada') {
    acciones.append(crear('button', {
      class: 'et-btn et-btn--contorno et-btn--sm',
      type: 'button',
      text: 'Reabrir como pendiente',
      onclick: (e) => alReabrir(e.currentTarget, reserva),
    }));
  }

  return nodo;
}

function mensajeParaCliente(reserva, viaje) {
  const nombre = reserva.nombreCliente.split(' ')[0];
  if (reserva.estado === 'confirmada') {
    return `¡Hola ${nombre}! Tu cupo para ${reserva.tripDestino} está CONFIRMADO ✅ ` +
      'Cualquier duda nos escribes por aquí.';
  }
  const total = viaje ? ` El total son ${precio((viaje.precio || 0) * reserva.cantidadPersonas)}.` : '';
  return `¡Hola ${nombre}! Te escribimos de ${BRAND.nombre} por tu reserva de ` +
    `${reserva.cantidadPersonas} ${reserva.cantidadPersonas === 1 ? 'persona' : 'personas'} ` +
    `para ${reserva.tripDestino}.${total} ¿Coordinamos el pago?`;
}

async function alCancelar(boton, reserva) {
  const aviso = reserva.estado === 'confirmada'
    ? `\n\nSe liberarán ${reserva.personasConfirmadas ?? reserva.cantidadPersonas} cupos del viaje.`
    : '';
  if (!confirmar(`¿Cancelar la reserva de ${reserva.nombreCliente}?${aviso}`)) return;
  const motivo = window.prompt('Motivo (opcional):', '') ?? '';
  await conCarga(boton, async () => {
    try {
      await cancelarReserva(reserva.id, motivo);
      await recargarDatos();
      toast('Reserva cancelada.', 'ok');
    } catch (err) {
      toast(mensajeDeError(err), 'error');
    }
  });
}

async function alReabrir(boton, reserva) {
  await conCarga(boton, async () => {
    try {
      await reabrirReserva(reserva.id);
      await recargarDatos();
      toast('Reserva reabierta como pendiente.', 'ok');
    } catch (err) {
      toast(mensajeDeError(err), 'error');
    }
  });
}

// ---------------------------------------------------------------------------
//  Modal de confirmación de pago
// ---------------------------------------------------------------------------

function abrirModalPago(reserva, viaje) {
  reservaEnPago = reserva;
  const disponibles = viaje ? cuposDisponibles(viaje) : 0;
  const totalEsperado = viaje ? (viaje.precio || 0) * reserva.cantidadPersonas : 0;

  el('#pago-resumen').innerHTML = `
    <strong>${esc(reserva.nombreCliente)}</strong>
    ${esc(reserva.tripDestino)} ·
    ${pluralizar(reserva.cantidadPersonas, 'persona solicitada', 'personas solicitadas')} ·
    total esperado ${esc(precio(totalEsperado, viaje?.moneda))}
    <br>Cupos libres en el viaje: <strong>${disponibles}</strong> de ${viaje?.cupoMaximo ?? '?'}`;

  const selector = el('#pago-metodo');
  selector.innerHTML = '';
  const metodos = metodosActivos(estado.config);
  for (const m of metodos) selector.append(crear('option', { value: m.nombre, text: m.nombre }));
  selector.append(crear('option', { value: 'Otro', text: 'Otro' }));

  el('#pago-fecha').value = hoyISO();
  el('#pago-fecha').max = hoyISO();
  el('#pago-monto').value = totalEsperado || '';
  el('#pago-monto-ayuda').textContent =
    `Total esperado: ${precio(totalEsperado, viaje?.moneda)}. Si abonó parcial, escribe lo recibido.`;
  el('#pago-personas').value = Math.min(reserva.cantidadPersonas, Math.max(disponibles, 1));
  el('#pago-personas').max = Math.max(disponibles, 1);
  el('#pago-personas-ayuda').textContent =
    `Solicitó ${reserva.cantidadPersonas}. Máximo confirmable ahora: ${disponibles}.`;
  el('#pago-notas').value = '';

  const error = el('#pago-error');
  error.hidden = true;
  if (viaje && estaLleno(viaje)) {
    error.textContent =
      'Este viaje ya está lleno. Para confirmar esta reserva primero cancela otra ' +
      'o amplía el cupo máximo desde la pestaña Viajes.';
    error.hidden = false;
  }

  el('#modal-pago').showModal();
}

async function guardarPago(evento) {
  evento.preventDefault();
  const error = el('#pago-error');
  error.hidden = true;

  const datos = {
    metodoPago: el('#pago-metodo').value,
    fechaPago: el('#pago-fecha').value,
    montoPagado: el('#pago-monto').value,
    personasConfirmadas: el('#pago-personas').value,
    notas: el('#pago-notas').value,
    registradoPor: nombreAdmin(),
  };

  await conCarga(el('#btn-guardar-pago'), async () => {
    try {
      await confirmarReserva(reservaEnPago.id, datos);
      el('#modal-pago').close();
      await recargarDatos();
      toast(`Reserva de ${reservaEnPago.nombreCliente} confirmada.`, 'ok');
    } catch (err) {
      error.textContent = mensajeDeError(err);
      error.hidden = false;
    }
  });
}

// ---------------------------------------------------------------------------

export function initReservas() {
  el('#filtro-viaje').addEventListener('change', (e) => {
    filtros.tripId = e.target.value;
    renderReservas();
  });
  el('#filtro-estado').addEventListener('change', (e) => {
    filtros.estado = e.target.value;
    renderReservas();
  });
  el('#filtro-busqueda').addEventListener('input', (e) => {
    filtros.texto = e.target.value;
    renderReservas();
  });
  el('#form-pago').addEventListener('submit', guardarPago);
  for (const btn of el('#modal-pago').querySelectorAll('[data-cerrar]')) {
    btn.addEventListener('click', () => el('#modal-pago').close());
  }
}

/** Permite saltar desde una tarjeta de viaje directo a sus reservas. */
export function filtrarPorViaje(tripId) {
  filtros.tripId = tripId;
  filtros.estado = '';
  el('#filtro-viaje').value = tripId;
  el('#filtro-estado').value = '';
  renderReservas();
}
