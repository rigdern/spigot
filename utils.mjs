export function h(tagName, props, children) {
  const el = document.createElement(tagName);
  (children || []).forEach(child => {
    el.appendChild(child);
  });
  Object.keys(props || {}).forEach(k => {
    el[k] = props[k];
  });
  return el;
}

export function input(children) { return h('input', {}, children); }
export function div(children) { return h('div', {}, children); }
export function p(children) { return h('p', {}, children); }
export function h3(children) { return h('h3', {}, children); }
export function hr() { return h('hr', {}, []); }
export function br() { return h('br', {}, []); }
export function text(data) { return document.createTextNode(data); }

export function range(begin, end, inc) {
  if (inc === undefined) inc = 1;
  
  const result = [];
  for (let i = begin; i < end; i+= inc) {
    result.push(i);
  }
  return result;
}

export function assert(pred, msg) {
  if (!pred) {
    throw new Error(msg || 'Assertion failed');
  }
}
