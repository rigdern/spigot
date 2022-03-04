import { assert } from './utils.mjs';

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
//   from: string; // ID of an IStock, IBoundary
//   to: string; // ID of an IStock, IBoundary
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

// Inputs that contain today's value:
//   - converter
//   - parameter
//   - currTime (will never be 0)
// Inputs that contain previous day's value:
//   - stock
//   - flow

// Questions people may have when implementing a model:
//   - Does an input represent the value for today or the previous day?
//   - Does my logic ever run when currTime is 0?

const stateInput = Symbol('state')
const implicitSpec = [
  {
    id: 'currTime',
    type: 'parameter',
    inputs: [stateInput],
    logic: (state) => state.t + 1
  }
]

// TODO: Should we have a `getInitialState` function in case the user wants
//   access to the initial state of their simulation for graphing purposes or
//   something? Currently, the earliest state they can get is that of time 1 by
//   calling `runStep`.

function runStep(spec, state) {
  spec = spec.concat(implicitSpec)

  // Initialize state if necessary
  if (state === undefined) {
    state = { t: 0, history: {} }
    for (const stock of spec.filter(x => x.type === 'stock')) {
      state.history[stock.id] = [stock.initialValue]
    }
  }
  const newState = Object.assign({}, state);
  newState.t += 1

  topSorted = topologicalSort(spec)

  for (const id of topSorted) {
    resolve(spec, id, state, newState)
  }

  for (const flow of spec.filter(obj => obj.type === 'flows')) {
    if (lookup(spec, flow.from).type === 'stock') {
      newState.history[flow.from][newState.t] -= newState.history[flow.id][newState.t]
    }
    if (lookup(spec, flow.to).type === 'stock') {
      newState.history[flow.to][newState.t] += newState.history[flow.id][newState.t]
    }
  }

  return newState
}

function resolve(spec, id, state, newState) {
  const obj = lookup(spec, id)
  let currVal

  switch (obj.type) {
    case 'parameter':
      if (typeof(object.value) === 'function') {
        currVal = object.value(newState.t)
      } else {
        currVal = object.value
      }
      break
    case 'stock':
      // for easy resolving; the actual stock for today is updated later
      currVal = state.history[obj.id][state.t]
      break
    case 'flow':
      currVal = obj.logic(...obj.inputs
        .map(input => {
          const needHistory = typeof(id) === 'object'
          const id = needHistory ? input[0] : input
          return needHistory ? state.history[id] : state.history[id][newState.t]
        }))
      break
    case 'converter':

      break
    default:
      throw new Error(`resolve: invalid object ${obj}`)
  }
  state.history[obj.id][newState.t] = currVal
}

function getInputId(input) {
  return typeof(input) === 'object' ? input[0] : input
}


// TODO: check for cycles in spec and error out
//function resolve(spec, state, input) {
//  const needHistory = typeof(input) === 'object'
//  // list case ["sales"] for history declaration
//  const id = needHistory ? input[0] : input
//  const object = lookup(spec, id)
//
//  // Initialize history record
//  if (state.history[id] === undefined) {
//    state.history[id] = []
//  }
//
//  // Update History Record
//  if (state.history[id][state.t] === undefined) {
//    let currVal
//    switch (object.type) {
//      case 'parameter':
//        if (typeof(object.value) == 'function') {
//          currVal = object.value(state.t)
//        } else {
//          currVal = object.value
//        }
//        break
//      case 'converter':
//        currVal = object.logic.apply(
//          undefined,
//          object.inputs.map(input => resolve(spec, state, input)))
//        break
//      case 'stock':
//        currVal = state[id]
//        break
//      case 'flow':
//
//        break
//      default:
//        throw new Error('resolve: unknown object type: ' + object.type);
//    }
//    state.history[id][state.t] = currVal
//  }
//
//  // Return correct output
//  if (needHistory) {
//    return makeRecordFunction(state.history[id])
//  } else {
//    return state.history[id][state.t]
//  }
//
//}

// TODO: check indices in range
// TODO: handle the stock vs converter current day thing
function makeRecordFunction(history) {
  return (time1, time2) => {
    if (time2 === undefined) {
      return history[time1]
    } else {
      return history.slice(time1, time2)
    }
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

function makeGraph() {
  const graph = [new Map(), new Map()] // [node -> outgoing edges, node -> incoming edges]
  return graph
}

function addNode(graph, node) {
  const [outgoing, incoming] = graph
  assert(!(outgoing.has(node) || incoming.has(node)))
  outgoing.set(node, new Set())
  incoming.set(node, new Set())
  return graph
}

// Adds an edge from node1 to node2 in graph
function addEdge(graph, node1, node2) {
  const [outgoing, incoming] = graph
  if (!outgoing.has(node1)) {
    addNode(graph, node1)
  }
  if (!incoming.has(node2)) {
    addNode(graph, node2)
  }
  incoming.get(node2).add(node1)
  outgoing.get(node1).add(node2)
  return graph
}

function delEdge(graph, node1, node2) {
  const [outgoing, incoming] = graph
  assert(outgoing.get(node1).has(node2))
  assert(incoming.get(node2).has(node1))
  outgoing.get(node1).delete(node2)
  incoming.get(node2).delete(node1)
  return graph
}

function getOutEdges(graph, node) {
  const [outgoing, _] = graph
  return outgoing.get(node)
}

function getInEdges(graph, node) {
  const [_, incoming] = graph
  return incoming.get(node)
}

function topologicalSort(spec) {
  // Kahn's algorithm

  // Ignore: units, boundary
  // Initial set: stock, parameter
  // To process: flow, converter

  const initialSet = []
  const inputSet = []

  for (const obj of spec) {
    if (obj.type === 'unit' || obj.type === 'boundary') {
      // do nothing
    } else if (obj.type === 'stock' || obj.type === 'parameter') {
      initialSet.push(obj)
    } else if (obj.type === 'flow' || obj.type === 'converter') {
      inputSet.push(obj)
    } else {
      assert(false, 'Unknown object type to sort')
    }
  }

  const set = new Set(initialSet.map(obj => obj.id))
  const sorted = []

  // Preprocess spec so we can quickly look up outputs given an id
  const graph = makeGraph()
  for (const obj of inputSet) {
    for (const input of obj.inputs) {
      addEdge(graph, getInputId(input), obj.id)
    }
  }

  // traverse graph
  while (set.size !== 0) {
    const curr = set.values().next().value
    set.delete(curr)
    sorted.push(curr)

    for (const outId of getOutEdges(graph, curr)) {
      delEdge(graph, curr, outId)
      if (getInEdges(graph, outId).size === 0) {
        set.add(outId)
      }
    }
  }

  assert(initialSet.length + inputSet.length === sorted.length, 'Specification not a DAG!')

  return sorted
}
export { runStep, topologicalSort, implicitSpec }