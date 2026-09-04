/** Punto de entrada del panel: sesión, pestañas y orquestación de las vistas. */
import { el, toast } from '../utils/dom.js';
import { BRAND, aplicarTemaDeMarca, logoHtml } from '../../config/brand.js';
import { icono } from '../utils/iconos.js';
import { FIREBASE_SIN_CONFIGURAR } from '../firebase.js';
import { mensajeDeError } from '../modelo/errores.js';
import { iniciarSesion, cerrarSesion, observarSesion } from './auth.js';
import { estado, cargarTodo, alCambiar } from './estado.js';
import { initViajes, renderViajes } from './viajes-ui.js';
import { initReservas, renderReservas, filtrarPorViaje } from './reservas-ui.js';
import { initAjustes, renderAjustes } from './ajustes-ui.js';

let panelIniciado = false;
let tabActiva = 'viajes';

// ---------------------------------------------------------------------------
//  Marca
// ---------------------------------------------------------------------------

function aplicarMarca() {
  aplicarTemaDeMarca();
  document.title = `Panel · ${BRAND.nombre}`;
  el('#login-titulo').textContent = BRAND.nombre;
  el('#header-nombre').textContent = BRAND.nombre;
  el('#login-logo').innerHTML = logoHtml(44);
  el('#header-logo').innerHTML = logoHtml(30);
  el('#icono-nuevo').innerHTML = icono('mas', { tam: 17 });
  el('#icono-salir').innerHTML = icono('salir', { tam: 15 });
  el('#modal-viaje').querySelector('.admin-modal__cerrar').innerHTML = icono('cerrar', { tam: 20 });
  el('#modal-pago').querySelector('.admin-modal__cerrar').innerHTML = icono('cerrar', { tam: 20 });
}

// ---------------------------------------------------------------------------
//  Pantallas
// ---------------------------------------------------------------------------

function mostrarPantalla(cual) {
  el('#pantalla-carga').hidden = cual !== 'carga';
  el('#pantalla-login').hidden = cual !== 'login';
  el('#pantalla-panel').hidden = cual !== 'panel';
}

function cambiarTab(nombre) {
  tabActiva = nombre;
  for (const boton of document.querySelectorAll('.admin-tab')) {
    const activa = boton.dataset.tab === nombre;
    boton.setAttribute('aria-current', activa ? 'page' : 'false');
  }
  el('#tab-viajes').hidden = nombre !== 'viajes';
  el('#tab-reservas').hidden = nombre !== 'reservas';
  el('#tab-ajustes').hidden = nombre !== 'ajustes';
  if (nombre === 'ajustes') renderAjustes();

  // Reinicia la animación de entrada de la sección visible.
  const seccion = el(`#tab-${nombre}`);
  seccion.classList.remove('et-fundido');
  void seccion.offsetWidth;            // fuerza el reflow para poder repetirla
  seccion.classList.add('et-fundido');
}

// ---------------------------------------------------------------------------
//  Login
// ---------------------------------------------------------------------------

async function alEnviarLogin(evento) {
  evento.preventDefault();
  const error = el('#login-error');
  const boton = el('#btn-login');
  error.hidden = true;

  const usuario = el('#login-usuario').value.trim();
  const password = el('#login-password').value;
  if (!usuario || !password) {
    error.textContent = 'Escribe tu usuario y tu contraseña.';
    error.hidden = false;
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Entrando…';
  try {
    await iniciarSesion(usuario, password);
    el('#login-password').value = '';
    // observarSesion se encarga de mostrar el panel.
  } catch (err) {
    error.textContent = mensajeDeError(err);
    error.hidden = false;
  } finally {
    boton.disabled = false;
    boton.textContent = 'Entrar';
  }
}

// ---------------------------------------------------------------------------
//  Arranque
// ---------------------------------------------------------------------------

function iniciarPanel(admin) {
  // Se muestra solo la parte antes de la arroba: el dominio interno es un
  // detalle técnico que al usuario del panel no le dice nada.
  const usuarioVisible = String(admin.email || '').split('@')[0];
  el('#header-usuario').textContent = admin.nombre
    ? `${admin.nombre} · ${usuarioVisible}`
    : usuarioVisible;

  if (!panelIniciado) {
    panelIniciado = true;
    initViajes({
      onVerReservas: (tripId) => {
        cambiarTab('reservas');
        filtrarPorViaje(tripId);
      },
    });
    initReservas();
    initAjustes();

    alCambiar(() => {
      if (estado.error) {
        toast(mensajeDeError(estado.error), 'error');
      }
      renderViajes();
      renderReservas();
      if (tabActiva === 'ajustes') renderAjustes();
    });
  }

  cargarTodo();
}

function main() {
  aplicarMarca();

  if (FIREBASE_SIN_CONFIGURAR) {
    mostrarPantalla('login');
    const error = el('#login-error');
    error.innerHTML =
      'Falta conectar el proyecto de Firebase: edita <code>config/firebase.js</code> ' +
      'siguiendo DEPLOY.md.';
    error.hidden = false;
    return;
  }

  el('#form-login').addEventListener('submit', alEnviarLogin);
  el('#btn-salir').addEventListener('click', async () => {
    await cerrarSesion();
    mostrarPantalla('login');
  });
  for (const boton of document.querySelectorAll('.admin-tab')) {
    boton.addEventListener('click', () => cambiarTab(boton.dataset.tab));
  }

  observarSesion((admin) => {
    if (admin) {
      mostrarPantalla('panel');
      iniciarPanel(admin);
    } else {
      mostrarPantalla('login');
    }
  });
}

main();
