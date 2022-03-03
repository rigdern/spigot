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