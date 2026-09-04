/** Carga los viajes (y opcionalmente reservas) de ejemplo en Firestore. */
import { el, toast, conCarga } from '../src/utils/dom.js';
import { BRAND, aplicarTemaDeMarca } from '../config/brand.js';
import { FIREBASE_SIN_CONFIGURAR } from '../src/firebase.js';
import { observarSesion, nombreAdmin } from '../src/admin/auth.js';
import { crearViaje, todosLosViajes } from '../src/modelo/trips.js';
import { crearReserva, confirmarReserva } from '../src/modelo/bookings.js';
import { mensajeDeError } from '../src/modelo/errores.js';
import { hoyISO } from '../src/utils/fecha.js';
import { VIAJES_EJEMPLO, RESERVAS_EJEMPLO } from './datos.js';

const registro = (linea, tipo = '') => {
  const p = document.createElement('p');
  p.className = tipo;
  p.textContent = linea;
  el('#registro').append(p);
  el('#registro').scrollTop = el('#registro').scrollHeight;
};

async function cargar(boton) {
  await conCarga(boton, async () => {
    el('#registro').innerHTML = '';
    try {
      const existentes = await todosLosViajes();
      const yaEstan = new Set(existentes.map((v) => `${v.destino}|${v.fechaInicio}`));
      const idPorDestino = {};

      for (const viaje of VIAJES_EJEMPLO) {
        const clave = `${viaje.destino}|${viaje.fechaInicio}`;
        if (yaEstan.has(clave)) {
          registro(`Omitido: "${viaje.destino}" ya existía.`);
          const previo = existentes.find((v) => `${v.destino}|${v.fechaInicio}` === clave);
          idPorDestino[viaje.destino] = previo.id;
          continue;
        }
        const id = await crearViaje(viaje);
        idPorDestino[viaje.destino] = id;
        registro(`Viaje creado: ${viaje.destino}`, 'ok');
      }

      if (el('#incluir-reservas').checked) {
        const viajes = await todosLosViajes();
        for (const r of RESERVAS_EJEMPLO) {
          const viaje = viajes.find((v) => v.id === idPorDestino[r.destino]);
          if (!viaje) continue;
          const { id } = await crearReserva({
            viaje,
            nombre: r.nombre,
            telefono: r.telefono,
            email: '',
            personas: r.personas,
            notas: 'Reserva de ejemplo',
          });
          registro(`Reserva creada: ${r.nombre} (${r.personas}p, ${r.destino})`, 'ok');

          if (r.confirmar) {
            await confirmarReserva(id, {
              metodoPago: 'Pago móvil',
              fechaPago: hoyISO(),
              montoPagado: (viaje.precio || 0) * r.personas,
              personasConfirmadas: r.personas,
              notas: 'Pago de ejemplo',
              registradoPor: nombreAdmin(),
            });
            registro(`   pago confirmado, ${r.personas} cupos descontados`, 'ok');
          }
        }
      }

      registro('');
      registro('Listo. Abre el panel para verlo.', 'ok');
      toast('Datos de ejemplo cargados.', 'ok');
    } catch (err) {
      registro('Error: ' + mensajeDeError(err), 'error');
      toast(mensajeDeError(err), 'error');
    }
  });
}

function main() {
  aplicarTemaDeMarca();
  el('#marca').textContent = BRAND.nombre;

  if (FIREBASE_SIN_CONFIGURAR) {
    el('#estado').innerHTML =
      'Primero conecta tu proyecto de Firebase en <code>config/firebase.js</code> ' +
      '(paso 2 de DEPLOY.md).';
    el('#estado').className = 'et-aviso et-aviso--error';
    return;
  }

  observarSesion((admin) => {
    if (admin) {
      el('#estado').textContent = `Sesión iniciada como ${admin.email}.`;
      el('#estado').className = 'et-aviso et-aviso--ok';
      el('#btn-cargar').disabled = false;
    } else {
      el('#estado').innerHTML =
        'Necesitas iniciar sesión como administrador. ' +
        'Abre el <a href="../admin.html">panel</a>, entra con tu cuenta y vuelve aquí.';
      el('#estado').className = 'et-aviso et-aviso--alerta';
      el('#btn-cargar').disabled = true;
    }
  });

  el('#btn-cargar').addEventListener('click', (e) => cargar(e.currentTarget));
}

main();
