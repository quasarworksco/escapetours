/** Helpers mínimos de DOM. Nada de framework: la app tiene pocas pantallas. */

export const el = (sel, raiz = document) => raiz.querySelector(sel);
export const els = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

export function crear(tag, props = {}, hijos = []) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') nodo.className = v;
    else if (k === 'html') nodo.innerHTML = v;
    else if (k === 'text') nodo.textContent = v;
    else if (k.startsWith('on')) nodo.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) nodo.setAttribute(k, v);
  }
  for (const h of [].concat(hijos)) {
    if (h) nodo.append(h.nodeType ? h : document.createTextNode(h));
  }
  return nodo;
}

export function mostrar(nodo, visible = true) {
  if (nodo) nodo.hidden = !visible;
}

let temporizadorToast;
/** Aviso flotante. tipo: 'ok' | 'error' | 'info' */
export function toast(mensaje, tipo = 'info', ms = 4000) {
  let caja = el('#et-toast');
  if (!caja) {
    caja = crear('div', { id: 'et-toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(caja);
  }
  caja.className = `et-toast et-toast--${tipo}`;
  caja.textContent = mensaje;
  caja.hidden = false;
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => { caja.hidden = true; }, ms);
}

/** Bloquea un botón mientras corre una operación asíncrona. */
export async function conCarga(boton, fn) {
  if (!boton) return fn();
  const original = boton.textContent;
  boton.disabled = true;
  boton.dataset.cargando = 'true';
  try {
    return await fn();
  } finally {
    boton.disabled = false;
    delete boton.dataset.cargando;
    boton.textContent = original;
  }
}

/** Diálogo de confirmación sencillo (envuelve confirm para poder mejorarlo luego). */
export function confirmar(mensaje) {
  return window.confirm(mensaje);
}
