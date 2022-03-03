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
    state = {t: 0} // TODO: Should `t` be a Symbol to make collisions w/ user fields impossible?
    for (const stock of spec.filter(x => x.type === 'stock')) {
      state[stock.id] = stock.initialValue
    }
    state.history = {}
  }
  const newState = Object.assign({}, state);
  newState.t += 1

  // Run all flows and update state
  for (const flow of spec.filter(x => x.type === 'flow')) {
    const flux = flow.logic.apply(
      undefined,
      flow.inputs.map(input => resolve(spec, state, input))
    )

    if (lookup(spec, flow.to).type === 'stock') {
      newState[flow.to] += flux
    }
    if (lookup(spec, flow.from).type === 'stock') {
      newState[flow.from] -= flux
    }
  }

  return newState
}

// TODO: check for cycles in spec and error out
function resolve(spec, state, input) {
  const needHistory = typeof(input) === 'object'
  // list case ["sales"] for history declaration
  const id = needHistory ? input[0] : input
  const object = lookup(spec, id)

  // Initialize history record
  if (state.history[id] === undefined) {
    state.history[id] = []
  }

  // Update History Record
  if (state.history[id][state.t] === undefined) {
    let currVal
    switch (object.type) {
      case 'parameter':
        if (typeof(object.value) == 'function') {
          currVal = object.value(state.t)
        } else {
          currVal = object.value
        }
        break
      case 'converter':
        currVal = object.logic.apply(
          undefined,
          object.inputs.map(input => resolve(spec, state, input)))
        break
      case 'stock':
        currVal = state[id]
        break
      case 'flow':

        break
      default:
        throw new Error('resolve: unknown object type: ' + object.type);
    }
    state.history[id][state.t] = currVal
  }

  // Return correct output
  if (needHistory) {
    return makeRecordFunction(state.history[id])
  } else {
    return state.history[id][state.t]
  }

}

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
    addNode(graph, node1) // TODO: should this be `node2`?
  }
  incoming.get(node2).add(node1)
  outgoing.get(node1).add(node2)
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
  const set = new Set(spec.filter(obj => obj.type === "stock" || obj.type === "parameter"))
  const sorted = []

  // Preprocess spec so we can quickly look up outputs given an id
  const graph = new Map() // {"ok": ["asda", "asd"]}
  for (const obj of spec) {
    graph.set(obj.id, new Set())
  }
  for (const obj of spec) {
    for (const input of obj.inputs) {
      graph.get(input).add(obj.id)
    }
  }

  // traverse graph
  while (set.size !== 0) {
    const curr = set.values().next().value
    sorted.push(curr)

    for (const obj of graph.get(curr)) {
      graph.get(curr)
    }
  }
}
export { runStep }