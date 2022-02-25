// Thermostat example (figure 15)

const spec = [
  { id: 'degrees Celsius', type: 'unit', name: 'degrees Celsius' },

  // initialValue by scenario
  //   - cold-room warming: 10 degrees C
  //   - warm-room cooling: 18 degrees C
  {
    id: 'room temperature',
    type: 'stock',
    name: 'room temperature',
    initialValue: 10,
    unit: 'degrees Celsius'
  },

  {
    id: 'furnace',
    type: 'boundary',
    unit: 'degrees Celsius'
  },

  {
    id: 'heat from furnace',
    type: 'flow',
    name: 'heat from furnace',
    from: 'furnace',
    to: 'room temperature',
    inConverters: [
      'discrepancy between desired and actual room temperatures'
    ],
    logic: function (discrepancy) {
      return Math.min(5, discrepancy)
    }
  },

  {
    id: 'outside',
    type: 'boundary',
    unit: 'degrees Celsius'
  },

  {
    id: 'heat to outside',
    type: 'flow',
    name: 'heat to outside',
    from: 'room temperature',
    to: 'outside',
    inConverters: [
      'discrepancy between inside and outside temperatures'
    ],
    logic: function (discrepancy) {
      return 0.1 * discrepancy
    }
  },

  {
    id: 'discrepancy between desired and actual room temperatures',
    type: 'converter',
    name: 'discrepancy between desired and actual room temperatures',
    inputs: [
      'room temperature',
      'thermostat setting',
    ],
    logic: function (roomTemperature, thermostatSetting) {
      return thermostatSetting - roomTemperature
    }
  },

  {
    id: 'discrepancy between inside and outside temperatures',
    type: 'converter',
    name: 'discrepancy between inside and outside temperatures',
    inputs: [
      'room temperature',
      'outside temperature',
    ],
    logic: function (roomTemperature, outsideTemperature) {
      return roomTemperature - outsideTemperature
    }
  },

  {
    id: 'thermostat setting',
    type: 'parameter',
    name: 'thermostat setting',
    value: 18,
    unit: 'degrees Celsius'
  },
  {
    id: 'outside temperature',
    type: 'parameter',
    name: 'outside temperature',
    value: 10,
    unit: 'degrees Celsius'
  }, // TODO: Value needs to vary over time

  
]

/*
  * Figures on pg 37
  * Model on pg 197
  * Stock: room temperature(t) = room temperature(t - dt) + (heat from furnace - heat to outside) x dt
  * Initial stock value: room temperature = 10 degrees C for cold-room warming; 18 degrees C for warm-room cooling
  * t = hours
  * dt = 1 hour
  * Run time = 8 hours and 24 hours
  * Inflow: heat from furnace = minimum of discrepancy between desired and actual room temperature or 5
  * Outflow: heat to outside =
  *   discrepancy between inside and outside temperature x 10% ... for "normal" house;
  *   discrepancy between inside and outside temperature x 30% ... for very leaky house
  * Converters: thermostat setting = 18 degrees C
  *   discrepancy between desired and actual room temperature = maximum of (thermostat setting - room temperature) and 0
  *   discrepancy between inside and outside temperature = room temperature - 10 degrees C ... for constant outside temperature (Figures 16-18);
  *     room temperature - 24-hour outside temp...for full day-and-night cycle (Figures 19 and 20)
*/

function runStep(spec, state) {
  const newState = {}

  // Initialize state if necessary
  if (state === undefined) {
    state = {}
    for (const stock of spec.filter(x => x.type === 'stock')) {
      state[stock.id] = stock.initialValue
    }
  }
  Object.assign(newState, state)

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
      return object.value
    case 'converter': 
      return resolveConverter(spec, state, object)
    case 'stock':
      return state[object.id]
  }
}

function range(begin, end, inc) {
  if (inc === undefined) inc = 1;
  
  const result = [];
  for (let i = begin; i < end; i+= inc) {
    result.push(i);
  }
  return result;
}

function lookup(spec, id) {
  for (obj of spec) {
    if (obj.id === id) {
      return obj
    }
  }
  throw new Error(`lookup: Failed to find object with id ${id} in spec given`)
}

let state = runStep(spec);
console.table(range(0, 99).
  reduce((statelog, _) => (statelog.push(runStep(spec, statelog[statelog.length - 1])), statelog), [])
)