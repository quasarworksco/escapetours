/** Pestaña "Viajes": listado con control de cupos y formulario de alta/edición. */
import { el, crear, toast, conCarga, confirmar } from '../utils/dom.js';
import { esc, precio, urlImagenValida, pluralizar } from '../utils/formato.js';
import { rangoFechas, hoyISO, yaPaso, duracionEnDias } from '../utils/fecha.js';
import {
  crearViaje, actualizarViaje, eliminarViaje, recalcularCupos,
  cuposDisponibles, estaLleno, ocupacion,
} from '../modelo/trips.js';
import { resumirReservas } from '../modelo/bookings.js';
import { mensajeDeError } from '../modelo/errores.js';
import { BRAND } from '../../config/brand.js';
import { estado, recargarDatos, reservasDe } from './estado.js';

let viajeEnEdicion = null;
let irAReservas = () => {};

// ---------------------------------------------------------------------------
//  Listado
// ---------------------------------------------------------------------------

export function renderViajes() {
  const cont = el('#lista-viajes');
  const resumen = el('#resumen-viajes');
  if (!cont) return;

  if (estado.cargando) {
    cont.innerHTML = '<div class="et-cargando">Cargando viajes…</div>';
    return;
  }

  const activos = estado.viajes.filter((v) => v.estado === 'activo');
  const proximos = activos.filter((v) => !yaPaso(v.fechaFin || v.fechaInicio));
  resumen.textContent =
    `${pluralizar(estado.viajes.length, 'viaje en total', 'viajes en total')} · ` +
    `${proximos.length} próximos · ${activos.length - proximos.length} ya realizados`;

  if (!estado.viajes.length) {
    cont.innerHTML = `
      <div class="et-vacio">
        <div class="et-vacio__emoji">🗺️</div>
        <p>Todavía no hay viajes cargados.<br>Crea el primero con el botón <strong>+ Nuevo viaje</strong>.</p>
      </div>`;
    return;
  }

  cont.innerHTML = '';
  for (const viaje of estado.viajes) cont.append(tarjetaViaje(viaje));
}

function tarjetaViaje(viaje) {
  const res = resumirReservas(reservasDe(viaje.id));
  const disponibles = cuposDisponibles(viaje);
  const pct = ocupacion(viaje);
  const lleno = estaLleno(viaje);
  const casi = !lleno && disponibles <= BRAND.reglas.umbralUltimosCupos;

  const clases = ['admin-viaje'];
  if (viaje.estado !== 'activo') clases.push('admin-viaje--inactivo');
  if (lleno) clases.push('admin-viaje--lleno');

  const nodo = crear('article', { class: clases.join(' ') });

  const foto = urlImagenValida(viaje.fotoUrl)
    ? `<img class="admin-viaje__foto" src="${esc(viaje.fotoUrl)}" alt="" loading="lazy"
            onerror="this.style.display='none'">`
    : '';

  const chipEstado = {
    activo: '',
    cancelado: '<span class="et-chip et-chip--error">Cancelado</span>',
    finalizado: '<span class="et-chip et-chip--neutro">Finalizado</span>',
  }[viaje.estado] || '';

  const chipCupo = lleno
    ? '<span class="et-chip et-chip--error">Lleno</span>'
    : casi
      ? '<span class="et-chip et-chip--sol">Últimos cupos</span>'
      : '';

  const avisoEspera = res.personasPendientes > 0 && lleno
    ? `<p class="admin-cupos__nota">⚠️ ${pluralizar(res.personasPendientes, 'persona', 'personas')}
       en lista de espera.</p>`
    : res.personasPendientes > 0
      ? `<p class="admin-cupos__nota">${pluralizar(res.personasPendientes, 'persona pendiente', 'personas pendientes')}
         de verificar pago.</p>`
      : '';

  const dias = duracionEnDias(viaje.fechaInicio, viaje.fechaFin);

  nodo.innerHTML = `
    ${foto}
    <div class="admin-viaje__cuerpo">
      <div class="admin-viaje__titulo">
        <h3>${esc(viaje.destino)}</h3>
        <div>${chipEstado} ${chipCupo}</div>
      </div>
      <p class="admin-viaje__meta">
        ${esc(rangoFechas(viaje.fechaInicio, viaje.fechaFin))}
        ${dias > 1 ? `· ${dias} días` : ''}
        <br><span class="admin-viaje__precio">${esc(precio(viaje.precio, viaje.moneda))}</span> por persona
      </p>

      <div class="admin-cupos">
        <div class="admin-cupos__cifras">
          <span><strong>${viaje.cuposConfirmados || 0}</strong> / ${viaje.cupoMaximo} confirmados</span>
          <span>${lleno ? 'Sin cupos' : `${disponibles} libres`}</span>
        </div>
        <div class="admin-cupos__barra">
          <div class="admin-cupos__relleno ${lleno ? 'admin-cupos__relleno--lleno' : casi ? 'admin-cupos__relleno--casi' : ''}"
               style="width:${pct}%"></div>
        </div>
        ${avisoEspera}
        <button class="admin-cupos__enlace" type="button" data-accion="recalcular"
                title="Recuenta los cupos a partir de las reservas confirmadas">
          Recalcular cupos
        </button>
      </div>
    </div>
    <div class="admin-viaje__acciones">
      <button class="et-btn et-btn--mar et-btn--sm" data-accion="reservas">
        Reservas${res.pendientes ? ` (${res.pendientes} pend.)` : ''}
      </button>
      <button class="et-btn et-btn--contorno et-btn--sm" data-accion="editar">Editar</button>
      <button class="et-btn et-btn--peligro et-btn--sm" data-accion="eliminar">Eliminar</button>
    </div>`;

  nodo.querySelector('[data-accion="reservas"]')
    .addEventListener('click', () => irAReservas(viaje.id));
  nodo.querySelector('[data-accion="editar"]')
    .addEventListener('click', () => abrirModalViaje(viaje));
  nodo.querySelector('[data-accion="recalcular"]')
    .addEventListener('click', (e) => alRecalcular(e.currentTarget, viaje));
  nodo.querySelector('[data-accion="eliminar"]')
    .addEventListener('click', () => alEliminar(viaje, res));

  return nodo;
}

async function alRecalcular(boton, viaje) {
  await conCarga(boton, async () => {
    try {
      const total = await recalcularCupos(viaje.id);
      await recargarDatos();
      toast(`Cupos recalculados: ${total} confirmados en ${viaje.destino}.`, 'ok');
    } catch (err) {
      toast(mensajeDeError(err), 'error');
    }
  });
}

async function alEliminar(viaje, resumen) {
  const total = resumen.pendientes + resumen.confirmadas;
  const advertencia = total
    ? `\n\n⚠️ Este viaje tiene ${total} reservas asociadas. Las reservas NO se borran ` +
      'y quedarán apuntando a un viaje inexistente. Si el viaje no se va a realizar, ' +
      'es mejor marcarlo como "Cancelado" desde Editar.'
    : '';
  if (!confirmar(`¿Eliminar definitivamente "${viaje.destino}"?${advertencia}`)) return;
  try {
    await eliminarViaje(viaje.id);
    await recargarDatos();
    toast('Viaje eliminado.', 'ok');
  } catch (err) {
    toast(mensajeDeError(err), 'error');
  }
}

// ---------------------------------------------------------------------------
//  Formulario
// ---------------------------------------------------------------------------

const campo = (id) => el(`#viaje-${id}`);

export function abrirModalViaje(viaje = null) {
  viajeEnEdicion = viaje;
  const modal = el('#modal-viaje');

  el('#modal-viaje-titulo').textContent = viaje ? `Editar ${viaje.destino}` : 'Nuevo viaje';
  el('#viaje-error').hidden = true;

  campo('destino').value = viaje?.destino || '';
  campo('fecha-inicio').value = viaje?.fechaInicio || hoyISO();
  campo('fecha-fin').value = viaje?.fechaFin && viaje.fechaFin !== viaje.fechaInicio
    ? viaje.fechaFin : '';
  campo('precio').value = viaje?.precio ?? '';
  campo('cupo').value = viaje?.cupoMaximo ?? 20;
  campo('foto').value = viaje?.fotoUrl || '';
  campo('descripcion').value = viaje?.descripcion || '';
  campo('incluye').value = (viaje?.incluye || []).join('\n');
  campo('itinerario').value = (viaje?.itinerario || []).join('\n');
  campo('punto').value = viaje?.puntoEncuentro || '';
  campo('estado').value = viaje?.estado || 'activo';

  const confirmados = viaje?.cuposConfirmados || 0;
  el('#viaje-cupo-ayuda').textContent = confirmados
    ? `Ya hay ${confirmados} personas confirmadas: el cupo no puede bajar de ahí.`
    : '';

  actualizarPreview();
  modal.showModal();
  campo('destino').focus();
}

function actualizarPreview() {
  const img = el('#viaje-foto-preview');
  const url = campo('foto').value.trim();
  if (urlImagenValida(url)) {
    img.src = url;
    img.hidden = false;
  } else {
    img.hidden = true;
  }
}

async function guardar(evento) {
  evento.preventDefault();
  const error = el('#viaje-error');
  error.hidden = true;

  const datos = {
    destino: campo('destino').value,
    fechaInicio: campo('fecha-inicio').value,
    fechaFin: campo('fecha-fin').value || campo('fecha-inicio').value,
    precio: campo('precio').value,
    cupoMaximo: campo('cupo').value,
    fotoUrl: campo('foto').value,
    descripcion: campo('descripcion').value,
    incluye: campo('incluye').value.split('\n'),
    itinerario: campo('itinerario').value.split('\n'),
    puntoEncuentro: campo('punto').value,
    estado: campo('estado').value,
  };

  if (datos.fotoUrl && !urlImagenValida(datos.fotoUrl)) {
    error.textContent = 'La URL de la foto debe empezar por http:// o https://';
    error.hidden = false;
    return;
  }

  await conCarga(el('#btn-guardar-viaje'), async () => {
    try {
      if (viajeEnEdicion) {
        await actualizarViaje(viajeEnEdicion.id, datos, viajeEnEdicion);
        toast('Viaje actualizado.', 'ok');
      } else {
        await crearViaje(datos);
        toast('Viaje creado.', 'ok');
      }
      el('#modal-viaje').close();
      await recargarDatos();
    } catch (err) {
      error.textContent = mensajeDeError(err);
      error.hidden = false;
    }
  });
}

// ---------------------------------------------------------------------------

export function initViajes({ onVerReservas }) {
  irAReservas = onVerReservas;
  el('#btn-nuevo-viaje').addEventListener('click', () => abrirModalViaje());
  el('#form-viaje').addEventListener('submit', guardar);
  campo('foto').addEventListener('input', actualizarPreview);
  el('#viaje-foto-preview').addEventListener('error', (e) => { e.target.hidden = true; });

  // La fecha de regreso nunca antes de la salida.
  campo('fecha-inicio').addEventListener('change', () => {
    campo('fecha-fin').min = campo('fecha-inicio').value;
  });

  for (const btn of el('#modal-viaje').querySelectorAll('[data-cerrar]')) {
    btn.addEventListener('click', () => el('#modal-viaje').close());
  }
}
