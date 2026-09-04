/** Formulario de reserva y pantalla de confirmación. */
import { el, conCarga } from '../utils/dom.js';
import { esc, precio, telefonoValido, emailValido } from '../utils/formato.js';
import { rangoFechas } from '../utils/fecha.js';
import { cuposDisponibles, estaLleno } from '../modelo/trips.js';
import { crearReserva } from '../modelo/bookings.js';
import { obtenerConfig, metodosActivos } from '../modelo/config.js';
import { mensajeDeError } from '../modelo/errores.js';
import { BRAND, linkWhatsApp } from '../../config/brand.js';

// ---------------------------------------------------------------------------
//  Formulario
// ---------------------------------------------------------------------------

export function montarFormulario(viaje, { onReservado }) {
  const form = el('#form-reserva');
  if (!form) return;

  const personas = el('#r-personas');
  const actualizarTotal = () => {
    const n = Math.max(1, Number.parseInt(personas.value, 10) || 1);
    el('#r-total').textContent = precio((viaje.precio || 0) * n, viaje.moneda);
    el('#r-total-detalle').textContent = n === 1 ? '1 persona' : `${n} personas`;
  };
  personas.addEventListener('input', actualizarTotal);
  actualizarTotal();

  form.addEventListener('submit', (evento) => enviar(evento, viaje, onReservado));
}

function marcarError(campo, mensaje) {
  const nodo = document.querySelector(`[data-error="${campo}"]`);
  const input = el(`#r-${campo}`);
  if (nodo) {
    nodo.textContent = mensaje || '';
    nodo.hidden = !mensaje;
  }
  if (input) input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  return !mensaje;
}

function validar(datos, viaje) {
  let ok = true;
  ok = marcarError('nombre',
    datos.nombre.trim().length < 2 ? 'Escribe tu nombre y apellido.' : '') && ok;
  ok = marcarError('telefono',
    !telefonoValido(datos.telefono) ? 'Revisa el número. Ej.: 0414-1234567' : '') && ok;
  ok = marcarError('email',
    !emailValido(datos.email) ? 'Ese correo no parece válido.' : '') && ok;

  const n = Number.parseInt(datos.personas, 10);
  const max = BRAND.reglas.maxPersonasPorReserva;
  let msgPersonas = '';
  if (!Number.isInteger(n) || n < 1) {
    msgPersonas = 'Indica al menos una persona.';
  } else if (n > max) {
    msgPersonas = `Para grupos de más de ${max} personas, escríbenos por WhatsApp.`;
  } else if (!estaLleno(viaje) && n > cuposDisponibles(viaje)) {
    msgPersonas = `Solo quedan ${cuposDisponibles(viaje)} cupos disponibles.`;
  }
  ok = marcarError('personas', msgPersonas) && ok;
  return ok;
}

async function enviar(evento, viaje, onReservado) {
  evento.preventDefault();
  const error = el('#r-error');
  error.hidden = true;

  const datos = {
    nombre: el('#r-nombre').value,
    telefono: el('#r-telefono').value,
    email: el('#r-email').value,
    personas: el('#r-personas').value,
    notas: el('#r-notas').value,
  };

  if (!validar(datos, viaje)) return;

  await conCarga(el('#btn-reservar'), async () => {
    try {
      const { id, esListaEspera } = await crearReserva({ viaje, ...datos });
      onReservado({ viaje, datos, id, esListaEspera });
    } catch (err) {
      error.textContent = mensajeDeError(err);
      error.hidden = false;
      error.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

// ---------------------------------------------------------------------------
//  Confirmación
// ---------------------------------------------------------------------------

export async function renderConfirmacion({ viaje, datos, esListaEspera }) {
  const cont = el('#vista-confirmacion');
  const personas = Number.parseInt(datos.personas, 10) || 1;
  const total = (viaje.precio || 0) * personas;
  const config = await obtenerConfig();

  const mensaje =
    `¡Hola ${BRAND.nombre}! Acabo de reservar por la web.\n\n` +
    `👤 ${datos.nombre}\n` +
    `🏝️ ${viaje.destino}\n` +
    `📅 ${rangoFechas(viaje.fechaInicio, viaje.fechaFin)}\n` +
    `👥 ${personas} ${personas === 1 ? 'persona' : 'personas'}\n` +
    `💰 Total: ${precio(total, viaje.moneda)}\n\n` +
    (esListaEspera
      ? 'Quedé en lista de espera. ¿Me avisan si se libera un cupo?'
      : 'Quedo atenta/o para coordinar el pago. ¡Gracias!');

  const metodos = config.mostrarDatosDePago ? metodosActivos(config) : [];

  cont.innerHTML = `
    <div class="et-contenedor pub-confirmacion">
      <div class="pub-confirmacion__icono">${esListaEspera ? '📝' : '🎉'}</div>
      <h1>${esc(esListaEspera ? BRAND.textos.listaEsperaTitulo : BRAND.textos.reservaTitulo)}</h1>
      <p>${esc(esListaEspera ? BRAND.textos.listaEsperaMensaje : BRAND.textos.reservaMensaje)}</p>

      <div class="pub-confirmacion__caja">
        <h2 style="font-size:var(--et-txt-lg)">Tu reserva</h2>
        <div class="pub-pago"><span class="pub-pago__nombre">Viaje</span>
          <span class="pub-pago__detalle">${esc(viaje.destino)}</span></div>
        <div class="pub-pago"><span class="pub-pago__nombre">Fecha</span>
          <span class="pub-pago__detalle">${esc(rangoFechas(viaje.fechaInicio, viaje.fechaFin))}</span></div>
        <div class="pub-pago"><span class="pub-pago__nombre">A nombre de</span>
          <span class="pub-pago__detalle">${esc(datos.nombre)}</span></div>
        <div class="pub-pago"><span class="pub-pago__nombre">Personas</span>
          <span class="pub-pago__detalle">${personas}</span></div>
        <div class="pub-pago"><span class="pub-pago__nombre">Total a pagar</span>
          <span class="pub-pago__detalle"><strong>${esc(precio(total, viaje.moneda))}</strong></span></div>
      </div>

      ${metodos.length && !esListaEspera ? `
        <div class="pub-confirmacion__caja">
          <h2 style="font-size:var(--et-txt-lg)">Cómo pagar</h2>
          ${metodos.map((m) => `
            <div class="pub-pago">
              <span class="pub-pago__nombre">${esc(m.nombre)}</span>
              <span class="pub-pago__detalle">${esc(m.detalle)}</span>
            </div>`).join('')}
          ${config.instruccionesPago ? `
            <p class="et-ayuda" style="margin-top:1rem">${esc(config.instruccionesPago)}</p>` : ''}
        </div>` : ''}

      <a class="et-btn et-btn--wa et-btn--bloque" style="margin-top:1.5rem"
         href="${esc(linkWhatsApp(mensaje))}" target="_blank" rel="noopener">
        Enviar mi reserva por WhatsApp
      </a>
      <p class="et-ayuda" style="margin-top:.75rem">
        El mensaje ya va escrito: solo pulsa enviar.
      </p>

      <p style="margin-top:2rem"><a href="#/">← Ver otros viajes</a></p>
    </div>`;
}
