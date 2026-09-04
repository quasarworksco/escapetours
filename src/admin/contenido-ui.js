/** Pestaña "Contenido": texto de "Sobre nosotros" y galería de fotos. */
import { el, crear, toast, conCarga } from '../utils/dom.js';
import { esc, urlImagenValida } from '../utils/formato.js';
import { guardarConfig, CONFIG_POR_DEFECTO } from '../modelo/config.js';
import { mensajeDeError } from '../modelo/errores.js';
import { estado, actualizarConfig } from './estado.js';

let borrador = null;
let pintado = false;

function clonar(config) {
  const sobre = config.sobreNosotros || CONFIG_POR_DEFECTO.sobreNosotros;
  return {
    sobreNosotros: {
      titulo: sobre.titulo || '',
      texto: sobre.texto || '',
      puntos: [...(sobre.puntos || [])],
      fotoUrl: sobre.fotoUrl || '',
    },
    galeria: (config.galeria || []).map((f) => ({ ...f })),
  };
}

export function renderContenido() {
  const cont = el('#editor-contenido');
  if (!cont) return;
  if (estado.cargando) {
    cont.innerHTML = '<div class="et-cargando">Cargando…</div>';
    return;
  }
  // Se pinta una sola vez: repintar borraría lo que se esté escribiendo.
  if (pintado) return;
  if (!borrador) borrador = clonar(estado.config || CONFIG_POR_DEFECTO);
  pintar(cont);
  pintado = true;
}

function pintar(cont) {
  const s = borrador.sobreNosotros;
  cont.innerHTML = `
    <h3>Sobre nosotros</h3>
    <p class="et-aviso et-aviso--info">
      Este bloque aparece en la página principal. Si dejas el texto vacío, la
      sección no se muestra.
    </p>

    <div class="et-campo" style="margin-top:1.25rem">
      <label for="sobre-titulo-in">Título</label>
      <input class="et-input" id="sobre-titulo-in" maxlength="80" value="${esc(s.titulo)}">
    </div>

    <div class="et-campo">
      <label for="sobre-texto-in">Texto</label>
      <textarea class="et-textarea" id="sobre-texto-in" maxlength="900"
                style="min-height:140px">${esc(s.texto)}</textarea>
    </div>

    <div class="et-campo">
      <label for="sobre-puntos-in">Puntos destacados (uno por línea)</label>
      <textarea class="et-textarea" id="sobre-puntos-in"
                placeholder="Salidas todos los meses&#10;Grupos pequeños">${esc(s.puntos.join('\n'))}</textarea>
    </div>

    <div class="et-campo">
      <label for="sobre-foto-in">URL de la foto (opcional)</label>
      <input class="et-input" type="url" id="sobre-foto-in" value="${esc(s.fotoUrl)}"
             placeholder="https://...">
      <img class="admin-preview" id="sobre-foto-prev" alt="" hidden>
    </div>

    <hr style="border:none; border-top:1px solid var(--et-borde); margin:2rem 0">

    <h3>Galería de fotos</h3>
    <p class="et-aviso et-aviso--info">
      Fotos de viajes que ya se hicieron. La primera se muestra más grande.
      Si no agregas ninguna, la sección no aparece en la página.
    </p>

    <div id="lista-galeria" style="margin-top:1.25rem"></div>
    <button class="et-btn et-btn--contorno et-btn--sm" type="button" id="btn-agregar-foto"
            style="margin-top:0.75rem">+ Agregar foto</button>

    <div style="margin-top:2rem">
      <button class="et-btn et-btn--sol" type="button" id="btn-guardar-contenido">
        Guardar cambios
      </button>
    </div>`;

  const vincular = (id, alCambiar) =>
    el(id).addEventListener('input', (e) => alCambiar(e.target.value));

  vincular('#sobre-titulo-in', (v) => { borrador.sobreNosotros.titulo = v; });
  vincular('#sobre-texto-in', (v) => { borrador.sobreNosotros.texto = v; });
  vincular('#sobre-puntos-in', (v) => {
    borrador.sobreNosotros.puntos = v.split('\n').map((l) => l.trim()).filter(Boolean);
  });
  vincular('#sobre-foto-in', (v) => {
    borrador.sobreNosotros.fotoUrl = v;
    previsualizar(el('#sobre-foto-prev'), v);
  });
  previsualizar(el('#sobre-foto-prev'), s.fotoUrl);

  el('#btn-agregar-foto').addEventListener('click', () => {
    borrador.galeria.push({ url: '', titulo: '' });
    pintarGaleria();
  });
  el('#btn-guardar-contenido').addEventListener('click', (e) => guardar(e.currentTarget));

  pintarGaleria();
}

function previsualizar(img, url) {
  if (urlImagenValida(url)) {
    img.src = url;
    img.hidden = false;
  } else {
    img.hidden = true;
  }
}

function pintarGaleria() {
  const cont = el('#lista-galeria');
  cont.innerHTML = '';

  borrador.galeria.forEach((foto, i) => {
    const fila = crear('div', { class: 'admin-foto' });

    const miniatura = crear('img', { class: 'admin-foto__mini', alt: '' });
    previsualizar(miniatura, foto.url);
    miniatura.addEventListener('error', () => { miniatura.hidden = true; });

    const url = crear('input', {
      class: 'et-input', type: 'url', value: foto.url,
      placeholder: 'https://... (enlace directo a la imagen)',
      'aria-label': 'URL de la foto',
    });
    url.addEventListener('input', (e) => {
      borrador.galeria[i].url = e.target.value;
      previsualizar(miniatura, e.target.value);
    });

    const titulo = crear('input', {
      class: 'et-input', value: foto.titulo,
      placeholder: 'Pie de foto (opcional)', 'aria-label': 'Pie de foto',
    });
    titulo.addEventListener('input', (e) => { borrador.galeria[i].titulo = e.target.value; });

    const quitar = crear('button', {
      class: 'et-btn et-btn--peligro et-btn--sm', type: 'button', text: 'Quitar',
      onclick: () => { borrador.galeria.splice(i, 1); pintarGaleria(); },
    });

    fila.append(miniatura, url, titulo, quitar);
    cont.append(fila);
  });

  if (!borrador.galeria.length) {
    cont.append(crear('p', { class: 'et-ayuda', text: 'Todavía no hay fotos en la galería.' }));
  }
}

async function guardar(boton) {
  await conCarga(boton, async () => {
    try {
      // Se conserva lo que ya había guardado en config/app (datos de pago).
      const config = await guardarConfig({ ...estado.config, ...borrador });
      actualizarConfig(config);
      borrador = clonar(config);
      toast('Contenido actualizado.', 'ok');
    } catch (err) {
      toast(mensajeDeError(err), 'error');
    }
  });
}
