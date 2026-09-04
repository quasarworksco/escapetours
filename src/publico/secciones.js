/**
 * Secciones del sitio público que no dependen del calendario:
 * "Sobre nosotros", la galería de fotos y las reseñas de clientes.
 */
import { el, els, crear, conCarga, revelarAlEntrar } from '../utils/dom.js';
import { esc, urlImagenValida } from '../utils/formato.js';
import { fechaHora } from '../utils/fecha.js';
import { obtenerConfig } from '../modelo/config.js';
import {
  crearResena, resenasAprobadas, resumirResenas,
} from '../modelo/resenas.js';
import { mensajeDeError } from '../modelo/errores.js';
import { icono } from '../utils/iconos.js';
import { BRAND } from '../../config/brand.js';

/** Dibuja n estrellas llenas sobre 5. */
function estrellas(n, tam = 16) {
  const estrella = (llena) => `
    <svg width="${tam}" height="${tam}" viewBox="0 0 24 24" aria-hidden="true"
         fill="${llena ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6"
         stroke-linejoin="round">
      <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4 6.2 20.4l1.1-6.4L2.6 9.4l6.5-.9Z"/>
    </svg>`;
  return `<span class="pub-estrellas__fila" aria-label="${n} de 5 estrellas">` +
    [1, 2, 3, 4, 5].map((i) => estrella(i <= n)).join('') + '</span>';
}

// ---------------------------------------------------------------------------
//  Sobre nosotros
// ---------------------------------------------------------------------------

function pintarSobreNosotros(config) {
  const sobre = config.sobreNosotros;
  const seccion = el('#sobre-nosotros');
  if (!sobre?.texto) return;              // sin texto, la sección no aparece

  seccion.hidden = false;
  el('#sobre-titulo').textContent = sobre.titulo || 'Sobre nosotros';
  el('#sobre-parrafo').textContent = sobre.texto;
  el('#sobre-puntos').innerHTML = (sobre.puntos || [])
    .map((punto, i) => `
      <li class="et-revela" style="--i:${i}">
        <span class="pub-lista__marca">${icono('check', { tam: 16 })}</span>${esc(punto)}
      </li>`)
    .join('');

  if (urlImagenValida(sobre.fotoUrl)) {
    const foto = el('#sobre-foto');
    foto.style.backgroundImage = `url(${JSON.stringify(sobre.fotoUrl)})`;
    foto.hidden = false;
  }
}

// ---------------------------------------------------------------------------
//  Galería
// ---------------------------------------------------------------------------

function pintarGaleria(config) {
  const fotos = (config.galeria || []).filter((f) => urlImagenValida(f.url));
  if (!fotos.length) return;

  el('#galeria').hidden = false;
  const grid = el('#galeria-grid');
  grid.innerHTML = fotos
    .map((foto, i) => `
      <button class="pub-galeria__foto et-revela" type="button" style="--i:${i % 6}"
              data-url="${esc(foto.url)}" data-titulo="${esc(foto.titulo || '')}"
              aria-label="Ampliar ${esc(foto.titulo || 'foto del viaje')}">
        <img src="${esc(foto.url)}" alt="${esc(foto.titulo || '')}" loading="lazy"
             onerror="this.closest('button').remove()">
        ${foto.titulo ? `<span class="pub-galeria__pie">${esc(foto.titulo)}</span>` : ''}
      </button>`)
    .join('');

  for (const boton of grid.children) {
    boton.addEventListener('click', () => ampliarFoto(boton.dataset.url, boton.dataset.titulo));
  }
}

/** Visor a pantalla completa al pulsar una foto. */
function ampliarFoto(url, titulo) {
  let visor = el('#visor-foto');
  if (!visor) {
    visor = crear('dialog', { id: 'visor-foto', class: 'pub-visor' });
    visor.innerHTML = `
      <button class="pub-visor__cerrar" type="button" aria-label="Cerrar">
        ${icono('cerrar', { tam: 22 })}
      </button>
      <img alt="">
      <p class="pub-visor__titulo"></p>`;
    document.body.append(visor);
    visor.querySelector('.pub-visor__cerrar').addEventListener('click', () => visor.close());
    // Pulsar el fondo también cierra.
    visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
  }
  visor.querySelector('img').src = url;
  visor.querySelector('img').alt = titulo || '';
  visor.querySelector('.pub-visor__titulo').textContent = titulo || '';
  visor.showModal();
}

// ---------------------------------------------------------------------------
//  Reseñas
// ---------------------------------------------------------------------------

let calificacionElegida = 0;

function pintarResenas(resenas) {
  const grid = el('#resenas-grid');
  const { total, promedio } = resumirResenas(resenas);

  el('#resenas-resumen').innerHTML = total
    ? `${estrellas(Math.round(promedio), 18)} <strong>${promedio}</strong> de 5 · ` +
      `${total} ${total === 1 ? 'reseña' : 'reseñas'}`
    : 'Todavía no hay reseñas publicadas. ¡Sé el primero en contarnos!';

  grid.innerHTML = resenas
    .map((r, i) => `
      <article class="pub-resena et-revela" style="--i:${i % 6}">
        <div class="pub-resena__estrellas">${estrellas(r.calificacion || 5)}</div>
        <p class="pub-resena__texto">${esc(r.texto)}</p>
        <footer class="pub-resena__pie">
          <strong>${esc(r.nombreCliente)}</strong>
          ${r.tripDestino ? `<span>${esc(r.tripDestino)}</span>` : ''}
          <span class="pub-resena__fecha">${esc(fechaHora(r.createdAt).split(',')[0])}</span>
        </footer>
      </article>`)
    .join('');
}

function montarEstrellasDelFormulario() {
  const cont = el('#res-estrellas');
  cont.innerHTML = '';
  for (let n = 1; n <= 5; n++) {
    const boton = crear('button', {
      class: 'pub-estrella',
      type: 'button',
      role: 'radio',
      'aria-checked': 'false',
      'aria-label': `${n} ${n === 1 ? 'estrella' : 'estrellas'}`,
      html: `
        <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" fill="none"
             stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
          <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4 6.2 20.4l1.1-6.4L2.6 9.4l6.5-.9Z"/>
        </svg>`,
    });
    boton.dataset.valor = n;
    boton.addEventListener('click', () => {
      calificacionElegida = n;
      sincronizarEstrellas();
    });
    cont.append(boton);
  }
}

function sincronizarEstrellas() {
  for (const boton of el('#res-estrellas').children) {
    const activa = Number(boton.dataset.valor) <= calificacionElegida;
    boton.classList.toggle('pub-estrella--activa', activa);
    boton.setAttribute('aria-checked', Number(boton.dataset.valor) === calificacionElegida);
    boton.querySelector('svg').setAttribute('fill', activa ? 'currentColor' : 'none');
  }
}

function errorCampo(clave, mensaje) {
  const nodo = document.querySelector(`[data-error="${clave}"]`);
  if (nodo) {
    nodo.textContent = mensaje || '';
    nodo.hidden = !mensaje;
  }
  return !mensaje;
}

async function enviarResena(evento) {
  evento.preventDefault();
  const error = el('#res-error');
  const ok = el('#res-ok');
  error.hidden = true;
  ok.hidden = true;

  const nombre = el('#res-nombre').value;
  const texto = el('#res-texto').value;

  let valido = errorCampo('res-nombre', nombre.trim().length < 2 ? 'Escribe tu nombre.' : '');
  valido = errorCampo('res-calificacion',
    calificacionElegida ? '' : 'Escoge cuántas estrellas nos das.') && valido;
  valido = errorCampo('res-texto',
    texto.trim().length < 10 ? 'Cuéntanos un poquito más (mínimo 10 caracteres).' : '') && valido;
  if (!valido) return;

  await conCarga(el('#btn-resena'), async () => {
    try {
      await crearResena({ nombre, texto, calificacion: calificacionElegida });
      el('#form-resena').reset();
      calificacionElegida = 0;
      sincronizarEstrellas();
      el('#res-contador').textContent = '0';
      ok.textContent =
        `¡Gracias, ${BRAND.publico.tratamiento}! Tu reseña quedó enviada. ` +
        'La publicamos apenas la revisemos.';
      ok.hidden = false;
    } catch (err) {
      error.textContent = mensajeDeError(err);
      error.hidden = false;
    }
  });
}

// ---------------------------------------------------------------------------

export async function initSecciones() {
  montarEstrellasDelFormulario();
  el('#form-resena').addEventListener('submit', enviarResena);
  el('#res-texto').addEventListener('input', (e) => {
    el('#res-contador').textContent = e.target.value.length;
  });

  try {
    const [config, resenas] = await Promise.all([obtenerConfig(), resenasAprobadas()]);
    pintarSobreNosotros(config);
    pintarGaleria(config);
    pintarResenas(resenas);
  } catch (err) {
    console.warn('[Escape Tours] No se pudieron cargar las secciones', err);
    pintarResenas([]);
  }

  revelarAlEntrar(els('#sobre-nosotros .et-revela, #galeria .et-revela, #resenas .et-revela'));
}
