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
//   inputs: string[]; // IDs of IParameters, IConverters, IFlows, and IStocks.
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

// On the topic of the record functions, I think they should take relative times, not absolute times
// the reasoning being that absolute times ruins the declarative iterative nature of the model

// Questions people may have when implementing a model:
//   - Does an input represent the value for today or the previous day?
//   - Does my logic ever run when currTime is 0?

const implicitSpec = [
  {
    id: 'currTime',
    name: "Current Timestep",
    type: 'parameter',
    value: (currTime) => currTime
  }
]

// TODO: Should we have a `getInitialState` function in case the user wants
//   access to the initial state of their simulation for graphing purposes or
//   something? Currently, the earliest state they can get is that of time 1 by
//   calling `runStep`.

function runStep(spec, state) {
  spec = spec.concat(implicitSpec)

  let newState = {}
  // Initialize state if necessary
  if (state === undefined) {
    newState = { t: 0, history: {} }
    for (const stock of spec.filter(x => x.type === 'stock')) {
      newState.history[stock.id] = [stock.initialValue]
    }
  } else {
    Object.assign(newState, state)
    newState.t += 1
    // Initialize current timestep's stocks
    for (const stock of spec.filter(obj => obj.type === 'stock')) {
      newState.history[stock.id][newState.t] = newState.history[stock.id][state.t]
    }
    // Update today's stocks with the flows from last timestep
    for (const flow of spec.filter(obj => obj.type === 'flow')) {
      if (lookup(spec, flow.from).type === 'stock') {
        newState.history[flow.from][newState.t] -= newState.history[flow.id][state.t]
      }
      if (lookup(spec, flow.to).type === 'stock') {
        newState.history[flow.to][newState.t] += newState.history[flow.id][state.t]
      }
    }
  }

  const topSorted = topologicalSort(spec)

  for (const id of topSorted) {
    resolve(spec, id, newState)
  }
  return newState
}

// heat from furnace: 0.5
// heat to outside: 0.8500000000000001

function resolve(spec, id, newState) {
  const obj = lookup(spec, id)
  let currVal

  switch (obj.type) {
    case 'parameter':
      if (typeof(obj.value) === 'function') {
        currVal = obj.value(newState.t)
      } else {
        currVal = obj.value
      }
      break
    case 'stock':
      break // nothing to do, was updated already
    case 'flow':
    case 'converter':
      currVal = obj.logic(...obj.inputs
        .map(input => {
          const needHistory = typeof(input) === 'object'
          const id = needHistory ? input[0] : input
          return needHistory 
                  ? makeRecordFunction(spec, id, newState.history[id], newState.t) 
                  : newState.history[id][newState.t]
        }))
      break
    default:
      throw new Error(`resolve: invalid object ${obj}`)
  }
  if (newState.history[obj.id] === undefined) {
    newState.history[obj.id] = []
  }
  if (currVal !== undefined) {
    newState.history[obj.id][newState.t] = currVal
  }
}

// TODO: Change representation of inputs that need history from this:
//   ['orders']
// to this:
//   { id: 'orders', needsHistory: true }
function getInputId(input) {
  return typeof(input) === 'object' ? input[0] : input
}

//  0 1 2 3 4 5 6
// [a,b,c,d,e,f,g]
// t = 6
// time1 = 0, time2 = 1
// t - time2 = 6 - 1 = 5
// t - time1 = 6 - 0 = 6

// TODO: check indices in range
// TODO: handle the stock vs converter current day thing
function makeRecordFunction(spec, id, history, t) {
  const type = lookup(spec, id).type
  return (time1, time2) => {
    if (time2 === undefined) {
      return history[t - time1]
    } else {
      return history.slice(
        Math.max(0, t - time2 + 1),
        Math.max(0, t - time1 + 1)
      ).reverse()
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
      if (obj.inputs.length === 0) {
        initialSet.push(obj)
      } else {
        inputSet.push(obj)
      }
    } else {
      assert(false, 'Unknown object type to sort')
    }
  }

  const set = new Set(initialSet.map(obj => obj.id))
  const sorted = []

  // Preprocess spec so we can quickly look up outputs given an id
  const graph = makeGraph()
  for (const obj of spec) {
    addNode(graph, obj.id)
  }
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

function cloneNode(node) {
  const newNode = Object.assign({}, node);
  if (newNode.inputs) {
    newNode.inputs = newNode.inputs.map(input => typeof(input) === 'object' ? input.slice(0) : input);
  }
  return newNode;
}

export { runStep, implicitSpec, getInputId, cloneNode }
