import { range } from './utils.mjs';

// Types
//
// interface IUnit {
//   type: 'unit';
//   id: string;
//   name: string;
// }
//
// interface IParameter {
//   type: 'parameter';
//   id: string;
//   name: string;
//   value: any | (time: number) => any;
//   unit: string; // ID of an IUnit
// }
//
// interface IBoundary {
//   type: 'boundary';
//   id: string;
//   unit: string; // ID of an IUnit
// }
//
// interface IStock {
//   type: 'stock';
//   id: string;
//   name: string;
//   initialValue: number;
//   unit: string; // ID of an IUnit
// }
//
// interface IFlow {
//   type: 'flow';
//   id: string;
//   name: string;
//   from: string; // ID of an IStock
//   to: string; // ID of an IStock
//   inConverters: string[]; // IDs of IConverters
//   logic: (...any[]) => number; // Maps output of inConverters to flow rate
// }
//
// interface IConverter {
//   type: 'converter';
//   id: string;
//   name: string;
//   inputs: string[]; // IDs of IParameters, IConverters, IFlows, and IStocks.
//   logic: (...number[]) => any; // Maps inputs to anything
// }


function runStep(spec, state) {
  // Initialize state if necessary
  if (state === undefined) {
    state = {t: 0}
    for (const stock of spec.filter(x => x.type === 'stock')) {
      state[stock.id] = stock.initialValue
    }
  }
  const newState = Object.assign({}, state);
  newState.t += 1

  // Run all flows and update state
  for (const flow of spec.filter(x => x.type === 'flow')) {
    const flux = flow.logic.apply(undefined, flow.inConverters.map(x => resolveConverter(spec, state, x)))

    if (lookup(spec, flow.to).type === 'stock') {
      newState[flow.to] += flux
    }
    if (lookup(spec, flow.from).type === 'stock') {
      newState[flow.from] -= flux
    }
  }

  return newState
}

function resolveConverter(spec, state, converterId) {
  const converter = lookup(spec, converterId)
  return converter.logic.apply(undefined, converter.inputs.map(input => resolve(spec, state, input)))
}

function resolve(spec, state, id) {
  const object = lookup(spec, id)
  switch (object.type) {
    case 'parameter':
      if (typeof(object.value) == 'function') {
          return object.value(state.t)
      } else {
        return object.value
      }
        
    case 'converter': 
      return resolveConverter(spec, state, object)
    case 'stock':
      return state[object.id]
  }
}

function lookup(spec, id) {
  for (const obj of spec) {
    if (obj.id === id) {
      return obj
    }
  }
  throw new Error(`lookup: Failed to find object with id ${id} in spec given`)
}
export { runStep }