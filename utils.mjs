export function makeElement(tagName, children) {
  const el = document.createElement(tagName);
  (children || []).forEach(child => {
    el.appendChild(child);
  });
  return el;
}

export function input(children) { return makeElement('input', children); }
export function div(children) { return makeElement('div', children); }
export function p(children) { return makeElement('p', children); }
export function h3(children) { return makeElement('h3', children); }
export function hr() { return makeElement('hr', []); }
export function br() { return makeElement('br', []); }
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
