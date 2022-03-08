// Thermostat example (figure 15)

const outdoorTempByHour = {
  hours8: 10,
  hours24: (time) => {
    const tempByHour = [ // Guesses based on graph at the bottom of pg 197. Meh.
      10, // 0 hours
      10, // 1 hours
      10, // 2 hours
      9, // 3 hours
      8, // 4 hours
      6, // 5 hours
      5, // 6 hours
      3, // 7 hours
      0, // 8 hours
      -3, // 9 hours
      -4, // 10 hours
      -5, // 11 hours
      -5, // 12 hours
      -5, // 13 hours
      -3.5, // 14 hours
      -2, // 15 hours
      -1, // 16 hours
      0, // 17 hours
      3, // 18 hours
      5, // 19 hours
      7, // 20 hours
      8, // 21 hours
      9, // 22 hours
      9.5, // 23 hours
      10, // 24 hours
    ];
    return tempByHour[time];
  },
}

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
    inputs: [
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
    inputs: [
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
    value: outdoorTempByHour.hours24,
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

export { spec }