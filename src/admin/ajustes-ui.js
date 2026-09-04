/** Pestaña "Datos de pago": métodos e instrucciones que ve el cliente. */
import { el, crear, toast, conCarga } from '../utils/dom.js';
import { esc } from '../utils/formato.js';
import { guardarConfig, CONFIG_POR_DEFECTO } from '../modelo/config.js';
import { mensajeDeError } from '../modelo/errores.js';
import { estado, actualizarConfig } from './estado.js';

let borrador = null;
let pintado = false;

export function renderAjustes() {
  const cont = el('#editor-ajustes');
  if (!cont) return;
  if (estado.cargando) {
    cont.innerHTML = '<div class="et-cargando">Cargando…</div>';
    return;
  }
  // Solo se pinta una vez: repintar borraría lo que el admin esté escribiendo.
  if (pintado) return;
  if (!borrador) borrador = clonar(estado.config || CONFIG_POR_DEFECTO);
  pintar(cont);
  pintado = true;
}

function clonar(config) {
  return {
    metodosPago: (config.metodosPago || []).map((m) => ({ ...m })),
    instruccionesPago: config.instruccionesPago || '',
    mostrarDatosDePago: config.mostrarDatosDePago !== false,
  };
}

function pintar(cont) {
  cont.innerHTML = `
    <p class="et-aviso et-aviso--info">
      Estos datos aparecen en la pantalla de confirmación, justo después de que
      un cliente reserva. Desactiva los métodos que no uses.
    </p>

    <div class="et-campo" style="margin-top:1.5rem">
      <label class="admin-metodo__activo">
        <input type="checkbox" id="ajuste-mostrar" ${borrador.mostrarDatosDePago ? 'checked' : ''}>
        Mostrar los datos de pago en la web
      </label>
      <span class="et-ayuda">
        Si lo desactivas, el cliente solo verá el botón de WhatsApp para coordinar el pago.
      </span>
    </div>

    <h3 style="margin-top:1.5rem">Métodos de pago</h3>
    <div id="lista-metodos"></div>
    <button class="et-btn et-btn--contorno et-btn--sm" type="button" id="btn-agregar-metodo"
            style="margin-top:0.75rem">+ Agregar método</button>

    <div class="et-campo" style="margin-top:1.5rem">
      <label for="ajuste-instrucciones">Instrucciones adicionales</label>
      <textarea class="et-textarea" id="ajuste-instrucciones" maxlength="800"
        >${esc(borrador.instruccionesPago)}</textarea>
      <span class="et-ayuda">Ej.: condiciones de abono, plazos, política de cancelación.</span>
    </div>

    <button class="et-btn et-btn--sol" type="button" id="btn-guardar-ajustes">
      Guardar cambios
    </button>`;

  pintarMetodos();

  el('#ajuste-mostrar').addEventListener('change', (e) => {
    borrador.mostrarDatosDePago = e.target.checked;
  });
  el('#ajuste-instrucciones').addEventListener('input', (e) => {
    borrador.instruccionesPago = e.target.value;
  });
  el('#btn-agregar-metodo').addEventListener('click', () => {
    borrador.metodosPago.push({ nombre: '', detalle: '', activo: true });
    pintarMetodos();
  });
  el('#btn-guardar-ajustes').addEventListener('click', (e) => guardar(e.currentTarget));
}

function pintarMetodos() {
  const cont = el('#lista-metodos');
  cont.innerHTML = '';
  borrador.metodosPago.forEach((metodo, i) => {
    const fila = crear('div', { class: 'admin-metodo' });

    const nombre = crear('input', {
      class: 'et-input', value: metodo.nombre, placeholder: 'Pago móvil',
      'aria-label': 'Nombre del método',
    });
    nombre.addEventListener('input', (e) => { borrador.metodosPago[i].nombre = e.target.value; });

    const detalle = crear('input', {
      class: 'et-input', value: metodo.detalle,
      placeholder: 'Banesco · V-00.000.000 · 0414-000 0000',
      'aria-label': 'Datos que ve el cliente',
    });
    detalle.addEventListener('input', (e) => { borrador.metodosPago[i].detalle = e.target.value; });

    const activo = crear('label', { class: 'admin-metodo__activo' });
    const check = crear('input', { type: 'checkbox' });
    check.checked = metodo.activo !== false;
    check.addEventListener('change', (e) => { borrador.metodosPago[i].activo = e.target.checked; });
    activo.append(check, 'Activo');

    const quitar = crear('button', {
      class: 'et-btn et-btn--peligro et-btn--sm', type: 'button', text: 'Quitar',
      onclick: () => { borrador.metodosPago.splice(i, 1); pintarMetodos(); },
    });

    fila.append(nombre, detalle, activo, quitar);
    cont.append(fila);
  });

  if (!borrador.metodosPago.length) {
    cont.append(crear('p', {
      class: 'et-ayuda',
      text: 'No hay métodos configurados. Agrega al menos uno.',
    }));
  }
}

async function guardar(boton) {
  await conCarga(boton, async () => {
    try {
      const config = await guardarConfig(borrador);
      actualizarConfig(config);
      borrador = clonar(config);
      toast('Datos de pago actualizados.', 'ok');
    } catch (err) {
      toast(mensajeDeError(err), 'error');
    }
  });
}

export function initAjustes() {
  // El editor se construye al entrar a la pestaña; nada que enganchar aquí.
}
