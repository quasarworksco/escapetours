/** Calendario público: viajes del mes seleccionado. */
import { el, crear } from '../utils/dom.js';
import { esc, precio, urlImagenValida } from '../utils/formato.js';
import {
  mesActual, nombreMes, desplazarMes, rangoCorto, duracionEnDias, yaPaso,
} from '../utils/fecha.js';
import { viajesDelMes, mesesConViajes, cuposDisponibles, estaLleno } from '../modelo/trips.js';
import { mensajeDeError } from '../modelo/errores.js';
import { BRAND } from '../../config/brand.js';

let mes = mesActual();
let mesesDisponibles = [];
let irADetalle = () => {};

export async function initCalendario({ onVerViaje }) {
  irADetalle = onVerViaje;
  el('#mes-anterior').addEventListener('click', () => cambiarMes(-1));
  el('#mes-siguiente').addEventListener('click', () => cambiarMes(1));

  try {
    mesesDisponibles = await mesesConViajes();
  } catch (err) {
    console.warn('[Escape Tours] No se pudo listar los meses con viajes', err);
  }
  // Si el mes actual no tiene viajes, saltamos al primer mes futuro que sí tenga.
  const futuros = mesesDisponibles.filter((m) => m >= mesActual());
  if (!mesesDisponibles.includes(mes) && futuros.length) mes = futuros[0];

  await pintar();
}

function cambiarMes(delta) {
  mes = desplazarMes(mes, delta);
  pintar();
}

function actualizarFlechas() {
  // No dejamos navegar más allá de donde hay viajes (± un mes de margen).
  const min = mesesDisponibles[0] || mesActual();
  const max = mesesDisponibles.at(-1) || mesActual();
  el('#mes-anterior').disabled = mes <= desplazarMes(min, 0);
  el('#mes-siguiente').disabled = mes >= desplazarMes(max, 0);
}

async function pintar() {
  const cont = el('#lista-viajes');
  el('#mes-actual').textContent = nombreMes(mes);
  actualizarFlechas();

  cont.innerHTML = '<div class="et-esqueleto pub-esqueleto"></div>'.repeat(3);

  let viajes = [];
  try {
    viajes = await viajesDelMes(mes);
  } catch (err) {
    cont.innerHTML = `<div class="et-aviso et-aviso--error">${esc(mensajeDeError(err))}</div>`;
    return;
  }

  // Los viajes que ya salieron no se muestran en el mes en curso.
  viajes = viajes.filter((v) => !yaPaso(v.fechaFin || v.fechaInicio));

  if (!viajes.length) {
    cont.innerHTML = `
      <div class="et-vacio">
        <div class="et-vacio__emoji">🏝️</div>
        <p>${esc(BRAND.textos.sinViajes)}</p>
      </div>`;
    return;
  }

  cont.innerHTML = '';
  for (const viaje of viajes) cont.append(tarjeta(viaje));
}

function tarjeta(viaje) {
  const disponibles = cuposDisponibles(viaje);
  const lleno = estaLleno(viaje);
  const pocos = !lleno && disponibles <= BRAND.reglas.umbralUltimosCupos;
  const dias = duracionEnDias(viaje.fechaInicio, viaje.fechaFin);

  const boton = crear('button', {
    class: 'pub-viaje',
    type: 'button',
    'aria-label': `Ver ${viaje.destino}`,
  });

  const medio = urlImagenValida(viaje.fotoUrl)
    ? `<img class="pub-viaje__foto" src="${esc(viaje.fotoUrl)}" alt="${esc(viaje.destino)}"
            loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),
            {className:'pub-viaje__sinfoto', textContent:'🏝️'}))">`
    : '<div class="pub-viaje__sinfoto">🏝️</div>';

  boton.innerHTML = `
    <div class="pub-viaje__medio">
      ${medio}
      <div class="pub-viaje__cintas">
        <span class="pub-viaje__cinta">${esc(rangoCorto(viaje.fechaInicio, viaje.fechaFin))}</span>
        ${lleno
          ? `<span class="et-chip et-chip--error">${esc(BRAND.textos.etiquetaAgotado)}</span>`
          : pocos
            ? '<span class="et-chip et-chip--sol">¡Últimos cupos!</span>'
            : ''}
      </div>
    </div>
    <div class="pub-viaje__cuerpo">
      <h3 class="pub-viaje__destino">${esc(viaje.destino)}</h3>
      <p class="pub-viaje__desc">${esc(viaje.descripcion || `${dias} días de viaje`)}</p>
      <div class="pub-viaje__pie">
        <span class="pub-precio">
          ${esc(precio(viaje.precio, viaje.moneda))}
          <small>por persona</small>
        </span>
        <span class="pub-cupos ${pocos ? 'pub-cupos--pocos' : ''}">
          ${lleno
            ? '<strong>Agotado</strong><span>lista de espera</span>'
            : `<strong>${disponibles}</strong><span>de ${viaje.cupoMaximo} disponibles</span>`}
        </span>
      </div>
    </div>`;

  boton.addEventListener('click', () => irADetalle(viaje.id));
  return boton;
}
