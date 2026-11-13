// Tiny DOM helpers shared by the views.

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') node.className = value;
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  node.append(...children.flat().filter((child) => child != null && child !== false));
  return node;
}

const SYMBOL_CLASS = { '.': 'dot', '-': 'dash', ' ': 'gap', '/': 'word-gap' };

// Draws a code as dot and dash shapes, readable by screen readers as text.
export function codeView(code, extraClass = '') {
  const node = el('span', { class: `code ${extraClass}`.trim(), role: 'img' });
  node.setAttribute('aria-label', code || 'empty');
  for (const symbol of code) {
    const cls = SYMBOL_CLASS[symbol];
    if (cls) node.append(el('span', { class: cls }));
  }
  return node;
}
