/**
 * Punto de entrada del sitio público.
 * Enrutado por hash para que GitHub Pages sirva todo desde un solo index.html:
 *   #/                 → calendario
 *   #/viaje/<id>       → detalle del viaje (enlace compartible por WhatsApp)
 */
import { el, mostrar, alHacerScroll, revelarAlEntrar } from '../utils/dom.js';
import { BRAND, aplicarTemaDeMarca, linkWhatsApp, logoHtml, texto } from '../../config/brand.js';
import { icono } from '../utils/iconos.js';
import { FIREBASE_SIN_CONFIGURAR } from '../firebase.js';
import { viajesPublicos, cuposDisponibles } from '../modelo/trips.js';
import { precio } from '../utils/formato.js';
import { urlImagenValida } from '../utils/formato.js';
import { hoyISO } from '../utils/fecha.js';
import { initCalendario } from './calendario.js';
import { initSecciones } from './secciones.js';
import { renderDetalle } from './detalle.js';
import { renderConfirmacion } from './reserva.js';

let ultimaReserva = null;

// ---------------------------------------------------------------------------
//  Marca
// ---------------------------------------------------------------------------

function aplicarMarca() {
  aplicarTemaDeMarca();
  // Las etiquetas og:/twitter: están escritas en index.html, no aquí: los
  // rastreadores de WhatsApp y las redes no ejecutan JavaScript.
  document.title = `${BRAND.nombre} · ${texto('heroTitulo')}`;

  el('#marca-logo').innerHTML = logoHtml(36);
  el('#btn-wa-icono').innerHTML = icono('whatsapp', { tam: 16 });
  el('#mes-anterior').innerHTML = icono('chevronIzq', { tam: 22 });
  el('#mes-siguiente').innerHTML = icono('chevronDer', { tam: 22 });
  el('#marca-nombre').textContent = BRAND.nombre;
  el('#marca-eslogan').textContent = BRAND.eslogan;
  el('#hero-titulo').textContent = texto('heroTitulo');
  el('#hero-subtitulo').textContent = texto('heroSubtitulo');
  el('#footer-nombre').textContent = BRAND.nombre;
  el('#footer-ciudad').textContent = BRAND.ciudad;
  el('#footer-logo').innerHTML = logoHtml(40);
  el('#footer-copy').textContent = `© ${new Date().getFullYear()} ${BRAND.nombre}`;

  const credito = BRAND.creditos?.nombre;
  el('#footer-creditos').innerHTML = credito
    ? `Desarrollado por ${BRAND.creditos.url
        ? `<a href="${BRAND.creditos.url}" target="_blank" rel="noopener">${credito}</a>`
        : `<strong>${credito}</strong>`}`
    : '';

  // Cierre de la página
  el('#cierre-titulo').textContent = texto('cierreTitulo');
  el('#cierre-texto').textContent = texto('cierreTexto');
  el('#btn-wa-pie-texto').textContent = texto('cierreBoton');
  el('#btn-wa-pie-icono').innerHTML = icono('whatsapp', { tam: 18 });

  // Cómo funciona
  el('#pasos-titulo').textContent = texto('pasosTitulo');
  el('#pasos-lista').innerHTML = (BRAND.textos.pasos || [])
    .map(([titulo, detalle], i) => `
      <li class="pub-paso et-revela" style="--i:${i}">
        <span class="pub-paso__numero">${i + 1}</span>
        <h3>${titulo}</h3>
        <p>${detalle}</p>
      </li>`)
    .join('');

  const consulta = linkWhatsApp(
    `Hola ${BRAND.nombre}, quiero información sobre los próximos viajes.`
  );
  el('#btn-wa-header').href = consulta;
  el('#btn-wa-pie').href = consulta;

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
//  Portada
// ---------------------------------------------------------------------------

/**
 * Pone la foto de portada: la configurada en la marca o, si no hay, la del
 * próximo viaje publicado. Si ninguna carga, se queda el degradado animado.
 */
function ponerFotoDePortada(url) {
  if (!urlImagenValida(url)) return;
  const capa = el('#hero-foto');
  // Se precarga aparte para no mostrar la foto a medio bajar.
  const prueba = new Image();
  prueba.onload = () => {
    // JSON.stringify entrecomilla y escapa: la URL no puede romper el CSS.
    capa.style.backgroundImage = `url(${JSON.stringify(url)})`;
    capa.classList.add('pub-hero__foto--lista');
    document.body.classList.add('pub--conportada');
  };
  prueba.src = url;
}

/** Tres cifras rápidas bajo el titular: destinos, precio desde y cupos. */
function pintarDatosDePortada(viajes) {
  const proximos = viajes.filter((v) => (v.fechaFin || v.fechaInicio) >= hoyISO());
  if (!proximos.length) return;

  const desde = Math.min(...proximos.map((v) => v.precio || 0));
  const cupos = proximos.reduce((suma, v) => suma + cuposDisponibles(v), 0);

  const datos = [
    [proximos.length, proximos.length === 1 ? 'viaje abierto' : 'viajes abiertos'],
    [`Desde ${precio(desde)}`, 'por persona'],
    [cupos, cupos === 1 ? 'cupo disponible' : 'cupos disponibles'],
  ];

  el('#hero-datos').innerHTML = datos
    .map(([valor, etiqueta]) => `
      <div class="pub-hero__dato">
        <b>${valor}</b><span>${etiqueta}</span>
      </div>`)
    .join('');
}

/** Cabecera de cristal al bajar y ligero parallax de la foto. */
function activarEfectosDeScroll() {
  const cabecera = el('#cabecera');
  const foto = el('#hero-foto');
  alHacerScroll((y) => {
    cabecera.classList.toggle('pub-header--fijada', y > 24);
    if (foto && y < window.innerHeight) {
      foto.style.transform = `scale(1.06) translate3d(0, ${y * 0.22}px, 0)`;
    }
  });
}

// ---------------------------------------------------------------------------
//  Enrutado
// ---------------------------------------------------------------------------

function mostrarVista(cual) {
  // Solo en el calendario la cabecera flota sobre la portada; en las demás
  // vistas el fondo es claro y el texto tiene que volver a ser oscuro.
  document.body.classList.toggle('pub--enportada', cual === 'calendario');
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
    revelarAlEntrar(document.querySelectorAll('#vista-detalle .et-revela'));
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
  activarEfectosDeScroll();

  await initCalendario({ onVerViaje: (id) => { location.hash = `#/viaje/${id}`; } });
  await enrutar();
  revelarAlEntrar(document.querySelectorAll('.pub-pasos .et-revela'));
  await initSecciones();

  // Los viajes ya están en memoria: no cuesta ninguna lectura extra.
  try {
    const viajes = await viajesPublicos();
    pintarDatosDePortada(viajes);
    const proximoConFoto = viajes
      .filter((v) => (v.fechaFin || v.fechaInicio) >= hoyISO())
      .find((v) => urlImagenValida(v.fotoUrl));
    ponerFotoDePortada(BRAND.imagenes.portada || proximoConFoto?.fotoUrl);
  } catch (err) {
    console.warn('[Escape Tours] No se pudo preparar la portada', err);
  }
}

main();
