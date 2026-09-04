/**
 * Punto de entrada del sitio público.
 * Enrutado por hash para que GitHub Pages sirva todo desde un solo index.html:
 *   #/                 → calendario
 *   #/viaje/<id>       → detalle del viaje (enlace compartible por WhatsApp)
 */
import { el, mostrar } from '../utils/dom.js';
import { BRAND, aplicarTemaDeMarca, linkWhatsApp, logoHtml } from '../../config/brand.js';
import { icono } from '../utils/iconos.js';
import { FIREBASE_SIN_CONFIGURAR } from '../firebase.js';
import { initCalendario } from './calendario.js';
import { renderDetalle } from './detalle.js';
import { renderConfirmacion } from './reserva.js';

let ultimaReserva = null;

// ---------------------------------------------------------------------------
//  Marca
// ---------------------------------------------------------------------------

function aplicarMarca() {
  aplicarTemaDeMarca();
  document.title = `${BRAND.nombre} · ${BRAND.textos.heroTitulo}`;
  el('#og-title').content = document.title;
  el('#og-desc').content = BRAND.descripcion;

  el('#marca-logo').innerHTML = logoHtml(36);
  el('#btn-wa-icono').innerHTML = icono('whatsapp', { tam: 16 });
  el('#mes-anterior').innerHTML = icono('chevronIzq', { tam: 22 });
  el('#mes-siguiente').innerHTML = icono('chevronDer', { tam: 22 });
  el('#marca-nombre').textContent = BRAND.nombre;
  el('#marca-eslogan').textContent = BRAND.eslogan;
  el('#hero-titulo').textContent = BRAND.textos.heroTitulo;
  el('#hero-subtitulo').textContent = BRAND.textos.heroSubtitulo;
  el('#footer-nombre').textContent = BRAND.nombre;
  el('#footer-ciudad').textContent = BRAND.ciudad;

  el('#btn-wa-header').href = linkWhatsApp(
    `¡Hola ${BRAND.nombre}! Quiero información sobre los próximos viajes.`
  );

  const enlaces = el('#footer-enlaces');
  enlaces.innerHTML = '';
  if (BRAND.instagram) {
    enlaces.insertAdjacentHTML('beforeend',
      `<a href="https://instagram.com/${BRAND.instagram}" target="_blank" rel="noopener">
         ${icono('instagram', { tam: 16 })} @${BRAND.instagram}</a>`);
  }
  enlaces.insertAdjacentHTML('beforeend',
    `<a href="${el('#btn-wa-header').href}" target="_blank" rel="noopener">
       ${icono('whatsapp', { tam: 16 })} ${BRAND.whatsappVisible}</a>`);
}

// ---------------------------------------------------------------------------
//  Enrutado
// ---------------------------------------------------------------------------

function mostrarVista(cual) {
  mostrar(el('#vista-calendario'), cual === 'calendario');
  mostrar(el('#vista-detalle'), cual === 'detalle');
  mostrar(el('#vista-confirmacion'), cual === 'confirmacion');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

async function enrutar() {
  const hash = location.hash.replace(/^#\/?/, '');

  if (hash.startsWith('confirmacion') && ultimaReserva) {
    mostrarVista('confirmacion');
    await renderConfirmacion(ultimaReserva);
    return;
  }

  const detalle = hash.match(/^viaje\/(.+)$/);
  if (detalle) {
    mostrarVista('detalle');
    await renderDetalle(detalle[1], { onReservado: alReservar });
    return;
  }

  mostrarVista('calendario');
}

function alReservar(resultado) {
  ultimaReserva = resultado;
  location.hash = '#/confirmacion';
}

// ---------------------------------------------------------------------------

async function main() {
  aplicarMarca();

  if (FIREBASE_SIN_CONFIGURAR) {
    el('#lista-viajes').innerHTML = `
      <div class="et-aviso et-aviso--alerta">
        Falta conectar el proyecto de Firebase: edita <code>config/firebase.js</code>
        siguiendo el paso 2 de DEPLOY.md.
      </div>`;
    return;
  }

  window.addEventListener('hashchange', enrutar);
  await initCalendario({ onVerViaje: (id) => { location.hash = `#/viaje/${id}`; } });
  await enrutar();
}

main();
