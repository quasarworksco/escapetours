/** Detalle de un viaje + formulario de reserva. */
import { el } from '../utils/dom.js';
import { esc, precio, urlImagenValida } from '../utils/formato.js';
import { rangoFechas, duracionEnDias, yaPaso } from '../utils/fecha.js';
import { obtenerViaje, cuposDisponibles, estaLleno } from '../modelo/trips.js';
import { mensajeDeError } from '../modelo/errores.js';
import { BRAND } from '../../config/brand.js';
import { montarFormulario } from './reserva.js';
import { icono } from '../utils/iconos.js';

export async function renderDetalle(tripId, { onVolver, onReservado }) {
  const cont = el('#vista-detalle');
  cont.innerHTML = '<div class="et-contenedor et-cargando">Cargando viaje…</div>';

  let viaje;
  try {
    viaje = await obtenerViaje(tripId);
  } catch (err) {
    cont.innerHTML = `
      <div class="et-contenedor">
        <a class="pub-detalle__volver" href="#/">${icono('flechaIzq', { tam: 17, clase: 'et-icono--desliza-izq' })} Volver a los viajes</a>
        <div class="et-aviso et-aviso--error">${esc(mensajeDeError(err))}</div>
      </div>`;
    return;
  }

  if (viaje.estado !== 'activo' || yaPaso(viaje.fechaFin || viaje.fechaInicio)) {
    cont.innerHTML = `
      <div class="et-contenedor">
        <a class="pub-detalle__volver" href="#/">${icono('flechaIzq', { tam: 17, clase: 'et-icono--desliza-izq' })} Volver a los viajes</a>
        <div class="et-aviso et-aviso--alerta">
          Este viaje ya no está disponible. Escríbenos por WhatsApp y te contamos
          cuál es el próximo destino.
        </div>
      </div>`;
    return;
  }

  const disponibles = cuposDisponibles(viaje);
  const lleno = estaLleno(viaje);
  const pocos = !lleno && disponibles <= BRAND.reglas.umbralUltimosCupos;
  const dias = duracionEnDias(viaje.fechaInicio, viaje.fechaFin);

  const portada = urlImagenValida(viaje.fotoUrl)
    ? `<img class="pub-detalle__portada" src="${esc(viaje.fotoUrl)}" alt="${esc(viaje.destino)}"
            onerror="this.classList.add('pub-detalle__portada--vacia'); this.removeAttribute('src')">`
    : '<div class="pub-detalle__portada"></div>';

  const lista = (titulo, items, marca) => items?.length ? `
    <section class="pub-bloque">
      <h2>${titulo}</h2>
      <ul class="pub-lista">
        ${items.map((i, n) => `
          <li class="et-entra" style="--i:${n}">
            <span class="pub-lista__marca">${marca}</span>${esc(i)}
          </li>`).join('')}
      </ul>
    </section>` : '';

  cont.innerHTML = `
    <div class="et-contenedor">
      <a class="pub-detalle__volver" href="#/">${icono('flechaIzq', { tam: 17, clase: 'et-icono--desliza-izq' })} Volver a los viajes</a>
      ${portada}

      <div class="pub-detalle__grid">
        <div>
          <header class="pub-detalle__cabecera">
            <h1>${esc(viaje.destino)}</h1>
            <p class="pub-detalle__fecha">
              ${esc(rangoFechas(viaje.fechaInicio, viaje.fechaFin))}
              ${dias > 1 ? `· ${dias} días` : '· viaje de un día'}
            </p>
          </header>

          ${viaje.descripcion ? `
            <section class="pub-bloque"><p>${esc(viaje.descripcion)}</p></section>` : ''}

          ${lista('Qué incluye', viaje.incluye, icono('check', { tam: 16 }))}
          ${lista('Itinerario', viaje.itinerario, '<span class="pub-lista__punto"></span>')}

          ${viaje.puntoEncuentro ? `
            <section class="pub-bloque">
              <h2>Punto de encuentro</h2>
              <p class="pub-punto">${icono('ubicacion', { tam: 18 })} ${esc(viaje.puntoEncuentro)}</p>
            </section>` : ''}
        </div>

        <aside class="pub-detalle__lateral">
          <div class="pub-reserva" id="caja-reserva">
            <div class="pub-reserva__precio">
              <span class="pub-precio">
                ${esc(precio(viaje.precio, viaje.moneda))}
                <small>por persona</small>
              </span>
              <span class="et-chip ${lleno ? 'et-chip--error' : pocos ? 'et-chip--sol' : 'et-chip--mar'}">
                ${lleno
                  ? esc(BRAND.textos.etiquetaAgotado)
                  : `${disponibles} de ${viaje.cupoMaximo} disponibles`}
              </span>
            </div>

            ${lleno ? `
              <p class="et-aviso et-aviso--alerta" style="margin-bottom:1rem">
                Este viaje ya está lleno, pero puedes anotarte en la
                <strong>lista de espera</strong>: te avisamos de primero si alguien cancela.
              </p>` : ''}

            <form id="form-reserva" novalidate>
              <div class="et-campo">
                <label for="r-nombre">Nombre y apellido *</label>
                <input class="et-input" id="r-nombre" name="nombre" required
                       autocomplete="name" maxlength="80" placeholder="María Fernanda Urdaneta">
                <span class="et-error-campo" data-error="nombre" hidden></span>
              </div>

              <div class="et-campo">
                <label for="r-telefono">Teléfono (WhatsApp) *</label>
                <input class="et-input" id="r-telefono" name="telefono" required
                       type="tel" inputmode="tel" autocomplete="tel" placeholder="0414-1234567">
                <span class="et-ayuda">Por aquí te contactamos para coordinar el pago.</span>
                <span class="et-error-campo" data-error="telefono" hidden></span>
              </div>

              <div class="et-campo">
                <label for="r-personas">¿Cuántas personas? *</label>
                <input class="et-input" id="r-personas" name="personas" type="number"
                       min="1" max="${Math.min(BRAND.reglas.maxPersonasPorReserva, Math.max(disponibles, 1))}"
                       step="1" value="1" required>
                <span class="et-error-campo" data-error="personas" hidden></span>
              </div>

              <div class="et-campo">
                <label for="r-email">Correo (opcional)</label>
                <input class="et-input" id="r-email" name="email" type="email"
                       autocomplete="email" maxlength="120" placeholder="tucorreo@gmail.com">
                <span class="et-error-campo" data-error="email" hidden></span>
              </div>

              <div class="et-campo">
                <label for="r-notas">¿Algo que debamos saber? (opcional)</label>
                <textarea class="et-textarea" id="r-notas" name="notas" maxlength="500"
                          placeholder="Viajo con un niño de 6 años"></textarea>
              </div>

              <div class="pub-reserva__total">
                Total estimado
                <strong id="r-total">${esc(precio(viaje.precio, viaje.moneda))}</strong>
                <small id="r-total-detalle">1 persona</small>
              </div>

              <p class="et-aviso et-aviso--error" id="r-error" hidden></p>

              <button class="et-btn et-btn--sol et-btn--bloque" type="submit" id="btn-reservar">
                ${lleno ? esc(BRAND.textos.ctaListaEspera) : esc(BRAND.textos.ctaReservar)}
              </button>

              <p class="et-ayuda" style="text-align:center; margin-top:.75rem">
                Reservar no cobra nada todavía. Confirmamos tu cupo cuando verifiquemos el pago.
              </p>
            </form>
          </div>
        </aside>
      </div>
    </div>`;

  montarFormulario(viaje, { onReservado });
}
