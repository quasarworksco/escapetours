/** Pestaña "Reseñas": moderación de lo que escriben los clientes. */
import { el, crear, toast, conCarga, confirmar } from '../utils/dom.js';
import { esc } from '../utils/formato.js';
import { fechaHora } from '../utils/fecha.js';
import {
  ESTADOS_RESENA, aprobarResena, rechazarResena, eliminarResena,
} from '../modelo/resenas.js';
import { mensajeDeError } from '../modelo/errores.js';
import { estado, recargarResenas } from './estado.js';

let filtro = 'pendiente';

function estrellas(n) {
  return `<span class="admin-resena__estrellas" aria-label="${n} de 5">` +
    '★'.repeat(n) + `<span class="admin-resena__vacias">${'★'.repeat(5 - n)}</span></span>`;
}

export function renderResenas() {
  const cont = el('#lista-resenas');
  if (!cont) return;

  const pendientes = estado.resenas.filter((r) => r.estado === 'pendiente').length;
  const contador = el('#contador-resenas');
  contador.textContent = pendientes;
  contador.hidden = pendientes === 0;

  if (estado.cargando) {
    cont.innerHTML = '<div class="et-cargando">Cargando reseñas…</div>';
    return;
  }

  const publicadas = estado.resenas.filter((r) => r.estado === 'aprobada').length;
  el('#resumen-resenas').textContent =
    `${pendientes} por revisar · ${publicadas} publicadas · ` +
    `${estado.resenas.length} en total`;

  const visibles = filtro
    ? estado.resenas.filter((r) => r.estado === filtro)
    : estado.resenas;

  if (!visibles.length) {
    cont.innerHTML = `
      <div class="et-vacio et-fundido">
        <p>${filtro === 'pendiente'
          ? 'No hay reseñas por revisar. Todo al día.'
          : 'No hay reseñas con este filtro.'}</p>
      </div>`;
    return;
  }

  cont.innerHTML = '';
  visibles.forEach((resena, i) => {
    const nodo = tarjeta(resena);
    nodo.style.setProperty('--i', Math.min(i, 8));
    cont.append(nodo);
  });
}

function tarjeta(resena) {
  const est = ESTADOS_RESENA[resena.estado] || ESTADOS_RESENA.pendiente;
  const nodo = crear('article', {
    class: `admin-reserva et-entra admin-reserva--${
      resena.estado === 'aprobada' ? 'confirmada'
        : resena.estado === 'rechazada' ? 'cancelada' : 'pendiente'}`,
  });

  nodo.innerHTML = `
    <div class="admin-reserva__fila">
      <div>
        <p class="admin-reserva__nombre">${esc(resena.nombreCliente)}</p>
        <p class="admin-reserva__viaje">
          ${estrellas(resena.calificacion || 0)}
          ${resena.tripDestino ? ` · ${esc(resena.tripDestino)}` : ''}
          · ${esc(fechaHora(resena.createdAt))}
        </p>
      </div>
      <span class="et-chip ${est.chip}">${est.etiqueta}</span>
    </div>
    <p class="admin-reserva__notas">${esc(resena.texto)}</p>
    <div class="admin-reserva__acciones"></div>`;

  const acciones = nodo.querySelector('.admin-reserva__acciones');

  if (resena.estado !== 'aprobada') {
    acciones.append(crear('button', {
      class: 'et-btn et-btn--mar et-btn--sm',
      type: 'button',
      text: 'Publicar en la web',
      onclick: (e) => accion(e.currentTarget, () => aprobarResena(resena.id), 'Reseña publicada.'),
    }));
  }
  if (resena.estado !== 'rechazada') {
    acciones.append(crear('button', {
      class: 'et-btn et-btn--contorno et-btn--sm',
      type: 'button',
      text: resena.estado === 'aprobada' ? 'Quitar de la web' : 'Rechazar',
      onclick: (e) => accion(e.currentTarget, () => rechazarResena(resena.id),
        resena.estado === 'aprobada' ? 'Reseña retirada de la web.' : 'Reseña rechazada.'),
    }));
  }
  acciones.append(crear('button', {
    class: 'et-btn et-btn--peligro et-btn--sm',
    type: 'button',
    text: 'Eliminar',
    onclick: (e) => {
      if (!confirmar(`¿Eliminar definitivamente la reseña de ${resena.nombreCliente}?`)) return;
      accion(e.currentTarget, () => eliminarResena(resena.id), 'Reseña eliminada.');
    },
  }));

  return nodo;
}

async function accion(boton, fn, mensaje) {
  await conCarga(boton, async () => {
    try {
      await fn();
      await recargarResenas();
      toast(mensaje, 'ok');
    } catch (err) {
      toast(mensajeDeError(err), 'error');
    }
  });
}

export function initResenas() {
  el('#filtro-resena').addEventListener('change', (e) => {
    filtro = e.target.value;
    renderResenas();
  });
}
