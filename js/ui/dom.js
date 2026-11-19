// Malý pomocník na tvorbu DOM: h('div', { class: 'x', onclick }, ...děti).

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

// <select> z dvojic [hodnota, popisek]
export function selectBox(options, value, onChange, attrs = {}) {
  const el = h('select', { ...attrs, onchange: (e) => onChange(e.target.value) },
    options.map(([v, label]) => h('option', { value: v }, label)));
  el.value = String(value);
  return el;
}

export function setOptions(el, options, value) {
  el.replaceChildren(...options.map(([v, label]) => h('option', { value: v }, label)));
  el.value = String(value);
}

// Klávesa ve stylu magnetofonu. latch = zůstává zamáčknutá (aria-pressed).
export function deckKey({ label, symbol, red = false, latch = false, title, onclick, wide = false }) {
  return h('div', { class: 'deck-key-wrap' },
    h('span', { class: 'deck-key-symbol', 'aria-hidden': 'true' }, symbol ?? ''),
    h('button', {
      class: `deck-key${red ? ' is-red' : ''}${wide ? ' is-wide' : ''}`,
      type: 'button',
      title: title ?? label,
      'aria-label': label,
      'aria-pressed': latch ? 'false' : null,
      onclick,
    }),
    h('span', { class: 'deck-key-label' }, label));
}

export const setPressed = (wrap, on) => wrap.querySelector('.deck-key').setAttribute('aria-pressed', on ? 'true' : 'false');
